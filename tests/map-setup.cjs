/* Windows first-run configuration must never replace a user's existing key. */
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
if(process.platform!=='win32'){console.log('Windows launcher checks skipped on this platform.');process.exit(0);}
const root=path.resolve(__dirname,'..');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'mutiara-map-setup-'));
const run=()=>execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"& '.\\打开网站.cmd' --prepare-only; exit $LASTEXITCODE"],{cwd:temporary,stdio:'pipe'});
try{
 fs.mkdirSync(path.join(temporary,'js'));
 fs.copyFileSync(path.join(root,'打开网站.cmd'),path.join(temporary,'打开网站.cmd'));
 const example=fs.readFileSync(path.join(root,'js/google-map-config.example.js'));
 fs.writeFileSync(path.join(temporary,'js/google-map-config.example.js'),example);
 run();assert.deepEqual(fs.readFileSync(path.join(temporary,'js/google-map-config.js')),example);
 const existing=Buffer.from("window.MutiaraConnectGoogleMapConfig={apiKey:'preserve-this-local-value',preferGoogle:true};\n");
 fs.writeFileSync(path.join(temporary,'js/google-map-config.js'),existing);
 run();assert.deepEqual(fs.readFileSync(path.join(temporary,'js/google-map-config.js')),existing);
 console.log(JSON.stringify({checks:[{label:'First run prepares a blank local configuration',result:'PASS'},{label:'Later runs preserve an existing configured file exactly',result:'PASS'}]}));
}finally{
 if(path.dirname(path.resolve(temporary))!==path.resolve(os.tmpdir())||!path.basename(temporary).startsWith('mutiara-map-setup-'))throw Error('Unexpected cleanup path');
 fs.rmSync(temporary,{recursive:true,force:true});
}
