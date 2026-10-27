/* Run with the bundled Playwright module and a local static server.
 * BASE_URL and PLAYWRIGHT_MODULE follow the existing map test conventions. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs', 'member3');
const shots = path.join(output, 'screenshots');
const base = (process.env.BASE_URL || 'http://127.0.0.1:8334').replace(/\/$/, '');
const checks = [];
const errors = [];
const badLocal = [];
function check(label, condition) { assert.ok(condition, label); checks.push({ label, result: 'PASS' }); }
async function fill(page, overrides = {}) {
  const data = { title: 'Unclear temporary walkway signs', category: 'Pedestrian access', area: 'gelugor', location: 'Sample walkway next to the construction boundary', description: 'The temporary walkway signs are difficult to follow near the sample work area. Please review the pedestrian access arrangement.', ...overrides };
  for (const field of ['title', 'location', 'description']) await page.locator(`#feedback-${field}`).fill(data[field]);
  for (const field of ['category', 'area']) await page.locator(`#feedback-${field}`).selectOption(data[field]);
}
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
    await page.goto(`${base}/index.html`);
    await page.waitForSelector('#home-announcements .notice-card');
    check('Existing homepage still renders its three notices', await page.locator('#home-announcements .notice-card').count() === 3);
    await page.locator('.feature-card[href="feedback.html"]').click();
    await page.waitForURL('**/feedback.html');
    check('The existing homepage now opens the feedback form', await page.locator('#feedback-form').isVisible());
    check('Submission navigation identifies the active page', await page.locator('.nav-links [aria-current="page"]').getAttribute('href') === 'feedback.html');
    await screenshot(page, 'feedback-desktop.png');
    await page.locator('#submit-feedback').click();
    check('An empty submission stays on the form and identifies five invalid fields', page.url().endsWith('/feedback.html') && await page.locator('[aria-invalid="true"]').count() === 5 && await page.locator('#feedback-errors').isVisible());
    check('The first invalid field receives keyboard focus', await page.evaluate(() => document.activeElement.id === 'feedback-title'));
    await fill(page, { title: '     ', description: '   too short   ' });
    await page.locator('#submit-feedback').click();
    check('Whitespace and an incomplete description cannot be submitted', await page.locator('#title-error').isVisible() && await page.locator('#description-error').isVisible());
    await fill(page);
    check('The description counter updates while typing', await page.locator('#description-count').innerText() === `${await page.locator('#feedback-description').inputValue().then(s => s.length)} / 1,500`);
    await page.locator('#feedback-photo').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not a picture') });
    await page.waitForFunction(() => !document.querySelector('#photo-error').hidden);
    check('A non-image attachment is rejected', (await page.locator('#photo-error').innerText()).includes('JPG, PNG or WebP'));
    await page.locator('#submit-feedback').click();
    check('An invalid optional attachment cannot silently pass submission', page.url().endsWith('/feedback.html') && await page.locator('#feedback-photo').getAttribute('aria-invalid') === 'true');
    await page.locator('#feedback-photo').setInputFiles({ name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('This is not a valid PNG') });
    await page.waitForFunction(() => document.querySelector('#photo-error').textContent.includes('readable'));
    check('A file renamed to PNG must actually decode as an image', (await page.locator('#photo-error').innerText()).includes('not a readable image'));
    await page.locator('#feedback-photo').setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(2 * 1024 * 1024 + 1) });
    await page.waitForFunction(() => document.querySelector('#photo-error').textContent.includes('2 MB'));
    check('A photo above 2 MB is rejected', await page.locator('#photo-error').isVisible());
    const photo = await page.screenshot({ clip: { x: 0, y: 0, width: 24, height: 24 } });
    await page.locator('#feedback-photo').setInputFiles({ name: 'sample-photo.png', mimeType: 'image/png', buffer: photo });
    await page.waitForSelector('#photo-preview:not([hidden])');
    check('A valid photo displays its preview and filename', await page.locator('#photo-preview-image').evaluate(img => img.complete && img.naturalWidth === 24) && (await page.locator('#photo-name').innerText()) === 'sample-photo.png');
    await page.locator('#remove-photo').click();
    check('Removing a photo clears the preview and file input', await page.locator('#photo-preview').isHidden() && await page.locator('#feedback-photo').inputValue() === '');
    await page.locator('#feedback-photo').setInputFiles({ name: 'sample-photo.png', mimeType: 'image/png', buffer: photo });
    await page.waitForSelector('#photo-preview:not([hidden])');
    const malicious = 'A sample concern <img src=x onerror="window.injected=true">';
    await fill(page);
    await page.locator('#submit-feedback').click();
    await page.waitForURL('**/feedback-success.html?reference=*');
    const reference = await page.locator('#receipt-reference').inputValue();
    check('A valid submission creates a unique reference and a real saved receipt', /^MC-FB-[A-Z0-9]+$/.test(reference) && await page.locator('#feedback-receipt').isVisible() && (await page.locator('#receipt-status').innerText()) === 'Submitted');
    check('The receipt retains the submitted concern title', (await page.locator('#receipt-title').innerText()) === 'Unclear temporary walkway signs');
    check('Only one record is saved for one submission', await page.evaluate(() => JSON.parse(localStorage.getItem(window.MutiaraConnectFeedback.STORAGE_KEY)).reports.length === 1));
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Clipboard unavailable'); } } }));
    await page.locator('#copy-reference').click();
    check('Unavailable clipboard access falls back to selecting the reference', (await page.locator('#copy-status').innerText()).includes('selected') && await page.locator('#receipt-reference').evaluate(input => input.selectionEnd - input.selectionStart === input.value.length));
    await screenshot(page, 'feedback-receipt-desktop.png');
    await page.goBack();
    check('Returning to the form from a receipt leaves submission available', await page.locator('#submit-feedback').isEnabled());
    await page.goForward();
    await page.locator('#receipt-track').click();
    await page.waitForURL('**/tracking.html?reference=*');
    check('The receipt opens the matching submitted report', (await page.locator('#report-reference').innerText()) === reference && (await page.locator('#report-status').innerText()) === 'Submitted');
    check('Submitted photo survives page navigation', await page.locator('#report-photo-image').evaluate(img => img.complete && img.naturalWidth === 24));
    check('The tracking page retains the full submitted description', (await page.locator('#report-description').innerText()).includes('Please review the pedestrian access arrangement.'));
    await page.reload();
    check('New feedback remains queryable after a page reload', await page.locator('#tracking-result').isVisible() && (await page.locator('#report-reference').innerText()) === reference);
    const otherTab = await context.newPage();
    await otherTab.goto(`${base}/tracking.html?reference=${reference}`);
    check('Saved feedback is available to another tab on the same site', (await otherTab.locator('#report-reference').innerText()) === reference);
    await otherTab.evaluate(id => window.MutiaraConnectFeedback.updateStatus(id, 'Responded', 'Sample staff response: the access concern has been reviewed.'), reference);
    await page.waitForFunction(() => document.querySelector('#report-status').textContent === 'Responded');
    check('A staff API update refreshes an already open tracking tab', (await page.locator('#report-response-text').innerText()).includes('access concern has been reviewed') && await page.locator('#report-history li').count() === 2);
    await otherTab.close();
    const maliciousRef = await page.evaluate(title => window.MutiaraConnectFeedback.submit({ title, category: 'Noise', area: 'gelugor', location: 'Sample test location', description: 'This sample contains <script>window.injected=true</script> and must appear as plain text, without executing any markup.' }).id, malicious);
    await page.goto(`${base}/feedback-success.html?reference=${maliciousRef}`);
    check('User-entered HTML is shown as plain text on a receipt', (await page.locator('#receipt-title').innerText()) === malicious && await page.locator('#receipt-title img').count() === 0 && await page.evaluate(() => !window.injected));
    await page.locator('#receipt-track').click();
    check('User markup cannot execute on the tracking page', (await page.locator('#report-description').innerText()).includes('<script>') && await page.locator('#report-description script').count() === 0 && await page.locator('#report-title img').count() === 0 && await page.evaluate(() => !window.injected));
    await page.locator('#tracking-reference').fill('  mc-fb-demo-002  ');
    await page.locator('#tracking-form button').click();
    check('Lookup accepts lowercase and surrounding whitespace', (await page.locator('#report-reference').innerText()) === 'MC-FB-DEMO-002' && (await page.locator('#report-status').innerText()) === 'In Progress');
    for (const [id, status, history] of [['001', 'Submitted', 1], ['002', 'In Progress', 2], ['003', 'Responded', 3]]) {
      await page.locator(`[data-sample-reference="MC-FB-DEMO-${id}"]`).click();
      check(`Sample ${id} shows ${status} and the correct timeline`, (await page.locator('#report-status').innerText()) === status && await page.locator('#report-history li').count() === history);
    }
    check('The responded example displays the actual sample team response', await page.locator('#report-response').isVisible() && (await page.locator('#report-response-text').innerText()).includes('temporary entrance signs'));
    await screenshot(page, 'tracking-desktop.png');
    await page.locator('#tracking-reference').fill('MC-FB-NOTFOUND');
    await page.locator('#tracking-form button').click();
    check('An unknown valid reference shows no match and removes the earlier result', await page.locator('#tracking-empty').isVisible() && await page.locator('#tracking-result').isHidden() && !page.url().includes('reference='));
    await page.locator('#tracking-reference').fill('');
    await page.locator('#tracking-form button').click();
    check('An empty reference gives a focused field error', await page.locator('#tracking-error').isVisible() && await page.evaluate(() => document.activeElement.id === 'tracking-reference') && await page.locator('#tracking-empty').isHidden());
    await page.locator('#tracking-reference').fill('<script>alert(1)</script>');
    await page.locator('#tracking-form button').click();
    check('Malformed references are rejected safely', (await page.locator('#tracking-error').innerText()).includes('valid feedback reference'));
    await page.goto(`${base}/feedback-success.html?reference=MC-FB-UNKNOWN`);
    check('An unknown receipt does not claim a successful submission', await page.locator('#receipt-unavailable').isVisible() && await page.locator('#feedback-receipt').isHidden());
    const privateContext = await browser.newContext();
    const isolated = await privateContext.newPage();
    await isolated.goto(`${base}/tracking.html?reference=${reference}`);
    check('A different browser session cannot falsely retrieve a locally saved report', await isolated.locator('#tracking-empty').isVisible());
    await privateContext.close();
    await page.goto(`${base}/announcements.html`);
    check('The existing announcement list still renders four shared notices', await page.locator('#announcement-list .notice-card').count() === 4);
    await page.locator('#area-filter').selectOption('gelugor');
    check('Existing announcement filters still work', await page.locator('#announcement-list .notice-card').count() === 1);
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['feedback.html', 'tracking.html?reference=MC-FB-DEMO-003', `feedback-success.html?reference=${reference}`]) {
        await page.goto(`${base}/${route}`);
        check(`${route.split('?')[0]} fits ${width}px without horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/feedback.html`);
    await screenshot(page, 'feedback-mobile.png');
    await page.locator('.menu-toggle').click();
    check('The mobile menu exposes the new tracking page', await page.locator('.menu-toggle').getAttribute('aria-expanded') === 'true' && await page.locator('.nav-links a[href="tracking.html"]').isVisible());
    await page.locator('.nav-links a[href="tracking.html"]').click();
    await page.locator('[data-sample-reference="MC-FB-DEMO-003"]').click();
    check('Mobile sample lookup opens the report and focuses it', await page.locator('#tracking-result').isVisible() && await page.evaluate(() => document.activeElement.id === 'tracking-result'));
    await screenshot(page, 'tracking-mobile.png');
    const blockedContext = await browser.newContext();
    await blockedContext.addInitScript(() => { Storage.prototype.setItem = function () { throw new DOMException('Storage is full', 'QuotaExceededError'); }; });
    const blocked = await blockedContext.newPage();
    await blocked.goto(`${base}/feedback.html`);
    await fill(blocked);
    await blocked.locator('#submit-feedback').click();
    check('Storage failure never redirects to a false success receipt', blocked.url().endsWith('/feedback.html') && (await blocked.locator('#feedback-errors').innerText()).includes('has not been submitted'));
    check('After a save failure, form data remains and submission can be retried', (await blocked.locator('#feedback-title').inputValue()) === 'Unclear temporary walkway signs' && await blocked.locator('#submit-feedback').isEnabled());
    await blockedContext.close();
    const damagedContext = await browser.newContext();
    const damaged = await damagedContext.newPage();
    await damaged.goto(`${base}/feedback.html`);
    await damaged.evaluate(() => localStorage.setItem(window.MutiaraConnectFeedback.STORAGE_KEY, '{broken json'));
    await fill(damaged);
    await damaged.locator('#submit-feedback').click();
    check('Unreadable saved data is not silently overwritten', await damaged.evaluate(() => localStorage.getItem(window.MutiaraConnectFeedback.STORAGE_KEY) === '{broken json') && await damaged.locator('#feedback-errors').isVisible());
    await damagedContext.close();
    const fileContext = await browser.newContext();
    const filePage = await fileContext.newPage();
    await filePage.goto(pathToFileURL(path.join(root, 'feedback.html')).href);
    await fill(filePage);
    await filePage.locator('#submit-feedback').click();
    await filePage.waitForURL('**/feedback-success.html?reference=*');
    check('Directly opened local HTML can save and retrieve its receipt', await filePage.locator('#feedback-receipt').isVisible());
    await filePage.locator('#receipt-track').click();
    check('Direct-file navigation also retrieves the new feedback', await filePage.locator('#tracking-result').isVisible() && (await filePage.locator('#report-status').innerText()) === 'Submitted');
    await fileContext.close();
    check('No unhandled JavaScript errors occurred in the main browser checks', errors.length === 0);
    check('All requested local module resources returned successfully', badLocal.length === 0);
    await context.close();
    fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify({ checkedAt: new Date().toISOString(), browser: 'Microsoft Edge / Playwright', checks, errors, badLocal }, null, 2));
    console.log(JSON.stringify({ passed: checks.length, errors, badLocal, output }));
  } catch (error) {
    fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify({ checkedAt: new Date().toISOString(), checks, failure: error.stack, errors, badLocal }, null, 2));
    console.error(error);
    process.exitCode = 1;
  } finally { await browser.close(); }
})();
