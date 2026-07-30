import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:4321/';
const widths = [1280, 1440, 1728];

const browser = await chromium.launch();

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(400);

  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < scrollHeight; y += 400) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);

  console.log(`\n=== width ${width} ===`);

  const overflow = await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const winWidth = window.innerWidth;
    const offenders = [];
    if (docWidth > winWidth) {
      document.querySelectorAll('body *').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > winWidth + 2 || r.left < -2) {
          offenders.push({ tag: el.tagName, cls: el.className?.toString().slice(0, 60), right: Math.round(r.right), left: Math.round(r.left) });
        }
      });
    }
    return { docWidth, winWidth, offenders: offenders.slice(0, 15) };
  });
  console.log('horizontal overflow:', overflow.docWidth > overflow.winWidth ? `YES (${overflow.docWidth} vs ${overflow.winWidth})` : 'no');
  if (overflow.offenders.length) console.log(JSON.stringify(overflow.offenders, null, 1));

  // gap anomaly detector: look at each section's direct children for huge unexpected vertical gaps
  const gaps = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('main > section, footer'));
    const results = [];
    sections.forEach((sec) => {
      const kids = Array.from(sec.querySelectorAll(':scope > .container > *, :scope > *'));
      for (let i = 1; i < kids.length; i++) {
        const prev = kids[i - 1].getBoundingClientRect();
        const cur = kids[i].getBoundingClientRect();
        const gap = cur.top - prev.bottom;
        if (gap > 150) {
          results.push({ section: sec.id || sec.tagName, gap: Math.round(gap), prevTag: kids[i-1].className?.toString().slice(0,40), curTag: kids[i].className?.toString().slice(0,40) });
        }
      }
    });
    return results;
  });
  if (gaps.length) {
    console.log('large gaps detected:');
    console.log(JSON.stringify(gaps, null, 1));
  } else {
    console.log('no large gaps between direct section children');
  }

  await page.close();
}

await browser.close();
