/* UI QA on a local HTTP server. Remote map services are blocked or simulated. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/member2/location-editor-qa');
const checks=[],errors=[];
const check=(label,ok)=>{assert.ok(ok,label);checks.push({label,result:'PASS'});};
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(target,(e,data)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream'});res.end(e?'Not found':data);});
});
const googleStub=`(()=>{
 class FakeMap{constructor(el){this.el=el;this.zoom=12;el.textContent='SIMULATED GOOGLE MAP FOR API CONTRACT QA';el.addEventListener('click',e=>{if(e.target===el)this.onClick?.({latLng:{lat:()=>5.365432,lng:()=>100.312345}});});}addListener(name,fn){this.onClick=fn;return {remove:()=>{this.onClick=null;}};}getZoom(){return this.zoom;}setZoom(z){this.zoom=z;}moveCamera(o){this.zoom=o.zoom;}}
 class Marker extends HTMLElement{constructor(o){super();this.map=o.map;this.position=o.position;this.tabIndex=0;this.addEventListener('click',()=>this.dispatchEvent(new Event('gmp-click')));}set map(m){if(m)m.el.append(this);else this.remove();}set position(p){this.dataset.position=JSON.stringify(p);}}
 customElements.define('gmp-advanced-marker',Marker);
 class Circle{constructor(o){this.options=o;}setMap(m){this.options.map=m;}setOptions(o){Object.assign(this.options,o);}}
 class Pin{constructor(o){const n=document.createElement('span');n.textContent=o.glyphText;return n;}}
 window.google={maps:{Circle,event:{addListenerOnce(obj,name,fn){setTimeout(fn,10);return {remove(){}};}},importLibrary:async n=>n==='maps'?{Map:FakeMap}:{AdvancedMarkerElement:Marker,PinElement:Pin}}};
 window[new URL(document.currentScript.src).searchParams.get('callback')]();
})();`;
async function fill(page,patch={}){
 const data={name:'Example work area A',areaLabel:'Gelugor',latitude:'5.36',longitude:'100.31',title:'Example additional road notice',type:'Road access',startDate:'2026-11-02',endDate:'2026-11-05',impact:'Illustrative road access changes.',access:'Follow signs at the location.',sourceKind:'example',sourceTitle:'',sourceUrl:'',sourceDate:'',...patch};
 for(const [key,value] of Object.entries(data)){
  const field=page.locator(`#location-form [name="${key}"]`);
  if(['type','sourceKind'].includes(key))await field.selectOption(value);else await field.fill(value);
 }
}
async function save(page){await page.locator('#location-save').click();}
async function close(page){await page.locator('#location-close').click();}
(async()=>{
 fs.mkdirSync(out,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 async function session(google=false){
  const context=await browser.newContext({viewport:{width:1440,height:1150},reducedMotion:'reduce'});
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>route.abort());
  await context.route('**/js/google-map-config.js',route=>route.fulfill({contentType:'application/javascript',body:`window.MutiaraConnectGoogleMapConfig={apiKey:'${google?'contract-test-key':''}',preferGoogle:${google}};`}));
  if(google)await context.route('https://maps.googleapis.com/maps/api/js?**',route=>route.fulfill({contentType:'application/javascript',body:googleStub}));
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/map.html');await page.locator('.mc-map-pin').first().waitFor({state:'attached'});return {context,page};
 }
 try{
  const {context,page:p}=await session();
  check('Default three sites and four notices are unchanged',await p.locator('.mc-map-card').count()===3&&(await p.locator('#map-result-count').innerText())==='3 sample locations · 4 linked notices');
  await p.locator('#location-open').click();
  check('Accessible location editor opens',await p.getByRole('dialog',{name:'Manage construction locations'}).isVisible());
  await fill(p);await save(p);
  check('Manual entry saves and immediately adds a marker and card',await p.locator('.mc-map-pin').count()===4&&await p.locator('.mc-map-card').count()===4&&(await p.locator('#location-message').innerText()).startsWith('Saved'));
  const record=await p.evaluate(()=>window.MutiaraConnectLocationStore.read()[0]);
  check('Existing area names do not duplicate filter options',await p.locator('#map-area option[value="gelugor"]').count()===1);
  await close(p);await p.reload();await p.locator('.mc-map-pin').first().waitFor();
  check('Saved point persists after reload',await p.locator('.mc-map-pin').count()===4);
  await p.locator(`[data-site="CS-${record.id}"]`).click();
  check('Saved marker detail exposes its source and coordinates',(await p.locator('#map-detail').innerText()).includes('User-created example')&&(await p.locator('#map-detail').innerText()).includes('5.360000'));
  check('Added marker is visible above its expanded source panel',await p.locator('.mc-map-pin.selected').evaluate(el=>{const m=el.getBoundingClientRect(),d=document.querySelector('#map-detail').getBoundingClientRect();return m.bottom<=d.top&&m.top>=document.querySelector('#construction-map').getBoundingClientRect().top;}));
  await p.locator('#map-read-notice').click();
  check('Local notice opens the correct full announcement',(await p.locator('#announcement-detail h1').innerText())==='Example additional road notice');
  await p.locator('#view-impact-map').click();
  await p.locator(`[data-site="CS-${record.id}"][aria-pressed="true"]`).waitFor();
  check('Notice-to-map round trip selects the same local record',await p.locator(`[data-site="CS-${record.id}"][aria-pressed="true"]`).count()===1);
  await p.goto(base+'/announcements.html');await p.locator('#area-filter').selectOption('gelugor');
  check('Added notice participates in existing public filters',await p.locator('#announcement-list .notice-card').count()===2);
  await p.goto(base+'/map.html');await p.locator('#location-open').click();
  await fill(p,{name:'Rejected date',endDate:'2026-10-01'});await save(p);
  check('Invalid date order does not create a point',(await p.locator('#location-message').innerText()).includes('end date')&&await p.locator('.mc-map-pin').count()===4);
  await fill(p,{latitude:'80'});await save(p);
  check('Out-of-region coordinates are rejected by the form',await p.locator('[name="latitude"]').evaluate(e=>!e.validity.valid)&&await p.locator('.mc-map-pin').count()===4);
  await fill(p,{sourceKind:'notice-reference'});await save(p);
  check('Published notice needs both source fields',await p.locator('[name="sourceTitle"]').evaluate(e=>e.required&&!e.validity.valid));
  await fill(p,{sourceUrl:'javascript:alert(1)'});await save(p);
  check('Executable source URLs cannot be saved',await p.locator('.mc-map-pin').count()===4);
  await fill(p,{sourceKind:'notice-reference',sourceTitle:'<img src=x onerror="window.attacked=true">',sourceUrl:'https://example.org/notice',name:'Reference work area',areaLabel:'New district',title:'<script>window.attacked=true</script>'});await save(p);
  check('Reference records save with source metadata',await p.locator('.mc-map-pin').count()===5);
  await close(p);
  check('Source markup is escaped and links are explicit',(await p.locator('#map-detail').innerText()).includes('<img src=x')&&await p.locator('#map-detail a[href="https://example.org/notice"]').count()===1&&!await p.evaluate(()=>window.attacked));
  check('New areas are available in the map filters',await p.locator('#map-area option[value="new-district"]').count()===1);
  await p.locator('#location-edit-selected').click();
  await p.locator('[name="name"]').fill('Edited reference');await p.locator('[name="latitude"]').fill('5.37');await save(p);await close(p);
  check('Editing replaces its record without duplicating the marker',await p.locator('.mc-map-pin').count()===5&&(await p.locator('#map-detail').innerText()).includes('5.370000'));
  await p.locator('#location-open').click();
  const downloadPromise=p.waitForEvent('download');await p.locator('#location-export').click();const download=await downloadPromise;
  const exportText=fs.readFileSync(await download.path(),'utf8');
  check('Export contains both local entries and no API configuration',JSON.parse(exportText).records.length===2&&!exportText.includes('apiKey')&&!exportText.includes('feedback.v1'));
  await p.locator('#location-import').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(exportText)});
  await p.waitForFunction(()=>document.querySelector('#location-message').textContent.includes('skipped 2'));
  check('Import skips existing references',await p.locator('.mc-map-pin').count()===5);
  await p.locator('#location-import').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{bad')});
  await p.waitForFunction(()=>document.querySelector('#location-message').classList.contains('location-error'));
  check('Broken backup leaves the map unchanged',await p.locator('.mc-map-pin').count()===5);
  await p.locator('#location-new').click();await fill(p);
  await p.locator('#location-pick').click();
  check('Pick mode closes the dialog and shows cancel',!await p.locator('#location-editor').isVisible()&&await p.locator('#location-pick-banner').isVisible());
  await p.locator('#construction-map').click({position:{x:390,y:220}});
  check('Schematic click supplies coordinates with an approximate label',await p.locator('#location-editor').isVisible()&&(await p.locator('[name="latitude"]').inputValue())!==''&&(await p.locator('#location-coordinate-method').innerText()).includes('approximate'));
  const coords=await p.locator('[name="latitude"]').inputValue();
  await p.locator('#location-pick').click();await p.keyboard.press('Escape');
  check('Cancelling a pick preserves form content and does not save',await p.locator('#location-editor').isVisible()&&await p.locator('[name="latitude"]').inputValue()===coords&&await p.locator('.mc-map-pin').count()===5);
  await p.locator('#location-pick').click();await p.locator('.mc-map-pin').first().click();
  check('Existing marker can supply coordinates',await p.locator('[name="latitude"]').inputValue()==='5.414800');
  await p.locator('#location-new').click();await fill(p,{name:'Quota rejected'});
  await p.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('QuotaExceededError');};});
  await save(p);
  check('Storage failure displays a clear error and no new marker',(await p.locator('#location-message').innerText()).includes('Nothing was changed')&&await p.locator('.mc-map-pin').count()===5);
  await p.evaluate(()=>Storage.prototype.setItem=window.originalSet);
  await p.locator('#location-new').click();await fill(p);
  await p.locator('#location-editor').evaluate(e=>e.scrollTop=0);
  await p.locator('#location-editor').screenshot({path:path.join(out,'location-editor-desktop.png')});
  for(const width of [320,390,768]){
   await p.setViewportSize({width,height:900});
   check(`Editor fits ${width}px viewport without horizontal overflow`,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('#location-editor').scrollWidth<=document.querySelector('#location-editor').clientWidth+1));
  }
  await p.setViewportSize({width:390,height:844});await p.locator('#location-editor').evaluate(e=>e.scrollTop=0);await p.locator('#location-editor').screenshot({path:path.join(out,'location-editor-mobile.png')});
  await p.setViewportSize({width:1440,height:1150});await close(p);
  await p.locator(`[data-site="CS-${record.id}"]`).click();await p.locator('.mc-map-workspace').screenshot({path:path.join(out,'added-location-map.png')});
  await p.locator('#location-edit-selected').click();p.once('dialog',d=>d.accept());await p.locator(`[data-remove-location="${record.id}"]`).click();
  check('Delete removes its local notice and marker only',await p.locator('.mc-map-pin').count()===4&&await p.locator('[data-remove-location]').count()===1&&await p.locator('#map-detail').isHidden());
  await close(p);await p.goto(base+'/announcement-detail.html?id=MC-'+record.id);
  check('Deleted local notice never silently falls back to a sample',(await p.locator('#announcement-detail h1').innerText())==='Local announcement not found');
  const other=await session();await other.page.locator('#location-open').click();await other.page.locator('#location-import').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(exportText)});
  await other.page.waitForFunction(()=>document.querySelector('#location-message').textContent.includes('Imported 2'));
  check('Backup restores the entries into another browser context',await other.page.locator('.mc-map-pin').count()===5);
  await other.context.close();
  await p.goto(base+'/feedback.html');
  for(const [id,value] of Object.entries({'feedback-title':'Example feedback after map change','feedback-location':'Gelugor sample area','feedback-description':'An illustrative report to check the existing group feedback submission still works.'}))await p.locator('#'+id).fill(value);
  await p.locator('#feedback-category').selectOption('Pedestrian access');await p.locator('#feedback-area').selectOption('gelugor');await p.locator('#submit-feedback').click();
  await p.waitForURL('**/feedback-success.html?reference=*');await p.locator('#receipt-track').click();
  check('Teammate feedback submission and tracking still work',await p.locator('#tracking-result').isVisible()&&(await p.locator('#report-status').innerText())==='Submitted');
  await context.close();
  const g=await session(true),gp=g.page;await gp.waitForFunction(()=>document.querySelector('#map-google').getAttribute('aria-pressed')==='true');
  await gp.locator('#location-open').click();await fill(gp,{name:'Google picked example'});await gp.locator('#location-pick').click();
  await gp.locator('#google-construction-map').click({position:{x:400,y:200}});
  check('Google map click supplies latitude and longitude (simulated API)',await gp.locator('[name="latitude"]').inputValue()==='5.365432'&&await gp.locator('[name="longitude"]').inputValue()==='100.312345');
  await save(gp);await close(gp);const googleRecord=await gp.evaluate(()=>window.MutiaraConnectLocationStore.read()[0]);
  check('Google receives the new local marker (simulated API)',await gp.locator('gmp-advanced-marker').count()===4);
  await gp.locator('#location-edit-selected').click();await gp.locator('[name="latitude"]').fill('5.38');await save(gp);await close(gp);
  const marker=gp.locator(`gmp-advanced-marker[data-site="CS-${googleRecord.id}"]`);
  check('Edited coordinates update the Google marker (simulated API)',JSON.parse(await marker.getAttribute('data-position')).lat===5.38);
  await g.context.close();check('No unhandled browser exceptions',errors.length===0);
  const result={testedAt:new Date().toISOString(),browser:'Microsoft Edge / Playwright',remoteMaps:'Google click/update API simulated; no live OSM requests',passed:checks.length,checks,errors};
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }catch(e){fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({checks,errors,failure:e.stack},null,2));throw e;}
 finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
