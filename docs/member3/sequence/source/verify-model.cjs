const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {webcrypto} = require('node:crypto');
const root = path.resolve(__dirname,'..');
const repo = path.resolve(root,'../../..');
const data = new Map(), trace = [], checks = [];
let blockWrites = false;
const context = {crypto:webcrypto, console,
  localStorage:{getItem(key){trace.push('read');return data.get(key) ?? null;},setItem(key,value){trace.push('write');if(blockWrites)throw Error('blocked');data.set(key,value);}},
  window:{dispatchEvent(event){trace.push(event.type);}},CustomEvent:class{constructor(type){this.type=type;}}
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(repo,'js/feedback-store.js'),'utf8'),context);
const api=context.window.MutiaraConnectFeedback;
const check=(name,fn)=>{fn();checks.push({name,result:'PASS'});};
const input={title:'Sample sequence access concern',category:'Pedestrian access',area:'gelugor',location:'Sample walkway next to the boundary',description:'This fictional case checks the sequence for saving a concern and retrieving its status and response.'};
let report;
check('Validation rejects bad input before any storage access',()=>{trace.length=0;assert.throws(()=>api.submit({...input,title:''}));assert.equal(trace.length,0);});
check('Submission reads local records and writes before returning success',()=>{trace.length=0;report=api.submit(input);trace.push('returned');assert.deepEqual(trace,['read','write','mutiaraconnect:feedback-changed','returned']);});
check('The initial reference, status and history agree with M3A',()=>{assert.match(report.id,/^MC-FB-[A-Z0-9]+$/);assert.equal(report.status,'Submitted');assert.equal(report.history.length,1);assert.equal(report.history[0].status,'Submitted');});
check('The saved reference retrieves the same record',()=>{assert.equal(api.find(report.id).title,input.title);});
check('A blocked write throws instead of returning a successful report',()=>{const before=data.get(api.STORAGE_KEY);blockWrites=true;assert.throws(()=>api.submit(input),/has not been submitted/);assert.equal(data.get(api.STORAGE_KEY),before);blockWrites=false;});
check('Staff updates append a dated In Progress history entry',()=>{const updated=api.updateStatus(report.id,'In Progress','Sample review is in progress.');assert.equal(updated.status,'In Progress');assert.equal(updated.history.length,2);assert.ok(Number.isFinite(Date.parse(updated.history[1].at)));});
check('A response keeps the reference and earlier history',()=>{const updated=api.updateStatus(report.id,'Responded','Sample response with proposed access guidance.');assert.equal(updated.id,report.id);assert.equal(updated.history.length,3);assert.equal(updated.history[0].status,'Submitted');assert.equal(updated.status,'Responded');});
check('Public lookup returns the latest response stored by the model',()=>{assert.equal(api.find(report.id).history.at(-1).note,'Sample response with proposed access guidance.');});
check('Unknown references return null rather than another record',()=>{assert.equal(api.find('MC-FB-NOTFOUND'),null);});
check('Invalid staff status or an empty note cannot change saved data',()=>{const before=data.get(api.STORAGE_KEY);assert.throws(()=>api.updateStatus(report.id,'Closed','note'));assert.throws(()=>api.updateStatus(report.id,'Responded',''));assert.equal(data.get(api.STORAGE_KEY),before);});
check('Built-in samples remain available through the shared lookup',()=>{assert.equal(api.find('MC-FB-DEMO-003').status,'Responded');});
check('The formal staff page remains an external integration dependency',()=>{assert.equal(fs.existsSync(path.join(repo,'admin.html')),false);});
fs.writeFileSync(path.join(root,'source/model-verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),checks,source:'js/feedback-store.js',network:'No network or server used'},null,2));
console.log(JSON.stringify({modelChecksPassed:checks.length}));
