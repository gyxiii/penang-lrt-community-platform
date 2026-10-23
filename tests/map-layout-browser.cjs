/* Regression checks for the map viewport after resize, zoom and panning. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const out=process.env.MAP_LAYOUT_OUTPUT||path.join(root,'docs/member2/map-layout-qa');
const diagnostic=process.env.MAP_LAYOUT_DIAGNOSTIC==='1';
const checks=[];
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{
  const target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(target,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream'});res.end(error?'Not found':data);});
});
function check(label,condition,details){
  checks.push({label,result:condition?'PASS':'FAIL',details});
  if(!diagnostic)assert.ok(condition,label+': '+JSON.stringify(details));
}
async function geometry(page){
  return page.evaluate(()=>{
    const map=document.querySelector('#construction-map');
    const r=map.getBoundingClientRect();
    const rect=e=>{const b=e.getBoundingClientRect();return {left:b.left-r.left,top:b.top-r.top,right:b.right-r.left,bottom:b.bottom-r.top,width:b.width,height:b.height};};
    const pins=[...document.querySelectorAll('.mc-map-pin')].map(e=>({name:e.getAttribute('aria-label'),...rect(e)}));
    const detail=document.querySelector('#map-detail');
    return {width:r.width,height:r.height,pins,image:rect(document.querySelector('.leaflet-image-layer')),detail:detail.hidden?null:rect(detail),overflow:document.documentElement.scrollWidth>innerWidth};
  });
}
function allVisible(g){return g.pins.length>0&&g.pins.every(p=>p.left>=-1&&p.right<=g.width+1&&p.top>=0&&p.bottom<=g.height-10);}
async function settle(page){await page.waitForTimeout(250);await page.locator('.leaflet-image-layer').evaluate(i=>i.decode());}
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  const errors=[];
  try{
    const page=await browser.newPage({viewport:{width:1545,height:1000},deviceScaleFactor:1.25});
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/map.html');await settle(page);
    let g=await geometry(page);check('Initial screenshot-sized viewport contains every construction marker',allVisible(g),g);
    await page.locator('.mc-map-workspace').screenshot({path:path.join(out,'initial.png')});
    for(const [width,height] of [[1100,900],[1931,1052],[1280,900],[390,844],[1440,1100]]){
      await page.setViewportSize({width,height});await settle(page);g=await geometry(page);
      check(`All markers remain visible after resize to ${width}x${height}`,allVisible(g)&&!g.overflow,g);
    }
    const zoomOut=page.getByRole('button',{name:'Zoom out',exact:true});
    for(let i=0;i<8&&await zoomOut.isEnabled();i++){await zoomOut.click();await settle(page);}
    await settle(page);g=await geometry(page);
    check('Zoom out stops before the local map becomes a tiny image',g.image.width>=Math.min(g.width,g.height)*.7&&g.image.height>=Math.min(g.width,g.height)*.7,g);
    await page.locator('#map-fit').click();await settle(page);
    const map=page.locator('#construction-map');await map.scrollIntoViewIfNeeded();
    const box=await map.boundingBox();
    await page.mouse.move(box.x+box.width*.5,box.y+box.height*.45);
    await page.mouse.down();await page.mouse.move(box.x+box.width*.9,box.y+box.height*.12,{steps:16});await page.mouse.up();await settle(page);
    await map.screenshot({path:path.join(out,'after-pan.png')});
    g=await geometry(page);check('A large drag keeps at least one complete construction marker in view',g.pins.some(p=>p.left>=0&&p.right<=g.width&&p.top>=0&&p.bottom<=g.height),g);
    await page.locator('#map-fit').click();await settle(page);g=await geometry(page);
    check('Fit restores every construction marker',allVisible(g),g);
    await page.locator('#map-fit').click();await settle(page);
    await page.locator('.mc-map-workspace').screenshot({path:path.join(out,'fit.png')});
    await page.locator('.mc-map-card[data-site="CS-GT-01"]').click();await settle(page);
    for(const [width,height] of [[1931,1052],[1100,900],[390,844],[1440,1100]]){
      await page.setViewportSize({width,height});await settle(page);g=await geometry(page);
      const selected=await page.locator('.mc-map-pin.selected').evaluate(e=>{const r=e.getBoundingClientRect(),m=document.querySelector('#construction-map').getBoundingClientRect(),d=document.querySelector('#map-detail').getBoundingClientRect();return r.left>=m.left&&r.right<=m.right&&r.top>=m.top&&r.bottom<=m.bottom&&(r.bottom<=d.top||r.top>=d.bottom||r.right<=d.left||r.left>=d.right);});
      check(`Selected marker stays visible above its notice after resize to ${width}x${height}`,selected&&!g.overflow,g);
    }
    await page.locator('#map-fit').click();await settle(page);g=await geometry(page);
    check('Show all locations closes the notice and restores all three markers',await page.locator('#map-detail').isHidden()&&allVisible(g),g);
    await page.locator('.mc-map-card[data-site="CS-GT-01"]').click();await settle(page);
    await page.locator('#map-close-detail').click();await page.locator('#map-fit').click();await settle(page);
    check('No JavaScript exceptions in map layout scenarios',errors.length===0,errors);
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({testedAt:new Date().toISOString(),checks,errors},null,2));
    console.log(JSON.stringify({checks:checks.map(({label,result})=>({label,result})),errors},null,2));
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
