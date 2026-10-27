const fs = require('node:fs');
const path = require('node:path');
const sharp = require('C:/Users/Hankin Li/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir = path.resolve(__dirname, '../diagrams');
(async () => {
  for (const name of ['Sequence_Submission', 'Sequence_Review_Tracking']) {
    const svg = fs.readFileSync(path.join(dir, name + '.svg'));
    const info = await sharp(svg, {density:192}).png().toFile(path.join(dir, name + '.png'));
    console.log(JSON.stringify({name,width:info.width,height:info.height}));
  }
})().catch(error => {console.error(error);process.exitCode=1;});
