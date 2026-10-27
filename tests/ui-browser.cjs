/* UI capture and behavioural QA. No changes to public feedback records. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const ui = path.join(root, 'docs', 'member3', 'ui');
const output = path.join(root, 'docs', 'member3');
const shots = path.join(ui, 'screenshots');
const base = (process.env.BASE_URL || 'http://127.0.0.1:8335').replace(/\/$/, '');
const catalogue = `${base}/docs/member3/ui/index.html`;
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ui, 'screens.js'), 'utf8'), sandbox);
const screens = sandbox.window.MutiaraConnectScreens;
const checks = [], errors = [], badLocal = [], captures = [];
function check(label, condition) { assert.ok(condition, label); checks.push({ label, result: 'PASS' }); }
async function capture(page, filename, locator) {
  await page.evaluate(async () => { await document.fonts.ready; document.activeElement.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
  if (locator) await page.locator(locator).screenshot({ path: filename, animations: 'disabled' });
  else await page.screenshot({ path: filename, fullPage: true, animations: 'disabled' });
}
async function ready(page, id) {
  if (id === 'home') await page.waitForSelector('#home-announcements .notice-card');
  if (id === 'announcements') await page.waitForSelector('#announcement-list .notice-card');
  if (id === 'announcement-detail') await page.waitForSelector('#announcement-detail h1');
  if (id === 'map') {
    await page.waitForSelector('.mc-map-pin.selected');
    await page.locator('.leaflet-image-layer').evaluate(image => image.decode());
  }
  if (id === 'receipt') await page.waitForSelector('#feedback-receipt:not([hidden])');
  if (id === 'tracking') await page.waitForSelector('#tracking-result:not([hidden])');
  if (id === 'admin') {
    await page.waitForSelector('.ui-admin-row');
    await page.locator('#staff-next-status').selectOption('Responded');
    await page.locator('#staff-response').fill('Sample response: additional walkway signs have been proposed. The access arrangement will be explained in the next community update.');
    await page.locator('#staff-preview-form button').click();
  }
}
(async () => {
  fs.mkdirSync(shots, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : { channel: 'msedge' }) });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    await context.route('**/js/google-map-config.js', route => route.fulfill({ contentType: 'application/javascript', body: "window.MutiaraConnectGoogleMapConfig={apiKey:'',preferGoogle:false};" }));
    // Keep screenshots reproducible and exclude optional remote map services.
    await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort('internetdisconnected'));
    context.on('page', page => {
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) badLocal.push(`${response.status()} ${response.url()}`); });
    });
    const page = await context.newPage();
    for (const [view, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
      await page.setViewportSize({ width, height });
      for (const screen of screens) {
        const url = new URL(screen.url, catalogue).href;
        await page.goto(url);
        await ready(page, screen.id);
        check(`${screen.id}: ${view} screen has no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await capture(page, path.join(shots, `${screen.image}-${view}.png`));
        captures.push({ screen: screen.id, view, width, height, state: screen.state, source: screen.url, file: `${screen.image}-${view}.png` });
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(catalogue);
    await page.waitForFunction(() => document.querySelectorAll('[data-screen]').length === 8);
    check('The catalogue covers all eight main screens', await page.locator('[data-screen]').count() === 8);
    check('Seven working screens and one design proposal are accurately distinguished', await page.locator('.ui-card-state.is-live').count() === 7 && await page.locator('.ui-card-state.is-concept').count() === 1);
    for (const screen of screens) {
      await page.locator(`[data-screen="${screen.id}"]`).click();
      await page.locator('#preview-image').evaluate(image => image.decode());
      check(`${screen.id}: selection opens the corresponding preview and real target`, (await page.locator('#preview-title').innerText()) === screen.title && await page.locator('#preview-open').getAttribute('href') === screen.url && await page.locator('#preview-image').getAttribute('src') === `screenshots/${screen.image}-desktop.png`);
      if (screen.state !== 'Implemented') check('The staff preview is labelled as a design prototype at the point of use', (await page.locator('#preview-state').innerText()) === 'Design prototype' && (await page.locator('#preview-open').innerText()).includes('design prototype') && (await page.locator('#preview-notes').innerText()).includes('no persistence'));
    }
    await page.locator('[data-screen="feedback"]').click();
    await page.locator('button[data-view="mobile"]').click();
    await page.locator('#preview-image').evaluate(image => image.decode());
    check('The size toggle displays the actual 390px mobile capture', await page.locator('#preview-image').evaluate(image => image.naturalWidth === 390) && await page.locator('button[data-view="mobile"]').getAttribute('aria-pressed') === 'true');
    await page.reload();
    check('Screen and size selection survive reloading a shared catalogue URL', (await page.locator('#preview-title').innerText()) === 'Submit a concern' && await page.locator('button[data-view="mobile"]').getAttribute('aria-pressed') === 'true');
    await page.locator('button[data-view="desktop"]').click();
    await page.locator('#preview-image').evaluate(image => image.decode());
    check('Returning to desktop restores the 1440px capture', await page.locator('#preview-image').evaluate(image => image.naturalWidth === 1440));
    await page.goto(`${catalogue}?screen=unknown&view=bad`);
    check('Invalid catalogue parameters fall back to the first desktop screen', (await page.locator('#preview-title').innerText()) === 'Community home' && await page.locator('button[data-view="desktop"]').getAttribute('aria-pressed') === 'true');
    await page.locator('[data-screen="tracking"]').focus();
    await page.keyboard.press('Enter');
    check('Keyboard selection reaches the matching preview with visible focus', (await page.locator('#preview-title').innerText()) === 'Track a report' && await page.evaluate(() => document.activeElement.id === 'screen-preview'));
    await page.locator('#navigation img').evaluate(image => image.decode());
    check('The standalone SVG navigation map loads', await page.locator('#navigation img').evaluate(image => image.naturalWidth === 1200));
    await page.goto(`${catalogue}?screen=feedback`);
    await page.locator('#preview-image').evaluate(image => image.decode());
    await page.evaluate(async () => { await Promise.all([...document.images].map(image => image.decode())); });
    await capture(page, path.join(output, 'ui-overview.png'), '#screen-library');
    await capture(page, path.join(output, 'ui-catalogue-desktop.png'));
    await capture(page, path.join(output, 'ui-navigation-preview.png'), '.ui-flow');
    // Preserve an actual feedback store value to prove that the design cannot change it.
    await page.goto(`${base}/feedback.html`);
    const reference = await page.evaluate(() => window.MutiaraConnectFeedback.submit({ title: 'UI isolation test record', category: 'Noise', area: 'gelugor', location: 'Sample location for design QA', description: 'This sample verifies that the staff design preview does not modify the public feedback record.' }).id);
    const storedBefore = await page.evaluate(() => localStorage.getItem(window.MutiaraConnectFeedback.STORAGE_KEY));
    await page.goto(`${base}/docs/member3/ui/admin-prototype.html`);
    check('The staff screen prominently identifies its isolated design scope', (await page.locator('.ui-prototype-banner').innerText()).includes('DESIGN PROTOTYPE') && await page.evaluate(() => !window.MutiaraConnectFeedback));
    check('The initial staff queue contains all three samples', await page.locator('.ui-admin-row').count() === 3);
    await page.locator('#staff-status').selectOption('Submitted');
    check('Staff status filtering shows the matching report and details', await page.locator('.ui-admin-row').count() === 1 && (await page.locator('#staff-reference').innerText()) === 'MC-FB-DEMO-001');
    await page.locator('#staff-search').fill('not a real report');
    check('An empty staff search hides stale details and offers recovery', await page.locator('#staff-empty').isVisible() && await page.locator('#staff-detail').isHidden());
    await page.locator('#staff-reset').click();
    check('Reset restores all reports and keyboard focus', await page.locator('.ui-admin-row').count() === 3 && await page.evaluate(() => document.activeElement.id === 'staff-search'));
    await page.locator('#staff-search').fill('  gELUgor  ');
    check('Staff search matches area names regardless of case and padding', await page.locator('.ui-admin-row').count() === 1 && (await page.locator('#staff-reference').innerText()) === 'MC-FB-DEMO-002');
    await page.locator('.ui-admin-row').focus();
    await page.keyboard.press('Enter');
    check('A keyboard-selected report transfers focus to its details', await page.evaluate(() => document.activeElement.id === 'staff-detail'));
    await page.locator('#staff-preview-form button').click();
    check('An empty proposed response gives a correction without a false preview', await page.locator('#staff-error').isVisible() && await page.locator('#staff-preview').isHidden() && await page.evaluate(() => document.activeElement.id === 'staff-response'));
    const sampleResponse = 'Sample response: <img src=x onerror="window.injected=true"> is plain text. Additional walkway signage has been proposed.';
    await page.locator('#staff-next-status').selectOption('Responded');
    await page.locator('#staff-response').fill(sampleResponse);
    await page.locator('#staff-preview-form button').click();
    check('The proposed response displays its chosen status and exact text safely', (await page.locator('#staff-preview-status').innerText()) === 'Responded' && (await page.locator('#staff-preview-text').innerText()) === sampleResponse && await page.locator('#staff-preview-text img').count() === 0 && await page.evaluate(() => !window.injected));
    check('Previewing never changes the queue or current report status', (await page.locator('#staff-current-status').innerText()) === 'In Progress' && (await page.locator('.ui-admin-row .ui-status').innerText()) === 'In Progress');
    check('The isolated staff design preserves the entire public store unchanged', await page.evaluate(() => localStorage.getItem('mutiaraconnect.feedback.v1')) === storedBefore);
    await page.reload();
    check('A staff design preview is not persisted after a reload', await page.locator('#staff-preview').isHidden() && await page.locator('#staff-response').inputValue() === '');
    await page.goto(`${base}/tracking.html?reference=${reference}`);
    check('A real local feedback record remains Submitted after design interactions', (await page.locator('#report-status').innerText()) === 'Submitted' && await page.locator('#report-history li').count() === 1);
    for (const width of [1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const url of [catalogue, `${base}/docs/member3/ui/admin-prototype.html`]) {
        await page.goto(url);
        check(`${url.endsWith('index.html') ? 'Catalogue' : 'Staff design'} fits ${width}px without horizontal page overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${catalogue}?screen=admin&view=mobile`);
    await page.locator('#preview-image').evaluate(image => image.decode());
    await capture(page, path.join(output, 'ui-catalogue-mobile.png'));
    await page.goto(pathToFileURL(path.join(ui, 'index.html')).href + '?screen=admin&view=mobile');
    await page.locator('#preview-image').evaluate(image => image.decode());
    check('The catalogue also works when opened directly from local files', (await page.locator('#preview-title').innerText()) === 'Staff dashboard' && await page.locator('#preview-image').evaluate(image => image.naturalWidth === 390));
    await page.goto(pathToFileURL(path.join(ui, 'admin-prototype.html')).href);
    await page.locator('#staff-search').fill('Business access');
    check('The staff design can be explored without a local server', await page.locator('.ui-admin-row').count() === 1 && (await page.locator('#staff-reference').innerText()) === 'MC-FB-DEMO-003');
    check('The new UI surfaces produce no unhandled JavaScript errors', errors.length === 0);
    check('Every requested local screen and screenshot asset loads successfully', badLocal.length === 0);
    fs.writeFileSync(path.join(output, 'ui-verification.json'), JSON.stringify({ checkedAt: new Date().toISOString(), browser: 'Microsoft Edge / Playwright', base, checks, captures, errors, badLocal }, null, 2));
    console.log(JSON.stringify({ passed: checks.length, captures: captures.length, errors, badLocal }));
    await context.close();
  } catch (error) {
    fs.writeFileSync(path.join(output, 'ui-verification.json'), JSON.stringify({ checkedAt: new Date().toISOString(), checks, captures, errors, badLocal, failure: error.stack }, null, 2));
    console.error(error); process.exitCode = 1;
  } finally { await browser.close(); }
})();
