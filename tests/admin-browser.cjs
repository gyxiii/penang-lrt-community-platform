/* Member 4 administrator dashboard checks.
 * Run with a local static server and Playwright, following the existing test conventions:
 *   BASE_URL=http://127.0.0.1:8341 PLAYWRIGHT_MODULE=<path to playwright> node tests/admin-browser.cjs
 * Set BROWSER_PATH to use a specific browser executable; otherwise the Microsoft Edge channel is used. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs', 'member4');
const shots = path.join(output, 'screenshots');
const base = (process.env.BASE_URL || 'http://127.0.0.1:8341').replace(/\/$/, '');
const checks = [];
const errors = [];
const badLocal = [];
function check(label, condition) { assert.ok(condition, label); checks.push({ label, result: 'PASS' }); }
async function screenshot(page, name) {
  await page.evaluate(() => { document.activeElement.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
  await page.screenshot({ path: path.join(shots, name), fullPage: true });
}
(async () => {
  fs.mkdirSync(shots, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : { channel: 'msedge' }) });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, reducedMotion: 'reduce' });
    context.on('page', page => {
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) badLocal.push(`${response.status()} ${response.url()}`); });
    });
    const page = await context.newPage();
    await page.goto(`${base}/admin.html`);
    await page.waitForSelector('#ad-list .ad-row');
    check('The dashboard loads the three shared sample reports', await page.locator('#ad-list .ad-row').count() === 3);
    check('Summary counters reflect the sample statuses', await page.locator('#ad-count-all').innerText() === '3'
      && await page.locator('#ad-count-submitted').innerText() === '1'
      && await page.locator('#ad-count-progress').innerText() === '1'
      && await page.locator('#ad-count-responded').innerText() === '1');
    check('Shared navigation marks Admin as the current page', await page.locator('.nav-links [aria-current="page"]').getAttribute('href') === 'admin.html');
    check('A first report is selected automatically with its detail visible', await page.locator('#ad-detail-body').isVisible()
      && (await page.locator('#ad-detail-title').innerText()).length > 0);
    check('Every element id and tab reference is unique and valid', await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
      const unique = new Set(ids).size === ids.length;
      const tabs = [...document.querySelectorAll('[role="tab"]')].every(tab => document.getElementById(tab.getAttribute('aria-controls')));
      return unique && tabs;
    }));

    await page.locator('#ad-status').selectOption('Responded');
    check('The status filter narrows the queue and reports the match count', await page.locator('#ad-list .ad-row').count() === 1
      && (await page.locator('#ad-results').innerText()).includes('1 of 3'));
    await page.locator('#ad-category').selectOption('Noise');
    check('Combined filters can produce an empty result without hiding the form controls', await page.locator('#ad-empty').isVisible()
      && await page.locator('#ad-detail-body').isHidden());
    await page.locator('#ad-empty-reset').click();
    check('Reset restores every report and selects one again', await page.locator('#ad-list .ad-row').count() === 3
      && await page.locator('#ad-detail-body').isVisible()
      && await page.evaluate(() => document.activeElement.id === 'ad-search'));

    await page.locator('#ad-list .ad-row[data-reference="MC-FB-DEMO-002"]').click();
    check('Selecting a row shows its reference, details and activity timeline', await page.locator('#ad-reference').innerText() === 'FEEDBACK · MC-FB-DEMO-002'
      && await page.locator('#ad-history li').count() === 2
      && await page.locator('#ad-list .ad-row[data-reference="MC-FB-DEMO-002"]').getAttribute('aria-pressed') === 'true');
    check('The public tracking link targets the selected reference', (await page.locator('#ad-public-link').getAttribute('href')) === 'tracking.html?reference=MC-FB-DEMO-002');

    await page.locator('#ad-save').click();
    check('An empty response is rejected and the note field receives focus', await page.locator('#ad-update-error').isVisible()
      && await page.locator('#ad-note').getAttribute('aria-invalid') === 'true'
      && await page.evaluate(() => document.activeElement.id === 'ad-note'));

    const note = 'Sample response: the temporary walkway signs were reviewed and replacement signs are proposed. <img src=x onerror="window.injected=true">';
    await page.locator('#ad-next-status').selectOption('Responded');
    await page.locator('#ad-note').fill(note);
    await page.locator('#ad-save').click();
    check('Saving an update confirms the new status in a live message', await page.locator('#ad-update-success').isVisible()
      && (await page.locator('#ad-update-success').innerText()).includes('Responded'));
    check('The queue row and summary counters reflect the saved status', await page.locator('#ad-list .ad-row[data-reference="MC-FB-DEMO-002"] .mc-status').innerText() === 'Responded'
      && await page.locator('#ad-count-responded').innerText() === '2'
      && await page.locator('#ad-count-progress').innerText() === '0');
    check('The shared model stores one appended history entry with the exact text', await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem(window.MutiaraConnectFeedback.STORAGE_KEY));
      const record = data.reports.find(item => item.id === 'MC-FB-DEMO-002');
      return record.status === 'Responded' && record.history.length === 3 && record.history.at(-1).note.includes('<img src=x');
    }));
    check('Typed HTML is shown as plain text and never executed', await page.evaluate(() => typeof window.injected === 'undefined')
      && (await page.locator('#ad-history p').last().innerText()).includes('<img src=x'));
    await screenshot(page, 'admin-desktop.png');

    const tracking = await context.newPage();
    await tracking.goto(`${base}/tracking.html?reference=MC-FB-DEMO-002`);
    await tracking.waitForSelector('#tracking-result:not([hidden])');
    check('The public tracking page shows the saved status and response', (await tracking.locator('#report-status').innerText()) === 'Responded'
      && (await tracking.locator('#report-response-text').innerText()).includes('replacement signs'));

    await page.locator('#ad-next-status').selectOption('In Progress');
    await page.locator('#ad-note').fill('Sample follow-up: the site team is checking the replacement sign positions.');
    await page.locator('#ad-save').click();
    await tracking.waitForFunction(() => document.querySelector('#report-status').textContent === 'In Progress');
    check('An open public tracking tab refreshes after a staff update', (await tracking.locator('#report-status').innerText()) === 'In Progress'
      && (await tracking.locator('#report-history').innerText()).includes('replacement sign positions'));
    await tracking.close();

    await page.locator('#ad-tab-announcements').click();
    check('The announcements tab lists the four shared notices', await page.locator('#ad-announcements .ad-notice').count() === 4);
    check('Every announcement links to the shared detail page', await page.evaluate(() => [...document.querySelectorAll('#ad-announcements .ad-notice')]
      .every(link => /^announcement-detail\.html\?id=/.test(link.getAttribute('href')))));
    await page.locator('#ad-announcement-type').selectOption('Road access');
    check('The notice-type filter narrows the list', await page.locator('#ad-announcements .ad-notice').count() === 1);
    await page.locator('#ad-announcement-search').fill('no such notice');
    check('Announcement filters produce an empty state', await page.locator('#ad-announcement-empty').isVisible());
    await page.locator('#ad-announcement-reset').click();
    check('Announcement reset restores all notices', await page.locator('#ad-announcements .ad-notice').count() === 4);
    await screenshot(page, 'admin-announcements.png');
    await page.locator('#ad-tab-announcements').focus();
    await page.keyboard.press('ArrowLeft');
    check('Arrow keys move between dashboard tabs', await page.locator('#ad-tab-feedback').getAttribute('aria-selected') === 'true'
      && await page.locator('#ad-panel-feedback').isVisible());

    for (const width of [1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(120);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`No horizontal overflow at ${width}px`, overflow <= 1);
    }
    await page.setViewportSize({ width: 390, height: 900 });
    await page.locator('#ad-tab-feedback').click();
    await page.locator('#ad-list .ad-row').first().click();
    await screenshot(page, 'admin-mobile.png');

    const hrefs = await page.$$eval('.nav-links a', links => links.map(link => link.getAttribute('href')));
    for (const href of hrefs) {
      const response = await page.request.get(`${base}/${href}`);
      check(`Navigation target ${href} responds successfully`, response.ok());
    }
  } finally {
    await browser.close();
  }
  check('No uncaught script errors occurred', errors.length === 0);
  check('No local resource request failed', badLocal.length === 0);
  fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify({
    member: 4,
    module: 'Administrative dashboard',
    page: 'admin.html',
    date: new Date().toISOString(),
    base,
    browser: 'Microsoft Edge via Playwright',
    passed: checks.length,
    checks,
    errors,
    failedRequests: badLocal
  }, null, 2));
  console.log(`Member 4 administrator dashboard checks passed: ${checks.length}`);
})().catch(error => { console.error(error); process.exitCode = 1; });
