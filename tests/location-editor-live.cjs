/* Optional real Google Maps check. Config stays private; never print the key. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/member2/location-editor-qa');
const box={window:{}};
vm.runInNewContext(fs.readFileSync(process.env.GOOGLE_CONFIG_PATH||path.join(root,'js/google-map-config.js'),'utf8'),box);
const config=box.window.MutiaraConnectGoogleMapConfig;
if(!config?.apiKey?.trim()){console.log(JSON.stringify({configured:false}));process.exit(2);}
const sanitize=s=>String(s).split(config.apiKey).join('[REDACTED]').replace(/https?:\/\/\S+/g,'[URL]');
const checks=[],errors=[];
const check=(label,ok)=>{assert.ok(ok,label);checks.push({label,result:'PASS'});};
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{const target=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(target,(e,data)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream'});res.end(e?'Not found':data);});});
(async()=>{
 fs.mkdirSync(out,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1150}});
  await context.route('https://tile.openstreetmap.org/**',route=>route.abort());
  await context.route('**/js/google-map-config.js',route=>route.fulfill({contentType:'application/javascript',body:'window.MutiaraConnectGoogleMapConfig='+JSON.stringify({...config,preferGoogle:true})+';'}));
  const p=await context.newPage();p.on('pageerror',e=>errors.push(sanitize(e.message)));
  await p.goto(`http://127.0.0.1:${server.address().port}/map.html`);
  await p.waitForFunction(()=>document.querySelector('#map-status').textContent.startsWith('Google Maps ·'),null,{timeout:35000});
  check('Real Google API and initial tiles load',await p.locator('gmp-advanced-marker').count()===3);
  await p.locator('#location-open').click();
  for(const [name,value] of Object.entries({name:'QA example work area',areaLabel:'Gelugor',title:'QA fictional notice',startDate:'2026-11-02',endDate:'2026-11-05',impact:'Fictional example for local feature verification.',access:'Follow official on-site signs.'}))await p.locator(`[name="${name}"]`).fill(value);
  await p.locator('#location-pick').click();
  await p.locator('#google-construction-map').click({position:{x:450,y:240}});
  await p.locator('#location-editor').waitFor();
  check('Click on real Google map returns both coordinates',Number(await p.locator('[name="latitude"]').inputValue())>5.255&&Number(await p.locator('[name="longitude"]').inputValue())>100.19);
  check('Real map selection records its coordinate method',await p.locator('[name="coordinateMethod"]').inputValue()==='google-map');
  await p.locator('#location-save').click();await p.locator('#location-close').click();
  check('Real Google view receives the fourth marker',await p.locator('gmp-advanced-marker').count()===4);
  const id=await p.evaluate(()=>window.MutiaraConnectLocationStore.read()[0].id);
  await p.locator('#location-edit-selected').click();await p.locator('[name="latitude"]').fill('5.36');await p.locator('[name="longitude"]').fill('100.31');await p.locator('#location-save').click();await p.locator('#location-close').click();
  const point=await p.locator(`gmp-advanced-marker[data-site="CS-${id}"]`).evaluate(m=>({lat:typeof m.position.lat==='function'?m.position.lat():m.position.lat,lng:typeof m.position.lng==='function'?m.position.lng():m.position.lng}));
  check('Editing moves the real Google marker',point.lat===5.36&&point.lng===100.31);
  await p.reload();await p.waitForFunction(()=>document.querySelector('#map-status').textContent.startsWith('Google Maps ·'),null,{timeout:35000});
  check('Saved location reappears on real Google after refresh',await p.locator('gmp-advanced-marker').count()===4);
  await p.locator(`[data-site="CS-${id}"]`).first().click();
  await p.waitForFunction(id=>{
    const marker=document.querySelector(`gmp-advanced-marker[data-site="CS-${id}"]`),panel=document.querySelector('#map-detail'),map=document.querySelector('#google-construction-map');
    const m=marker.getBoundingClientRect(),d=panel.getBoundingClientRect(),r=map.getBoundingClientRect();
    return m.width>0&&m.top>=r.top&&m.bottom<=d.top&&m.left>=r.left&&m.right<=r.right;
  },id,{timeout:10000});
  check('Real selected marker remains visible above the source panel',true);
  await p.locator('.mc-map-workspace').screenshot({path:path.join(out,'google-added-location-live.png')});
  check('Real Google scenario has no unhandled script errors',errors.length===0);
  const result={testedAt:new Date().toISOString(),mode:'Real Google Maps API / local HTTP / isolated browser context',passed:checks.length,checks,errors};
  fs.writeFileSync(path.join(out,'google-live-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }catch(e){const result={testedAt:new Date().toISOString(),checks,errors,failure:sanitize(e.message)};fs.writeFileSync(path.join(out,'google-live-failure.json'),JSON.stringify(result,null,2));console.error(JSON.stringify(result));process.exitCode=1;}
 finally{await browser.close();server.close();}
})().catch(e=>{console.error(sanitize(e.message));server.close();process.exitCode=1;});
