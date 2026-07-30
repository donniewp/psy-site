import { chromium } from 'playwright';
import fs from 'fs';

const url = process.argv[2];
if (!url) {
  console.error('Usage: node scripts/reference.mjs <url>');
  process.exit(1);
}

fs.mkdirSync('reference', { recursive: true });

const browser = await chromium.launch();
for (const [name, w, h] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `reference/${name}.png`, fullPage: true });
  fs.writeFileSync(`reference/${name}.html`, await page.content());
  console.log(name, 'ok');
  await page.close();
}
await browser.close();
