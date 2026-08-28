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

await browser.close();

// --- favicon.ico: контейнер из PNG-кадров 16/32/48 -------------------------
// ICO разрешает PNG внутри — так понимают все браузеры от IE11 и краулеры.
const frames = [16, 32, 48].map((s) => ({ size: s, data: png[s] }));

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(frames.length, 4);

let offset = 6 + frames.length * 16;
const dir = [];
for (const f of frames) {
  const e = Buffer.alloc(16);
  e.writeUInt8(f.size === 256 ? 0 : f.size, 0); // width
  e.writeUInt8(f.size === 256 ? 0 : f.size, 1); // height
  e.writeUInt8(0, 2); // palette
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // color planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(f.data.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += f.data.length;
  dir.push(e);
}

const ico = Buffer.concat([header, ...dir, ...frames.map((f) => f.data)]);
fs.writeFileSync(path.join(OUT, 'favicon.ico'), ico);
console.log(`  favicon.ico  (${frames.map((f) => f.size).join('/')}, ${ico.length} b)`);
