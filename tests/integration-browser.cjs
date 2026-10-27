/* Final public-flow and shared-model integration checks, including known dependencies. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = (process.env.BASE_URL || 'http://127.0.0.1:8340').replace(/\/$/, '');
const checks = [], errors = [], badLocal = [];
const check = (label, condition) => { assert.ok(condition, label); checks.push({ label, result: 'PASS' }); };
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    await context.route('**/js/google-map-config.js', route => route.fulfill({ contentType: 'application/javascript', body: "window.MutiaraConnectGoogleMapConfig={apiKey:'',preferGoogle:false};" }));
    await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort('internetdisconnected'));
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400 && !response.url().endsWith('/favicon.ico')) badLocal.push(`${response.status()} ${response.url()}`); });
    await page.goto(`${base}/index.html`);
    await page.locator('.nav-links a[href="announcements.html"]').click();
    await page.locator('#area-filter').selectOption('gelugor');
    await page.locator('#announcement-list .notice-card h3 a').click();
    check('Homepage, notice filters and detail navigation preserve the selected notice', page.url().endsWith('announcement-detail.html?id=MC-DEMO-002') && (await page.locator('#announcement-detail h1').innerText()).includes('Pedestrian access'));
    await page.locator('#view-impact-map').click();
    await page.waitForSelector('.mc-map-pin.selected');
    check('The detail page opens the correct offline map selection', page.url().endsWith('map.html?notice=MC-DEMO-002') && (await page.locator('#map-detail').innerText()).includes('MC-DEMO-002'));
    await page.locator('#map-read-notice').click();
    check('The map returns to the same notice detail', page.url().endsWith('announcement-detail.html?id=MC-DEMO-002'));
    await page.locator('.nav-links a[href="feedback.html"]').click();
    await page.locator('#feedback-title').fill('Sample integration access concern');
    await page.locator('#feedback-category').selectOption('Pedestrian access');
    await page.locator('#feedback-area').selectOption('gelugor');
    await page.locator('#feedback-location').fill('Sample walkway beside the construction boundary');
    await page.locator('#feedback-description').fill('The sample walkway signs are unclear. Please review the pedestrian access arrangement and provide clearer directions.');
    await page.locator('#submit-feedback').click();
    await page.waitForURL('**/feedback-success.html?reference=*');
    const id = await page.locator('#receipt-reference').inputValue();
    check('A feedback report submitted after browsing notices gets its own saved reference', /^MC-FB-[A-Z0-9]+$/.test(id) && await page.locator('#feedback-receipt').isVisible());
    await page.locator('#receipt-track').click();
    check('The receipt retrieves that exact report and its initial history', (await page.locator('#report-reference').innerText()) === id && (await page.locator('#report-status').innerText()) === 'Submitted' && await page.locator('#report-history li').count() === 1);
    await page.evaluate(reference => window.MutiaraConnectFeedback.updateStatus(reference, 'In Progress', 'Sample integration update: the access arrangement is being reviewed.'), id);
    check('The shared staff API updates the displayed status and appends history', (await page.locator('#report-status').innerText()) === 'In Progress' && await page.locator('#report-history li').count() === 2);
    await page.evaluate(reference => window.MutiaraConnectFeedback.updateStatus(reference, 'Responded', 'Sample integration response: proposed signs have been shared.'), id);
    check('A second staff API update displays the response without losing earlier history', (await page.locator('#report-status').innerText()) === 'Responded' && await page.locator('#report-history li').count() === 3 && (await page.locator('#report-response-text').innerText()).includes('proposed signs'));
    await page.reload();
    check('The integrated status and history survive a reload', (await page.locator('#report-reference').innerText()) === id && await page.locator('#report-history li').count() === 3);
    const snapshot = await page.evaluate(() => localStorage.getItem(window.MutiaraConnectFeedback.STORAGE_KEY));
    await page.goto(`${base}/docs/member3/ui/admin-prototype.html`);
    await page.locator('#staff-response').fill('This design-only response must not alter actual saved reports.');
    await page.locator('#staff-preview-form button').click();
    check('The design-only staff page cannot overwrite an integrated public report', await page.evaluate(() => localStorage.getItem('mutiaraconnect.feedback.v1')) === snapshot);
    await page.goto(`${base}/docs/member3/ui/index.html?screen=admin`);
    check('The UI catalogue routes administration to the isolated proposal', await page.locator('#preview-open').getAttribute('href') === 'admin-prototype.html' && (await page.locator('#preview-state').innerText()) === 'Design prototype');
    const headerLinks = ['index.html', 'announcements.html', 'map.html', 'feedback.html', 'tracking.html'];
    check('All implemented public navigation destinations exist in the clean review folder', headerLinks.every(name => fs.existsSync(path.join(root, name))));
    check('The missing formal admin page is recorded as a dependency, not misreported as implemented', !fs.existsSync(path.join(root, 'admin.html')) && fs.existsSync(path.join(root, 'docs/member3/ui/admin-prototype.html')));
    check('Existing local Leaflet assets and offline schematic are included', ['assets/vendor/leaflet/leaflet.js', 'assets/vendor/leaflet/leaflet.css', 'assets/map/penang-schematic.svg'].every(name => fs.existsSync(path.join(root, name))));
    for (const name of ['layers.png', 'layers-2x.png', 'marker-icon.png', 'marker-icon-2x.png', 'marker-shadow.png']) {
      const response = await page.request.get(`${base}/assets/vendor/leaflet/images/${name}`);
      const bytes = await response.body();
      check(`Leaflet 1.9.4 image ${name} loads as a valid PNG`, response.status() === 200 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
    }
    check('The report, figure assets and demo materials are included', ['docs/member3/report/Member3_Prototype_Design.docx', 'docs/member3/report/assets/PD4_feedback_tracking.png', 'docs/member3/DEMO_EN.md', 'docs/member3/DEMO_ZH.md'].every(name => fs.existsSync(path.join(root, name))));
    check('The public cross-module workflow has no unhandled script or local-resource errors', errors.length === 0 && badLocal.length === 0);
    const result = { checkedAt: new Date().toISOString(), checks, errors, badLocal, knownDependencies: [{ path: 'admin.html', owner: 'Administrator module', status: 'Not implemented; shared API tested, isolated UI proposal supplied' }], apiSimulation: 'Staff updates were exercised through the shared API, not a nonexistent staff page' };
    fs.writeFileSync(path.join(root, 'docs/member3/integration-verification.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ passed: checks.length, errors, badLocal, knownDependencies: ['admin.html'] }));
    await context.close();
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { await browser.close(); }
})();
