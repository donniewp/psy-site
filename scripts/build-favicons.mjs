// Растеризует public/favicon.svg в набор PNG и собирает favicon.ico.
//
// Зачем: поисковики берут значок не из <link rel="icon" type="image/svg+xml">.
// Яндекс сначала дёргает /favicon.ico в корне, Google игнорирует PNG мельче
// 48×48 (требует сторону, кратную 48). Одного SVG для выдачи не хватает.
//
// Запуск: node scripts/build-favicons.mjs (нужен playwright chromium)

import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const SRC = 'public/favicon.svg';
const OUT = 'public';

// 16/32 — вкладки браузера; 48/96 — Google (кратно 48); 120 — рекомендация
// Яндекса; 180 — apple-touch-icon; 192/512 — Android / web manifest.
const SIZES = [16, 32, 48, 96, 120, 180, 192, 512];
const NAMES = {
  180: 'apple-touch-icon.png',
  192: 'icon-192.png',
  512: 'icon-512.png',
};
const nameFor = (s) => NAMES[s] ?? `favicon-${s}x${s}.png`;

// iOS и Android накладывают собственную маску, а прозрачные углы рисуют чёрным,
// поэтому иконки для домашнего экрана кладём на непрозрачный фирменный фон.
const OPAQUE = new Set([180, 192, 512]);
const BRAND = '#0E6E5B';

const svg = fs.readFileSync(SRC, 'utf8');
const svgDataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

const png = {};
for (const size of SIZES) {
  await page.setViewportSize({ width: size, height: size });
  const opaque = OPAQUE.has(size);
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:${opaque ? BRAND : 'transparent'}}
     img{display:block;width:${size}px;height:${size}px;image-rendering:auto}</style>
     <img src="${svgDataUri}">`
  );
  await page.locator('img').waitFor();
  png[size] = await page.screenshot({ omitBackground: !opaque });
  fs.writeFileSync(path.join(OUT, nameFor(size)), png[size]);
  console.log(`  ${nameFor(size)}  (${png[size].length} b)`);
}

// --- favicon.ico ----------------------------------------------------------
/* favicon.ico — намеренно самый консервативный файл на сайте.

   Яндекс требует от фавиконки размер 16×16, 32×32 или 120×120 и чтобы она была
   ОДНОСЛОЙНОЙ; прежний ico был контейнером из трёх кадров (16/32/48), причём
   каждый кадр — PNG внутри ico. Из-за этого робот выдачи её не забирал.
   Поэтому здесь один кадр 32×32 и классический несжатый DIB, как в 1995-м:
   такой ico читает вообще любой декодер. Браузерам крупные варианты приходят
   ссылками на PNG и SVG, им ico уже давно нужен только как запасной. */
const ICO_SIZE = 32;

const rgba = await page.evaluate(async ({ uri, size }) => {
  const img = new Image();
  img.src = uri;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, size, size);
  return Array.from(ctx.getImageData(0, 0, size, size).data);
}, { uri: svgDataUri, size: ICO_SIZE });

// DIB внутри ico: строки идут снизу вверх и в порядке BGRA, а высота в
// заголовке удвоена — за картинкой следует маска прозрачности.
const stride = ICO_SIZE * 4;
const pixels = Buffer.alloc(stride * ICO_SIZE);
for (let y = 0; y < ICO_SIZE; y++) {
  const src = (ICO_SIZE - 1 - y) * stride;
  const dst = y * stride;
  for (let x = 0; x < ICO_SIZE; x++) {
    pixels[dst + x * 4] = rgba[src + x * 4 + 2];     // B
    pixels[dst + x * 4 + 1] = rgba[src + x * 4 + 1]; // G
    pixels[dst + x * 4 + 2] = rgba[src + x * 4];     // R
    pixels[dst + x * 4 + 3] = rgba[src + x * 4 + 3]; // A
  }
}

// Маска: у 32-битного кадра прозрачность берётся из альфы, поэтому маска
// нулевая — но занимать место в файле она обязана, иначе кадр невалиден.
const maskStride = Math.ceil(ICO_SIZE / 32) * 4;
const mask = Buffer.alloc(maskStride * ICO_SIZE);

const dib = Buffer.alloc(40);
dib.writeUInt32LE(40, 0);              // размер заголовка
dib.writeInt32LE(ICO_SIZE, 4);         // ширина
dib.writeInt32LE(ICO_SIZE * 2, 8);     // высота: кадр + маска
dib.writeUInt16LE(1, 12);              // плоскости
dib.writeUInt16LE(32, 14);             // бит на пиксель
dib.writeUInt32LE(0, 16);              // без сжатия
dib.writeUInt32LE(pixels.length + mask.length, 20);

const frame = Buffer.concat([dib, pixels, mask]);

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // ровно один кадр

const entry = Buffer.alloc(16);
entry.writeUInt8(ICO_SIZE, 0);
entry.writeUInt8(ICO_SIZE, 1);
entry.writeUInt8(0, 2);  // палитры нет
entry.writeUInt8(0, 3);  // reserved
entry.writeUInt16LE(1, 4);
entry.writeUInt16LE(32, 6);
entry.writeUInt32LE(frame.length, 8);
entry.writeUInt32LE(22, 12); // 6 байт заголовка + 16 байт записи

await browser.close();

const ico = Buffer.concat([header, entry, frame]);
fs.writeFileSync(path.join(OUT, 'favicon.ico'), ico);
console.log(`  favicon.ico  (${ICO_SIZE}x${ICO_SIZE}, однослойный DIB, ${ico.length} b)`);
