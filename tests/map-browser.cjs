/* Optional integration QA. The website itself has no Node dependencies.
 * npm install --no-save playwright, start any static server, then run this file.
 * BASE_URL, PLAYWRIGHT_MODULE and BROWSER_PATH may override the defaults. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const output=path.join(root,'docs','member2');
const screenshots=path.join(output,'screenshots');
const base=(process.env.BASE_URL||'http://127.0.0.1:8332').replace(/\/$/,'');
const checks=[];
function check(label,condition){assert.ok(condition,label);checks.push({label,result:'PASS'});}
async function schematicOnly(context){
 await context.route('**/js/google-map-config.js',route=>route.fulfill({contentType:'application/javascript',body:"window.MutiaraConnectGoogleMapConfig={apiKey:'',preferGoogle:false};"}));
}
const selectedMarkerUncovered=page=>page.evaluate(()=>{
 const marker=document.querySelector('.mc-map-pin.selected');const detail=document.querySelector('#map-detail');
 if(!marker||!detail||detail.hidden)return false;
 const m=marker.getBoundingClientRect(),d=detail.getBoundingClientRect();
 return m.bottom<=d.top||m.top>=d.bottom||m.right<=d.left||m.left>=d.right;
});
(async()=>{
 fs.mkdirSync(screenshots,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{channel:'msedge'})});
 const errors=[],badLocal=[];
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1150},deviceScaleFactor:1});
  await schematicOnly(context);
  context.on('page',page=>{page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)badLocal.push(`${r.status()} ${r.url()}`);});});
  const page=await context.newPage();
  await page.goto(`${base}/index.html`);
  await page.waitForSelector('#home-announcements .notice-card');
  check('Existing home page still renders its three announcement cards',await page.locator('#home-announcements .notice-card').count()===3);
  await page.locator('.feature-card[href="map.html"]').click();await page.waitForURL('**/map.html');await page.waitForSelector('.mc-map-pin');
  check('Existing homepage feature opens the integrated MutiaraConnect map',(await page.title()).includes('MutiaraConnect')&&await page.locator('.brand strong').innerText()==='MutiaraConnect');
  check('Four shared notices map to three distinct sample locations',await page.locator('.mc-map-card').count()===3&&await page.locator('.mc-map-pin').count()===3&&(await page.locator('#map-result-count').innerText())==='3 sample locations · 4 linked notices');
  await page.locator('.leaflet-image-layer').evaluate(i=>i.decode());
  check('Local schematic image loads without remote assets',await page.locator('.leaflet-image-layer').evaluate(i=>i.naturalWidth===1400));
  await page.locator('.mc-map-workspace').screenshot({path:path.join(screenshots,'map-overview.png')});
  await page.screenshot({path:path.join(screenshots,'map-desktop.png'),fullPage:true});
  await page.locator('#map-area').selectOption('george-town');
  check('Area filtering retains both notices for the George Town point',await page.locator('.mc-map-card').count()===1&&await page.locator('.mc-map-pin').count()===1&&(await page.locator('#map-result-count').innerText()).includes('2 linked notices'));
  await page.locator('#map-type').selectOption('General update');
  await page.locator('.mc-map-card').click();
  check('Combined area and type filtering selects the matching general notice',(await page.locator('#map-detail').innerText()).includes('MC-DEMO-004')&&await page.locator('#map-read-notice').getAttribute('href')==='announcement-detail.html?id=MC-DEMO-004');
  await page.locator('#map-search').fill('no matching place');
  check('Empty search clears stale cards, markers and detail',await page.locator('.mc-map-card').count()===0&&await page.locator('.mc-map-pin').count()===0&&await page.locator('#map-detail').isHidden()&&await page.getByRole('heading',{name:'No matching work areas'}).isVisible());
  await page.getByRole('button',{name:'Reset filters',exact:true}).click();
  check('Empty-state reset restores all locations and keyboard input focus',await page.locator('.mc-map-pin').count()===3&&await page.evaluate(()=>document.activeElement.id==='map-search'));
  await page.locator('#map-search').fill('  mC-DeMo-002  ');
  check('Search accepts notice references regardless of case or padding',await page.locator('.mc-map-card').count()===1&&(await page.locator('.mc-map-card').innerText()).includes('Gelugor'));
  await page.locator('.mc-map-card').focus();await page.keyboard.press('Enter');
  check('Keyboard card selection preserves card focus',await page.evaluate(()=>document.activeElement.dataset.site==='CS-GE-01'));
  check('Selected marker remains visible above the desktop detail panel',await selectedMarkerUncovered(page));
  await page.locator('#map-reset-filters').click();
  await page.locator('.mc-map-card[data-site="CS-GT-01"]').click();
  await page.locator('[data-map-notice="MC-DEMO-004"]').focus();await page.keyboard.press('Enter');
  check('Switching linked notices preserves keyboard focus and changes the real detail link',await page.evaluate(()=>document.activeElement.dataset.mapNotice==='MC-DEMO-004')&&await page.locator('#map-read-notice').getAttribute('href')==='announcement-detail.html?id=MC-DEMO-004');
  await page.locator('#map-close-detail').click();
  check('Closing details restores focus to the selected location card',await page.evaluate(()=>document.activeElement.dataset.site==='CS-GT-01'));
  await page.locator('.mc-map-pin').nth(1).focus();await page.keyboard.press('Enter');
  check('Keyboard marker selection preserves focus and opens the matching announcement',await page.evaluate(()=>document.activeElement.classList.contains('mc-map-pin'))&&(await page.locator('#map-detail').innerText()).includes('MC-DEMO-002'));
  await page.locator('.mc-map-workspace').screenshot({path:path.join(screenshots,'map-detail.png')});
  const transform=await page.locator('.leaflet-image-layer').getAttribute('style');
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.waitForTimeout(300);
  check('Map zoom control updates the map transformation',(await page.locator('.leaflet-image-layer').getAttribute('style'))!==transform);
  await page.locator('#map-fit').click();
  await page.locator('#map-help-open').click();
  check('Help opens a named dialog',await page.getByRole('dialog',{name:'Explore a sample work area'}).isVisible());
  await page.keyboard.press('Escape');check('Help closes with Escape',!await page.locator('#map-help').isVisible());
  for(const id of ['MC-DEMO-001','MC-DEMO-002','MC-DEMO-003','MC-DEMO-004']){
   await page.goto(`${base}/announcement-detail.html?id=${id}`);await page.waitForSelector('#announcement-detail h1');
   const notice=await page.evaluate(id=>window.MutiaraConnectData.announcements.find(n=>n.id===id),id);
   check(`${id}: original detail page now links to its map selection`,await page.locator('#view-impact-map').getAttribute('href')===`map.html?notice=${id}`);
   await page.locator('#view-impact-map').click();await page.waitForURL(`**/map.html?notice=${id}`);await page.waitForSelector('#map-read-notice');
   const detail=await page.locator('#map-detail').innerText();
   check(`${id}: map reuses the exact shared title, date, impact and access text`,[notice.title,notice.dateLabel,notice.period,notice.impact,notice.access].every(text=>detail.includes(text)));
   await page.locator('#map-read-notice').click();await page.waitForURL(`**/announcement-detail.html?id=${id}`);
   check(`${id}: map returns to the matching existing announcement`,(await page.locator('#announcement-detail h1').innerText())===notice.title);
  }
  await page.goto(`${base}/announcements.html`);await page.waitForSelector('#announcement-list .notice-card');
  check('Existing announcement list still renders all four records',await page.locator('#announcement-list .notice-card').count()===4);
  await page.locator('#area-filter').selectOption('gelugor');
  check('Existing announcement area filtering still works',await page.locator('#announcement-list .notice-card').count()===1&&(await page.locator('#announcement-list').innerText()).includes('Pedestrian access'));
  await page.locator('#reset-filters').click();check('Existing announcement reset still restores all notices',await page.locator('#announcement-list .notice-card').count()===4);
  await page.goto(`${base}/map.html?notice=unknown`);await page.waitForSelector('.mc-map-pin');
  check('Unknown map reference gives a clear message without selecting a wrong notice',await page.locator('#map-message').isVisible()&&await page.locator('#map-detail').isHidden()&&await page.locator('.mc-map-pin').count()===3);
  await page.goto(`${base}/map.html`);await page.waitForSelector('.mc-map-pin');
  await page.locator('#map-street').click();
  await page.waitForFunction(()=>document.querySelectorAll('.leaflet-tile-loaded').length>0||document.querySelector('#map-status').textContent.includes('unavailable'),null,{timeout:13000});
  const streetLoaded=await page.locator('.leaflet-tile-loaded').count();
  check('Online street map actually loads tiles',streetLoaded>0);
  await page.locator('.mc-map-frame').screenshot({path:path.join(screenshots,'map-street.png')});
  await context.route('https://tile.openstreetmap.org/**',route=>route.abort('internetdisconnected'));
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#map-status').textContent.includes('unavailable'),null,{timeout:13000});
  check('A later network outage after successful street tiles restores the schematic',await page.locator('#map-schematic').getAttribute('aria-pressed')==='true'&&await page.locator('.leaflet-image-layer').count()===1);
  check('Desktop pages have no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await context.close();
  const offline=await browser.newContext({viewport:{width:1280,height:1024}});
  await offline.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>route.abort('internetdisconnected'));
  await schematicOnly(offline);
  const op=await offline.newPage();await op.goto(`${base}/map.html`);await op.waitForSelector('.mc-map-pin');
  check('Blocking all external traffic leaves the schematic and three markers usable',await op.locator('.mc-map-pin').count()===3&&await op.locator('.leaflet-image-layer').evaluate(i=>i.complete&&i.naturalWidth>0));
  await op.locator('#map-street').click();await op.waitForFunction(()=>document.querySelector('#map-status').textContent.includes('unavailable'),null,{timeout:13000});
  check('An initial street-map network failure also restores the schematic',await op.locator('#map-schematic').getAttribute('aria-pressed')==='true');
  await offline.close();
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await schematicOnly(mobile);
  const mp=await mobile.newPage();await mp.goto(`${base}/map.html?notice=MC-DEMO-001`);await mp.waitForSelector('.mc-map-pin.selected');
  check('Mobile layout fits 390 pixels without horizontal page overflow',await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  check('Mobile notice details do not cover the selected construction marker',await selectedMarkerUncovered(mp));
  await mp.screenshot({path:path.join(screenshots,'map-mobile.png'),fullPage:true});
  await mp.locator('.menu-toggle').click();
  check('Existing mobile navigation opens and exposes the current Impact Map link',await mp.locator('.menu-toggle').getAttribute('aria-expanded')==='true'&&await mp.locator('.nav-links a[aria-current="page"]').isVisible());
  await mp.locator('.menu-toggle').click();await mp.locator('#map-type').selectOption('Pedestrian access');
  check('Mobile select filtering keeps markers and cards in sync',await mp.locator('.mc-map-card').count()===1&&await mp.locator('.mc-map-pin').count()===1);
  await mobile.close();
  const direct=await browser.newContext();await schematicOnly(direct);const fp=await direct.newPage();await fp.goto(`file:///${root.replace(/\\/g,'/')}/map.html?notice=MC-DEMO-003`);await fp.waitForSelector('#map-read-notice');
  check('Direct file opening loads shared records and a notice-specific map selection',(await fp.locator('#map-detail').innerText()).includes('MC-DEMO-003')&&await fp.locator('.mc-map-pin').count()===3);
  await fp.locator('#map-area').selectOption('george-town');check('Direct file opening supports map filters',await fp.locator('.mc-map-pin').count()===1);
  await direct.close();
  check('Implemented pages have no JavaScript exceptions or missing local assets',errors.length===0&&badLocal.length===0);
  const report={testedAt:new Date().toISOString(),browser:'Microsoft Edge',checks,errors,missingLocalAssets:badLocal,existingTeamPlaceholders:['feedback.html','tracking.html','admin.html'],scope:'Member 1 pages plus the integrated Member 2 map; other members’ absent modules are not implemented here.'};
  fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({count:checks.length,results:checks,errors,badLocal},null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
