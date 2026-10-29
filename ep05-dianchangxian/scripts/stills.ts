// 一次打包，渲染多张关键帧：npx tsx scripts/stills.ts [--safe] [帧号...]
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const args = process.argv.slice(2);
const debugSafe = args.includes('--safe');
const frames = args.filter((a) => /^\d+$/.test(a)).map(Number);
const list = frames.length
  ? frames
  : [20, 70, 110, 200, 230, 330, 350, 380, 415, 500, 560, 650, 700, 790, 850, 930, 1020, 1070, 1130, 1200, 1290, 1360, 1450, 1540, 1570, 1620, 1650];

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'out', debugSafe ? 'frames-safe' : 'frames');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const inputProps = {voice: false, debugSafe};
const composition = await selectComposition({serveUrl, id: 'EP05', inputProps});

for (const frame of list) {
  const output = path.join(outDir, `f${String(frame).padStart(4, '0')}.png`);
  await renderStill({composition, serveUrl, frame, output, inputProps, imageFormat: 'png'});
  console.log(output);
}
