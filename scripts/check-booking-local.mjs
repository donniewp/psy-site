import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4321';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Local preview only');
const output = '.impeccable/previews/2026-09-14';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(5000);
  page.setDefaultNavigationTimeout(20000);
  const errors = [];
  const externalWrites = [];
  const blockedMapAnalytics = [];
  const submissions = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(/workers\.dev|api\.telegram\.org|mc\.yandex\./, route => {
    const request = route.request();
    // The restored map owns its own analytics. Block those third-party requests
    // as well, while distinguishing them from the site's disabled dev counter.
    if (request.url().includes('mc.yandex.') && request.frame() !== page.mainFrame()) blockedMapAnalytics.push(request.url());
    else externalWrites.push(request.url());
    return route.abort();
  });
  page.on('request', req => { if (req.method() === 'POST' && req.url().includes('/__preview/booking')) submissions.push(req.postDataJSON()); });
  const visit = async path => { await page.goto(base + path, { waitUntil: 'networkidle' }); };
  const openForm = () => page.locator('.sticky-book').click();
  const fillForm = async (phone = '8 (999) 123-45-67') => {
    await page.locator('[name="name"]').fill('Локальная проверка');
    await page.locator('[name="phone"]').fill(phone);
    await page.locator('[name="consent"]').check();
  };
  const send = () => page.locator('.form-submit').click();
  const shown = async selector => { await page.locator(selector).waitFor({ state: 'visible' }); assert.equal(await page.locator(selector).isVisible(), true, selector); };

  await visit('/?utm_source=local-test&utm_campaign=school');
  assert.equal(await page.locator('.program-card:visible').count(), 8);
  await page.locator('.prog-tab[data-group="doshkolniki"]').click();
  await page.waitForFunction(() => document.querySelectorAll('.program-card:not([hidden])').length === 3);
  assert.equal(await page.locator('.program-card:visible').count(), 3);
  await page.locator('.prog-tab[data-group="all"]').click();
  await page.locator('#burger-btn').click();
  await shown('#mobile-menu');
  await page.locator('#mobile-menu a[href="#programs"]').click();
  assert.equal(await page.locator('#mobile-menu').isVisible(), false);
  await page.locator('#contact-choices summary').click();
  await shown('.contact-panel');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.contact-panel').isVisible(), false);
  await openForm();
  await fillForm('abc');
  await send();
  await shown('#phone-error');
  assert.equal(submissions.length, 0);
  await page.locator('[name="phone"]').fill('8 (999) 123-45-67');
  await page.screenshot({ path: output + '/form-mobile.png' });
  await send();
  await page.waitForSelector('#booking-modal.is-sent');
  assert.equal(submissions[0].phone, '+79991234567');
  assert.equal(submissions[0].utm_campaign, 'school');
  await page.screenshot({ path: output + '/form-success-mobile.png' });
  await page.keyboard.press('Escape');
  await openForm();
  assert.equal(await page.locator('[name="name"]').inputValue(), '');

  await page.route('**/__preview/booking', route => route.fulfill({ status: 503, body: 'offline' }));
  await fillForm(); await send(); await shown('#form-error');
  assert.equal(await page.locator('[name="name"]').inputValue(), 'Локальная проверка');
  assert.equal(await page.locator('.form-submit').isEnabled(), true);
  await page.screenshot({ path: output + '/form-error-mobile.png' });
  await page.keyboard.press('Escape'); await openForm();
  assert.equal(await page.locator('[name="name"]').inputValue(), 'Локальная проверка');
  await page.unroute('**/__preview/booking');

  // A delayed response arriving after close must not lose the confirmation.
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route('**/__preview/booking', async route => { await pending; await route.fulfill({ contentType: 'application/json', body: '{"ok":true}' }); });
  await send();
  await page.waitForSelector('#booking-form[aria-busy="true"]');
  assert.equal(await page.locator('.form-submit').textContent(), 'Отправляем…');
  await page.keyboard.press('Escape'); release();
  await page.waitForSelector('#booking-modal.is-sent', { state: 'attached' });
  await openForm(); await shown('#booking-success');
  await page.keyboard.press('Escape'); await page.unroute('**/__preview/booking');

  await visit('/podgotovka-k-shkole/?format=individual');
  assert.equal(await page.locator('input[value="individual"]').isChecked(), true);
  await openForm();
  assert.match(await page.locator('#booking-price').textContent(), /2 300/);
  assert.match(await page.locator('[name="program"]').inputValue(), /Индивидуальная подготовка/);
  await page.keyboard.press('Escape');
  await page.locator('input[value="group"]').check();
  await openForm();
  assert.match(await page.locator('#booking-price').textContent(), /бесплатно/);
  await page.keyboard.press('Escape');

  for (const [path, expected] of [['/diagnostika/', /3 500/], ['/konsultaciya-podrostkov/', /4 000/]]) {
    await visit(path); await openForm();
    assert.match(await page.locator('#booking-price').textContent(), expected);
    assert.doesNotMatch(await page.locator('#booking-price').textContent(), /бесплатно/);
    await page.keyboard.press('Escape');
  }
  await visit('/?age=1,5-4');
  await page.waitForFunction(() => document.querySelectorAll('.program-card:not([hidden])').length === 2);
  assert.equal(await page.locator('.program-card:visible').count(), 2);
  await page.locator('.family-note a').click();
  assert.match(await page.locator('[name="program"]').inputValue(), /семьи/);
  await page.keyboard.press('Escape');

  // Restored illustrated sections remain interactive with the revised booking flow.
  await page.locator('.feat-tab').nth(1).click();
  assert.equal(await page.locator('.feat-tab').nth(1).getAttribute('aria-selected'), 'true');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('.feat-tab').nth(2).getAttribute('aria-selected'), 'true');
  await page.locator('.problem-tile').first().click();
  await shown('.problem-modal[open]');
  await page.locator('.problem-modal[open] .problem-modal-cta').click();
  await shown('#booking-modal[open]');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.problem-modal[open]').count(), 0);
  await page.waitForFunction(() => document.body.style.overflow === '');
  await page.locator('.faq-question').nth(1).click();
  assert.equal(await page.locator('.faq-question').nth(1).getAttribute('aria-expanded'), 'true');
  await page.locator('.visit-video-link').click();
  await shown('#video-modal[open]');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#video-modal').isVisible(), false);

  const measurements = [];
  const routes = ['/', '/rannee-razvitie/', '/rannee-razvitie-2-5-4/', '/razvivayka/', '/podgotovka-k-shkole/', '/pesok-i-glina/', '/shkolnyy-navigator/', '/konsultaciya-podrostkov/', '/diagnostika/'];
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width > 1000 ? 1000 : 844 });
    for (const path of routes) {
      await visit(path);
      const measure = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, height: document.body.scrollHeight, h1: document.querySelectorAll('h1').length, brokenImages: [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src) }));
      assert.ok(measure.scrollWidth <= width, `${path} overflows at ${width}`);
      assert.equal(measure.h1, 1, path);
      assert.deepEqual(measure.brokenImages, [], path);
      measurements.push({ path, ...measure });
      if ([390, 1440].includes(width) && ['/', '/podgotovka-k-shkole/', '/diagnostika/', '/rannee-razvitie/'].includes(path)) {
        const name = path === '/' ? 'home' : path.split('/')[1];
        await page.screenshot({ path: `${output}/${name}-${width === 390 ? 'mobile' : 'desktop'}.png` });
        if (path === '/') await page.screenshot({ path: `${output}/home-full-${width === 390 ? 'mobile' : 'desktop'}.png`, fullPage: true });
      }
    }
    console.log(`Checked ${routes.length} pages at ${width}px`);
  }
  assert.deepEqual(errors, [], 'No browser script errors');
  assert.deepEqual(externalWrites, [], 'No production booking or analytics requests');
  await writeFile(output + '/checks.json', JSON.stringify({ measurements, errors, externalWrites, blockedMapAnalytics, testedSubmissions: submissions.length }, null, 2));
  console.log('PASS: filters, menu, contacts, illustrated tabs, problem dialogs, FAQ, video, form validation, recovery, delayed success, program context, attribution, 36 responsive page checks. No external submissions. Map analytics blocked.');
} finally { await browser.close(); }
