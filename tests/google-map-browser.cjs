/* Google API contract simulation, NOT proof of real Google map rendering. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.BASE_URL||'http://127.0.0.1:8332';
const root=path.resolve(__dirname,'..');
const checks=[];
const sdkStub=`(()=>{
 const events=new WeakMap();
 const event={addListenerOnce(obj,name,fn){const list=events.get(obj)||[];const item={name,fn};list.push(item);events.set(obj,list);return {remove(){const i=list.indexOf(item);if(i>=0)list.splice(i,1);}};}};
 function emit(obj,name){const list=events.get(obj)||[];for(const item of [...list])if(item.name===name){list.splice(list.indexOf(item),1);item.fn();}}
 class FakeMap{
  constructor(el,opts){this.el=el;this.zoom=opts.zoom;el.textContent='SIMULATED GOOGLE API - CONTRACT TEST ONLY';setTimeout(()=>emit(this,'tilesloaded'),10);}
  getZoom(){return this.zoom;}setZoom(z){this.zoom=z;this.el.dataset.zoom=z;}
  moveCamera(o){this.setZoom(o.zoom);this.setCenter(o.center);}
  setCenter(c){this.el.dataset.center=JSON.stringify(c);}panBy(x,y){this.el.dataset.pan=JSON.stringify([x,y]);}
  fitBounds(bounds,padding){this.el.dataset.bounds=JSON.stringify(bounds.points);this.el.dataset.padding=JSON.stringify(padding);queueMicrotask(()=>emit(this,'idle'));}
 }
 class Bounds{constructor(){this.points=[];}extend(p){this.points.push(p);}}
 class Circle{constructor(opts){this.options=opts;}setMap(map){this.options.map=map;}setOptions(opts){Object.assign(this.options,opts);}}
 class Advanced extends HTMLElement{
  constructor(opts){super();this.title=opts.title;this.tabIndex=0;this.setAttribute('role','button');this.setAttribute('aria-label',opts.title);this.map=opts.map;this.addEventListener('click',()=>this.dispatchEvent(new Event('gmp-click')));}
  set map(value){this._map=value;if(value)value.el.append(this);else this.remove();}get map(){return this._map;}
 }
 customElements.define('gmp-advanced-marker',Advanced);
 class Pin{constructor(opts){const el=document.createElement('span');el.textContent=opts.glyphText;el.style.background=opts.background;return el;}}
 window.google={maps:{event,LatLngBounds:Bounds,Circle,importLibrary:async name=>name==='maps'?{Map:FakeMap}:{AdvancedMarkerElement:Advanced,PinElement:Pin}}};
 window[new URL(document.currentScript.src).searchParams.get('callback')]();
})();`;
function check(label,ok){assert.ok(ok,label);checks.push({label,result:'PASS'});}
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const errors=[];
 async function session({key='contract-test-key',prefer=true,sdk='stub',width=1440}={}){
  const context=await browser.newContext({viewport:{width,height:1100}});
  await context.route('**/js/google-map-config.js',route=>route.fulfill({contentType:'application/javascript',body:`window.MutiaraConnectGoogleMapConfig={apiKey:${JSON.stringify(key)},mapId:'DEMO_MAP_ID',preferGoogle:${prefer}};`}));
  await context.route('https://maps.googleapis.com/maps/api/js?**',async route=>{
    if(sdk==='fail'){await route.abort();return;}
    if(sdk==='slow')await new Promise(resolve=>setTimeout(resolve,500));
    await route.fulfill({contentType:'application/javascript',body:sdkStub});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/map.html');await page.locator('.mc-map-pin').first().waitFor({state:'attached'});
  return {context,page};
 }
 try{
  let s=await session({key:''});
  await s.page.locator('#map-google').click();
  check('Missing key keeps the offline map and gives an explicit message',(await s.page.locator('#map-status').innerText()).includes('not configured')&&await s.page.locator('#google-construction-map').isHidden()&&await s.page.locator('.mc-map-pin').count()===3);
  await s.context.close();
  s=await session({sdk:'fail'});
  await s.page.waitForFunction(()=>document.querySelector('#map-status').textContent.includes('unavailable'));
  check('Google script loading failure restores the offline map',await s.page.locator('#map-schematic').getAttribute('aria-pressed')==='true'&&await s.page.locator('#construction-map').isVisible());
  await s.context.close();
  s=await session();let p=s.page;
  await p.waitForFunction(()=>document.querySelector('#map-google').getAttribute('aria-pressed')==='true');
  check('Configured Google map is embedded and receives three shared locations',await p.locator('#google-construction-map').isVisible()&&await p.locator('gmp-advanced-marker').count()===3&&!await p.locator('#construction-map').isVisible());
  await p.getByRole('button',{name:'View George Town construction details',exact:true}).last().click();
  check('Google marker opens the existing announcement details',(await p.locator('#map-detail').innerText()).includes('MC-DEMO-001')&&await p.locator('#map-read-notice').getAttribute('href')==='announcement-detail.html?id=MC-DEMO-001');
  await p.locator('[data-map-notice="MC-DEMO-004"]').click();
  check('Switching shared notices on Google preserves the real announcement link',await p.locator('#map-read-notice').getAttribute('href')==='announcement-detail.html?id=MC-DEMO-004');
  await p.locator('#map-fit').click();
  check('Google fit clears the detail and positions all three points',await p.locator('#map-detail').isHidden()&&await p.locator('gmp-advanced-marker').count()===3&&Number(await p.locator('#google-construction-map').getAttribute('data-zoom'))<=13);
  await p.locator('#map-area').selectOption('gelugor');
  check('Google markers and result cards share area filtering',await p.locator('gmp-advanced-marker').count()===1&&await p.locator('.mc-map-card').count()===1);
  await p.locator('.mc-map-card').click();
  check('Result card selection focuses the same Google location',await p.locator('gmp-advanced-marker[data-site="CS-GE-01"][data-selected="true"]').count()===1&&(await p.locator('#map-detail').innerText()).includes('MC-DEMO-002'));
  await p.locator('#google-map-zoom-in').click();
  check('Google zoom controls call the embedded map',Number(await p.locator('#google-construction-map').getAttribute('data-zoom'))===14);
  await p.locator('#map-search').fill('no matching place');
  check('Empty results clear Google markers and the notice',await p.locator('gmp-advanced-marker').count()===0&&await p.locator('#map-detail').isHidden());
  await p.getByRole('button',{name:'Reset filters',exact:true}).click();
  await p.locator('#map-schematic').click();
  check('Manual schematic switch hides Google and restores three local markers',await p.locator('#construction-map').isVisible()&&!await p.locator('#google-construction-map').isVisible()&&await p.locator('.mc-map-pin').count()===3);
  await p.locator('#map-google').click();
  await p.waitForFunction(()=>document.querySelector('#map-google').getAttribute('aria-pressed')==='true');
  check('A loaded Google view can be selected again',await p.locator('#google-construction-map').isVisible()&&await p.locator('gmp-advanced-marker').count()===3);
  await p.setViewportSize({width:390,height:844});
  check('Three basemap controls fit on a phone without horizontal overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const controls=await p.evaluate(()=>{const a=document.querySelector('.mc-map-basemaps').getBoundingClientRect(),b=document.querySelector('#map-fit').getBoundingClientRect();return a.right<=b.left;});
  check('Mobile Google selector does not overlap the fit control',controls);
  await p.locator('.mc-map-card[data-site="CS-GE-01"]').click();
  await s.context.setOffline(true);
  await p.waitForFunction(()=>document.querySelector('#map-schematic').getAttribute('aria-pressed')==='true');
  check('Going offline restores the schematic and retains the selected notice',await p.locator('#construction-map').isVisible()&&(await p.locator('#map-detail').innerText()).includes('MC-DEMO-002'));
  await s.context.close();
  s=await session({sdk:'slow',prefer:false});p=s.page;
  await p.locator('#map-google').click();await p.locator('#map-schematic').click();
  await p.waitForFunction(()=>!document.querySelector('#map-google').disabled);
  check('A delayed Google response cannot override a newer schematic selection',await p.locator('#map-schematic').getAttribute('aria-pressed')==='true'&&await p.locator('#construction-map').isVisible()&&await p.locator('#google-construction-map').isHidden());
  await s.context.close();
  s=await session();p=s.page;
  await p.waitForFunction(()=>document.querySelector('#map-google').getAttribute('aria-pressed')==='true');
  await p.evaluate(()=>window.gm_authFailure());
  check('Google authentication failure restores the offline map',await p.locator('#map-schematic').getAttribute('aria-pressed')==='true'&&await p.locator('#construction-map').isVisible());
  await s.context.close();
  check('Contract scenarios have no uncaught JavaScript errors',errors.length===0);
  const result={testedAt:new Date().toISOString(),mode:'Simulated Google Maps API contract checks; no real Google account or tiles tested',checks,errors};
  fs.writeFileSync(path.join(root,'docs/member2/google-map-verification.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
