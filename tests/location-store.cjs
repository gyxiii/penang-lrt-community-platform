/* Pure storage and import validation. No browser or remote map requests. */
const assert=require('node:assert/strict');
const api=require('../js/location-store.js');
const checks=[];
const check=(name,fn)=>{fn();checks.push({name,result:'PASS'});};
function memory(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};}
const input={name:'Test work area',areaLabel:'Gelugor',latitude:5.356,longitude:100.303,title:'Example notice',type:'Road access',startDate:'2026-11-01',endDate:'2026-11-03',impact:'Illustrative impact',access:'Follow signs',sourceKind:'example',sourceTitle:'',sourceUrl:'',sourceDate:'',coordinateMethod:'manual'};
const storage=memory(),store=api.createStore(storage);
let first;
check('Create a local record with stable references',()=>{first=store.save(input);assert.match(first.id,/^LOCAL-[A-Z0-9]{12}$/);assert.equal(store.read().length,1);assert.equal(api.toNotice(first).id,'MC-'+first.id);assert.equal(api.toSite(first).area,'gelugor');});
check('Edits preserve identity and creation date',()=>{const edited=store.save({...input,name:'Edited',latitude:5.36},first.id);assert.equal(edited.id,first.id);assert.equal(edited.createdAt,first.createdAt);assert.equal(store.read().length,1);});
check('Saved records survive a new store instance',()=>assert.equal(api.createStore(storage).read()[0].name,'Edited'));
for(const [label,patch] of [
 ['empty coordinates',{latitude:''}],['invalid coordinates',{longitude:'NaN'}],['out of coverage',{latitude:8}],
 ['end before start',{endDate:'2026-10-01'}],['nonexistent date',{startDate:'2026-02-30'}],['empty title',{title:' '}],
 ['missing source citation',{sourceKind:'notice-reference'}],['script source URL',{sourceUrl:'javascript:alert(1)'}],
 ['credential source URL',{sourceUrl:'https://secret:password@example.org/'}],['key in source URL',{sourceUrl:'https://example.org/?apiKey=secret'}]
])check('Reject '+label+' atomically',()=>{const before=store.exportData();assert.throws(()=>store.save({...input,...patch}));assert.equal(store.exportData(),before);});
check('Source metadata and Chinese text are preserved',()=>{const r=store.save({...input,name:'施工区域',sourceKind:'notice-reference',sourceTitle:'Published notice',sourceUrl:'https://example.org/notice',sourceDate:'2026-10-28'});assert.equal(r.sourceUrl,'https://example.org/notice');assert.equal(api.toNotice(r).sourceKind,'notice-reference');});
check('Export excludes other storage namespaces and map credentials',()=>{storage.setItem('mutiaraconnect.feedback.v1','private feedback');storage.setItem('apiKey','private key');assert.ok(!store.exportData().includes('private'));});
const second=api.createStore(memory());
check('Import restores entries and skips existing IDs',()=>{assert.equal(second.importData(store.exportData()).added,2);assert.equal(second.importData(store.exportData()).skipped,2);assert.equal(second.read().length,2);});
check('Malformed imports do not overwrite valid entries',()=>{const before=second.exportData();for(const bad of ['broken','null','{"version":2,"records":[]}',JSON.stringify({version:1,records:[...second.read(),{bad:true}]})])assert.throws(()=>second.importData(bad));assert.equal(second.exportData(),before);});
check('Duplicate references in import are rejected',()=>assert.throws(()=>second.importData(JSON.stringify({version:1,records:[first,first]}))));
check('Storage quota failure is explicit and atomic',()=>{const broken=api.createStore({getItem:storage.getItem,setItem(){throw Error('quota');}});assert.throws(()=>broken.save(input),/Nothing was changed/);assert.equal(store.read().length,2);});
check('Blocked and corrupted storage cannot silently erase records',()=>{assert.throws(()=>api.createStore().save(input),/unavailable/);assert.throws(()=>api.createStore({getItem:()=>'{bad'}).read(),/could not be read/);});
check('HTTP navigation uses ordinary links',()=>assert.equal(store.href('map.html?notice=x',first),'map.html?notice=x'));
check('Local-file navigation carries only the selected record',()=>{const local=api.createStore(memory(),{protocol:'file:',hash:''});const href=local.href('map.html?notice=MC-'+first.id,first);assert.ok(href.includes('#local-location='));const receiver=api.createStore(memory(),{protocol:'file:',hash:href.slice(href.indexOf('#'))});assert.equal(receiver.read()[0].id,first.id);});
check('Unsafe linked records are rejected',()=>{const receiver=api.createStore(memory(),{protocol:'file:',hash:'#'+new URLSearchParams({'local-location':JSON.stringify({...first,sourceUrl:'javascript:alert(1)'})})});assert.equal(receiver.read().length,0);});
check('Delete removes only the chosen local record',()=>{second.remove(first.id);assert.equal(second.read().length,1);assert.throws(()=>second.remove('CS-GT-01'));});
console.log(JSON.stringify({passed:checks.length,checks}));
