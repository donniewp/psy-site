/**
 * Скриншоты секции во всех состояниях + автопроверка на наложения.
 *
 * Установка (один раз):
 *   npm i -D playwright && npx playwright install chromium
 *
 * Запуск (дев-сервер должен быть поднят):
 *   node shot.mjs
 *   node shot.mjs --section razvivayka --url http://localhost:4321/
 *
 * На выходе — PNG в ./screens/ и отчёт о наложениях в консоль.
 * После прогона ОТКРОЙ полученные картинки и посмотри на них.
 */

import { chromium } from 'playwright';
import { mkdir, rm } from 'node:fs/promises';

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};

const URL = arg('url', 'http://localhost:4321/');
const SECTION = arg('section', 'razvivayka');
const OUT = arg('out', './screens');

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

/** Ищет пересечения картинок с текстом и вылеты за границы секции. */
const AUDIT = (sectionId) => {
  const s = document.getElementById(sectionId);
  if (!s) return { error: 'секция не найдена' };
  const sr = s.getBoundingClientRect();

  const box = (e) => e.getBoundingClientRect();
  const visible = (r) => r.width > 4 && r.height > 4;

  const gfx = [...s.querySelectorAll('svg, img')]
    .map((e) => ({ e, r: box(e) }))
    .filter((x) => visible(x.r));

  const text = [...s.querySelectorAll('p, span, div, li, h2, h3')]
    .filter((e) => e.children.length === 0 && e.textContent.trim().length > 8)
    .map((e) => ({ e, r: box(e) }))
    .filter((x) => visible(x.r));

  const overlaps = [];
  for (const g of gfx) {
    for (const t of text) {
      const w = Math.min(g.r.right, t.r.right) - Math.max(g.r.left, t.r.left);
      const h = Math.min(g.r.bottom, t.r.bottom) - Math.max(g.r.top, t.r.top);
      if (w > 2 && h > 2) {
        overlaps.push({
          graphic: `${g.e.tagName} ${Math.round(g.r.width)}x${Math.round(g.r.height)}`,
          text: t.e.textContent.trim().slice(0, 45),
          area: Math.round(w * h),
        });
      }
    }
  }

  const escaped = [...s.querySelectorAll('*')]
    .map((e) => ({ e, r: box(e) }))
    .filter((x) => visible(x.r))
    .filter((x) => x.r.top < sr.top - 2 || x.r.bottom > sr.bottom + 2 ||
                   x.r.left < sr.left - 2 || x.r.right > sr.right + 2)
    .slice(0, 8)
    .map((x) => ({
      el: `${x.e.tagName}.${(x.e.className?.baseVal ?? x.e.className ?? '').toString().slice(0, 24)}`,
      text: x.e.textContent.trim().slice(0, 20),
    }));

  return {
    overlaps: overlaps.sort((a, b) => b.area - a.area).slice(0, 6),
    escaped,
    overflowX: document.documentElement.scrollWidth > window.innerWidth,
  };
};

/** Возвращает селекторы строк — прямые потомки с картинкой внутри. */
const ROWS = (sectionId) => {
  const s = document.getElementById(sectionId);
  if (!s) return 0;
  const buttons = [...s.querySelectorAll('button')].filter(
    (e) => e.querySelector('svg, img') && e.getBoundingClientRect().height > 0
  );
  const rows = buttons.length
    ? buttons
    : [...s.querySelectorAll('*')].filter(
        (e) => e.querySelector('svg, img') &&
               e.getBoundingClientRect().height > 60 &&
               e.getBoundingClientRect().height < 300 &&
               ![...e.children].some((c) => c.querySelector('svg, img'))
      );
  rows.forEach((r, i) => r.setAttribute('data-shot-row', String(i)));
  return rows.length;
};

const run = async () => {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch();
  let problems = 0;

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });

    console.log(`\n=== ${vp.name} ${vp.width}x${vp.height} ===`);
    await page.goto(URL, { waitUntil: 'networkidle' });

    const sel = `#${SECTION}`;
    const section = page.locator(sel);
    if ((await section.count()) === 0) {
      console.log(`  секция ${sel} не найдена`);
      await page.close();
      continue;
    }

    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200); // дать доиграть scroll-reveal

    // покой
    await section.screenshot({ path: `${OUT}/${vp.name}-00-rest.png` });
    console.log(`  + ${vp.name}-00-rest.png`);

    let audit = await page.evaluate(AUDIT, SECTION);
    report('покой', audit);

    // состояния наведения — только на десктопе, на мобильном hover нет
    if (vp.name === 'desktop') {
      const n = await page.evaluate(ROWS, SECTION);
      console.log(`  строк найдено: ${n}`);

      for (let i = 0; i < n; i++) {
        const row = page.locator(`[data-shot-row="${i}"]`);
        await row.hover();
        await page.waitForTimeout(700); // дать анимации доиграть

        const label = (await row.innerText()).trim().split('\n')[0]
          .slice(0, 18).replace(/[^\wа-яА-ЯёЁ-]+/g, '-');
        const file = `${vp.name}-${String(i + 1).padStart(2, '0')}-hover-${label}.png`;
        await section.screenshot({ path: `${OUT}/${file}` });
        console.log(`  + ${file}`);

        audit = await page.evaluate(AUDIT, SECTION);
        problems += report(`наведение на «${label}»`, audit);
      }
    }

    await page.close();
  }

  await browser.close();

  console.log(`\nГотово. Картинки в ${OUT}/`);
  console.log('ТЕПЕРЬ ОТКРОЙ ИХ И ПОСМОТРИ — автопроверка ловит наложения,');
  console.log('но не ловит «некрасиво». Это твоя часть.');
  if (problems) console.log(`\nНайдено проблем: ${problems}`);
};

function report(state, a) {
  if (a.error) {
    console.log(`    ${a.error}`);
    return 1;
  }
  let n = 0;
  if (a.overlaps?.length) {
    console.log(`    [${state}] графика перекрывает текст:`);
    for (const o of a.overlaps) {
      console.log(`      ${o.graphic} поверх «${o.text}» (${o.area}px²)`);
      n++;
    }
  }
  if (a.escaped?.length) {
    console.log(`    [${state}] элементы вылезли за границы секции:`);
    for (const e of a.escaped) {
      console.log(`      ${e.el} ${e.text ? `«${e.text}»` : ''}`);
      n++;
    }
  }
  if (a.overflowX) {
    console.log(`    [${state}] горизонтальный скролл на странице`);
    n++;
  }
  return n;
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
