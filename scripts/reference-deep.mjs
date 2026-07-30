import { chromium } from 'playwright';
import fs from 'fs';

const url = process.argv[2];
if (!url) {
  console.error('Usage: node scripts/reference-deep.mjs <url>');
  process.exit(1);
}

fs.mkdirSync('reference', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(4000);

const tabLabels = ['Малыши', 'Дошкольники', 'Школьники', 'Индивидуально'];
let out = '';

for (const label of tabLabels) {
  const btn = page.locator('button', { hasText: label }).first();
  await btn.click();
  await page.waitForTimeout(600);
  const grid = page.locator('button', { hasText: label }).first().locator('xpath=../..').first();
  out += `\n\n===== TAB: ${label} =====\n`;
  try {
    const section = page.locator('section', { hasText: 'Программы студии' }).first();
    out += await section.innerText();
  } catch (e) {
    out += `(error capturing tab ${label}: ${e.message})`;
  }
}

await page.screenshot({ path: 'reference/desktop-programs-last-tab.png', fullPage: false });

const faqSection = page.locator('section', { hasText: 'Отвечаем на то, что волнует родителей' }).first();
const faqRows = faqSection.locator('div[style*="cursor: pointer"]');
const faqCount = await faqRows.count();
out += `\n\n===== FAQ (${faqCount} rows found) =====\n`;
for (let i = 0; i < faqCount; i++) {
  try {
    await faqRows.nth(i).click();
    await page.waitForTimeout(400);
    out += `\n--- row ${i} ---\n` + (await faqSection.innerText());
  } catch (e) {
    out += `\n(error row ${i}: ${e.message})`;
  }
}

fs.writeFileSync('reference/deep-dive.txt', out);
console.log('wrote reference/deep-dive.txt', out.length);

await browser.close();
