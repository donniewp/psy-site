import { chromium } from 'playwright';
import fs from 'fs';

const url = process.argv[2];
const outPath = process.argv[3] || 'reference/shot.png';
const width = Number(process.argv[4] || 1440);

if (!url) {
  console.error('Usage: node scripts/shot.mjs <url> [outPath] [width]');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(500);

// Прокручиваем страницу шагами, чтобы сработали IntersectionObserver-реверсии
const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < scrollHeight; y += 400) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(80);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);

fs.mkdirSync(outPath.split('/').slice(0, -1).join('/') || '.', { recursive: true });
await page.screenshot({ path: outPath, fullPage: true });
console.log('wrote', outPath);
await browser.close();
