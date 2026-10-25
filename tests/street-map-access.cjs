/* In-memory unit checks; no requests are made to OSM or to a browser. */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../js/street-map-access.js'),'utf8');
const checks=[];
function check(label,condition){assert.ok(condition,label);checks.push({label,result:'PASS'});}
function session(protocol){
 let replacement;
 const control={id:'map-street',textContent:'Street map ↗',replaceWith(link){replacement=link;}};
 const context={window:{},location:{protocol},URL,document:{createElement(tag){return {tagName:tag.toUpperCase(),attributes:{},setAttribute(name,value){this.attributes[name]=value;}};}}};
 vm.runInNewContext(source,context,{filename:'street-map-access.js'});
 const adapter=context.window.MutiaraConnectStreetMapAccess.configure(control);
 return {adapter,get replacement(){return replacement;}};
}
for(const protocol of ['http:','https:']){
 const s=session(protocol);s.adapter.update({latitude:5.41,longitude:100.33});
 check(`${protocol} preserves the embedded street-map button`,s.adapter.embedded===true&&!s.replacement);
}
const local=session('file:');
check('Local files use a link instead of enabling embedded OSM tiles',local.adapter.embedded===false&&local.replacement.tagName==='A');
check('The external street link preserves its control id and label',local.replacement.id==='map-street'&&local.replacement.textContent==='Street map ↗');
check('The link opens a separate tab with opener access disabled',local.replacement.target==='_blank'&&local.replacement.rel==='noopener');
check('The link announces its separate-tab behavior',local.replacement.attributes['aria-label']==='Open street map in a new tab');
check('The default destination is the official OSM website',new URL(local.replacement.href).origin==='https://www.openstreetmap.org');
local.adapter.update({latitude:5.41,longitude:100.33});
let url=new URL(local.replacement.href);
check('The external view follows the selected illustrative location',url.searchParams.get('mlat')==='5.41'&&url.searchParams.get('mlon')==='100.33'&&url.hash==='#map=14/5.41/100.33');
local.adapter.update();url=new URL(local.replacement.href);
check('Clearing the selection restores the regional view',!url.search&&url.hash==='#map=12/5.36/100.31');
check('External links contain neither local file paths nor Google key parameters',!local.replacement.href.includes('file:')&&!url.searchParams.has('key'));
console.log(JSON.stringify({testedAt:new Date().toISOString(),mode:'In-memory DOM adapter checks; no browser navigation or external tile requests',checks},null,2));
