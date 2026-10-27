const {chromium}=require('C:/Users/Hankin Li/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const results=[];
  try{
    const page=await browser.newPage();
    for(const file of ['Sequence_Submission.svg','Sequence_Review_Tracking.svg']){
      await page.goto(pathToFileURL(path.join(root,'diagrams',file)).href);
      const result=await page.evaluate(()=>{
        const v=document.documentElement.viewBox.baseVal;
        const texts=[...document.querySelectorAll('text')].map(e=>{const b=e.getBBox();return{text:e.textContent,x:b.x,y:b.y,w:b.width,h:b.height};});
        const outside=texts.filter(b=>b.x<0||b.y<0||b.x+b.w>v.width||b.y+b.h>v.height);
        const overlaps=[];
        for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
          const a=texts[i],b=texts[j];
          if(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>2&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>2)overlaps.push([a.text,b.text]);
        }
        return{width:v.width,height:v.height,textCount:texts.length,outside,overlaps};
      });
      assert.deepEqual(result.outside,[],file+' clipped text');
      assert.deepEqual(result.overlaps,[],file+' overlapping text');
      results.push({file,...result});
    }
    fs.writeFileSync(path.join(root,'source/svg-verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),renderer:'Microsoft Edge',results},null,2));
    console.log(JSON.stringify({diagramsChecked:results.length,textItems:results.reduce((n,r)=>n+r.textCount,0),clipped:0,overlaps:0}));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
