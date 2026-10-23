/* Actual Google service validation. Never log the configured key or URLs. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const output=path.join(root,'docs/member2');
const suffix=process.env.GOOGLE_LIVE_LABEL==='file'?'-file':'';
const box={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'js/google-map-config.js'),'utf8'),box);
const key=box.window.MutiaraConnectGoogleMapConfig?.apiKey?.trim();
if(!key){console.log(JSON.stringify({configured:false}));process.exit(2);}
const sanitize=text=>String(text).split(key).join('[REDACTED]');
const checks=[];
async function markersVisible(page,selected=false){
 await page.waitForFunction(selected=>{
  const map=document.querySelector('#google-construction-map').getBoundingClientRect();
  const markers=[...document.querySelectorAll('#google-construction-map gmp-advanced-marker'+(selected?'[data-selected="true"]':''))];
  return markers.length>0&&markers.every(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.left>=map.left&&r.right<=map.right&&r.top>=map.top&&r.bottom<=map.bottom-18;});
 },selected,{timeout:10000});
}
function check(label,result){checks.push({label,result:result?'PASS':'FAIL'});if(!result)throw new Error(label);}
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const errors=[];const googleCodes=[];
 const context=await browser.newContext({viewport:{width:1440,height:1100}});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(sanitize(e.message)));
 page.on('console',msg=>{if(msg.type()==='error'&&/Google Maps JavaScript API|Google Maps Platform/.test(msg.text()))googleCodes.push(sanitize(msg.text()).replace(/https?:\/\/\S+/g,'[URL]'));});
 let status='';let failure;let failureGeometry;
 try{
  await page.goto((process.env.BASE_URL||'http://127.0.0.1:8332')+'/map.html');
  await page.waitForFunction(()=>{const s=document.querySelector('#map-status').textContent;return s.startsWith('Google Maps ·')||s.includes('Google Maps unavailable')||s.includes('not configured');},null,{timeout:35000});
  status=await page.locator('#map-status').innerText();
  check('Actual Google Maps API and initial tiles load',status.startsWith('Google Maps ·'));
  check('Three real Google advanced markers display',await page.locator('#google-construction-map gmp-advanced-marker').count()===3);
  await markersVisible(page);check('All three real Google markers are fully inside the initial viewport',true);
  await page.locator('.mc-map-workspace').screenshot({path:path.join(output,'screenshots/map-google-live.png')});
  await page.locator('#map-area').selectOption('gelugor');
  check('Real Google map and cards share filtering',await page.locator('#google-construction-map gmp-advanced-marker').count()===1&&await page.locator('.mc-map-card').count()===1);
  await page.locator('#google-construction-map gmp-advanced-marker').click();
  check('Real Google marker opens shared announcement details',(await page.locator('#map-detail').innerText()).includes('MC-DEMO-002'));
  check('Real Google selection links to the original notice',await page.locator('#map-read-notice').getAttribute('href')==='announcement-detail.html?id=MC-DEMO-002');
  await page.locator('#map-reset-filters').click();await page.locator('#map-fit').click();
  check('Real Google reset restores all three locations',await page.locator('#google-construction-map gmp-advanced-marker').count()===3&&await page.locator('#map-detail').isHidden());
  await page.setViewportSize({width:390,height:844});
  await page.locator('.mc-map-card[data-site="CS-GT-01"]').click();
  await markersVisible(page,true);check('Selected real Google marker is fully visible on a phone',true);
  check('Real Google mobile page has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('.mc-map-workspace').screenshot({path:path.join(output,'screenshots/map-google-live-mobile.png')});
  await page.locator('#map-schematic').click();check('Real Google view switches to offline schematic',await page.locator('#construction-map').isVisible());
  await page.locator('#map-google').click();check('Real Google view can be restored',await page.locator('#google-construction-map').isVisible());
  check('Actual Google map scenarios have no uncaught errors',errors.length===0&&googleCodes.length===0);
 }catch(error){failure=sanitize(error.message);failureGeometry=await page.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};return {map:rect(document.querySelector('#google-construction-map')),markers:[...document.querySelectorAll('gmp-advanced-marker')].map(e=>({site:e.dataset.site,host:rect(e),child:e.firstElementChild?rect(e.firstElementChild):null}))};}).catch(()=>null);await page.screenshot({path:path.join(output,'screenshots/map-google-live-status.png'),fullPage:true}).catch(()=>{});process.exitCode=1;}
 finally{
  const result={testedAt:new Date().toISOString(),mode:'Real Google Maps API and real map tiles; no API simulation',configured:true,status,checks,errors,googleCodes,...(failure?{failure,failureGeometry}:{})};
  fs.writeFileSync(path.join(output,`google-map-live${suffix}-verification.json`),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));await browser.close();
 }
})().catch(error=>{console.log(sanitize(error.message));process.exitCode=1;});
