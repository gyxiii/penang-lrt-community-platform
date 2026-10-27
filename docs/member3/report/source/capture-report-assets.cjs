const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..', '..', '..', '..');
const assets = path.resolve(__dirname, '..', 'assets');
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };
const captures = [];
const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { response.writeHead(404).end(); return; }
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    response.end(data);
  });
});
(async () => {
  fs.mkdirSync(assets, { recursive: true });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  let browser;
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const context = await browser.newContext({ viewport: { width: 1440, height: 2000 }, reducedMotion: 'reduce' });
    await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort('internetdisconnected'));
    const page = await context.newPage();
    const capture = async (name, route, selector, options = {}) => {
      await page.setViewportSize({ width: options.width || 1440, height: 2000 });
      await page.goto(base + route);
      if (options.prepare) await options.prepare();
      await page.evaluate(async () => { await document.fonts.ready; document.activeElement.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
      const box = await page.locator(selector).boundingBox();
      if (!box) throw new Error('Missing report capture region: ' + selector);
      let height = box.height;
      if (options.endAt) {
        const end = await page.locator(options.endAt).boundingBox();
        height = end.y + end.height + 20 - box.y;
      }
      const clip = { x: box.x, y: box.y, width: box.width, height: Math.min(height, box.height) };
      const filename = path.join(assets, name);
      await page.screenshot({ path: filename, clip, animations: 'disabled' });
      const sha256 = crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
      captures.push({ name, source: route, selector, clip, viewportWidth: options.width || 1440, designOnly: Boolean(options.designOnly), sha256 });
    };
    await capture('PD1_home_navigation.png', '/index.html', '.feature-grid', { prepare: () => page.waitForSelector('#home-announcements .notice-card') });
    await capture('PD2_staff_design_excerpt.png', '/docs/member3/ui/admin-prototype.html', '.ui-admin-workspace', {
      width: 1280, designOnly: true, endAt: '#staff-preview-form button', prepare: async () => {
        await page.locator('#staff-next-status').selectOption('Responded');
        await page.locator('#staff-response').fill('Sample response: additional walkway signs have been proposed. The access arrangement will be explained in the next community update.');
      }
    });
    await capture('PD3_feedback_form_excerpt.png', '/feedback.html', '.mc-feedback-layout > .mc-feedback-panel', { width: 760, endAt: '#feedback-area' });
    await capture('PD4_feedback_tracking.png', '/tracking.html?reference=MC-FB-DEMO-003', '#tracking-result', { prepare: () => page.waitForSelector('#tracking-result:not([hidden])') });
    fs.writeFileSync(path.join(assets, 'capture-manifest.json'), JSON.stringify({ capturedAt: new Date().toISOString(), method: 'Actual browser region captures; no screen text altered', captures }, null, 2));
    console.log(JSON.stringify({ assets: captures.map(c => ({ name: c.name, width: c.clip.width, height: c.clip.height, designOnly: c.designOnly })) }));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
