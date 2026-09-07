import { chromium } from 'playwright';
import assert from 'node:assert/strict';

// Run against `npm run preview -- --port 4322`, or set SITE_CHECK_URL.
const baseURL = process.env.SITE_CHECK_URL || 'http://127.0.0.1:4322';
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [375, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    await context.route(/https:\/\/mc\.yandex/, (route) => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(baseURL, { waitUntil: 'networkidle' });

    const duplicates = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    });
    assert.deepEqual(duplicates, [], 'Anchor IDs must be unique');

    // An age filter can hide the program card; navigation must still find the section.
    await page.locator('.prog-tab[data-group="malyshi"]').click();
    await page.locator('#program-razvivayka').waitFor({ state: 'hidden' });
    if (width < 900) {
      await page.getByRole('button', { name: 'Открыть меню' }).click();
      await page.locator('.mobile-menu-link[href="#razvivayka"]').click();
    } else {
      await page.locator('.nav-desktop a[href="#razvivayka"]').click();
    }
    await page.waitForFunction(() => {
      const section = document.getElementById('razvivayka');
      const top = section.getBoundingClientRect().top;
      return section.tagName === 'SECTION' && top >= -5 && top < 180;
    });
    const heading = page.locator('#razvivayka .section-head');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#razvivayka .section-head')).opacity === '1');
    assert(await heading.isVisible());
    await page.locator('#raz-route').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('raz-route')).opacity === '1');
    for (let i = 0; i < 5; i++) {
      await page.locator(`#raz-tab-${i}`).click();
      await page.waitForFunction((index) => document.getElementById(`raz-tab-${index}`).getAttribute('aria-selected') === 'true', i);
      const panel = page.locator(width < 900 ? `#raz-panel-m-${i}` : `#raz-panel-${i}`);
      assert.equal(await panel.getAttribute('aria-hidden'), 'false');
      assert(await panel.isVisible());
    }
    await page.locator('.razvivayka-footer').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.razvivayka-footer')).opacity === '1');
    assert.deepEqual(errors, []);
    console.log(`${width}px: navigation with filtered card, heading, five stations and footer visible`);
    await context.close();
  }

  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/#razvivayka`);
  assert.equal(await page.locator('#razvivayka .section-head').evaluate((el) => getComputedStyle(el).opacity), '1');
  assert.equal(await page.locator('#raz-route').evaluate((el) => getComputedStyle(el).opacity), '1');
  console.log('Without JavaScript: program content remains visible');
  await context.close();
} finally {
  await browser.close();
}
