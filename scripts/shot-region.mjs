import { chromium } from 'playwright';

const url = process.argv[2];
const outPath = process.argv[3];
const y = Number(process.argv[4] || 0);
const h = Number(process.argv[5] || 900);
const width = Number(process.argv[6] || 1440);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: h } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(400);

const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
for (let yy = 0; yy < scrollHeight; yy += 400) {
  await page.evaluate((v) => window.scrollTo(0, v), yy);
  await page.waitForTimeout(60);
}
await page.evaluate((v) => window.scrollTo(0, v), y);
await page.waitForTimeout(250);

await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width, height: h } });
console.log('wrote', outPath);
await browser.close();
