// 一次打包，渲染多张关键帧：npx tsx scripts/stills.ts [--safe] [帧号...]
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const args = process.argv.slice(2);
const debugSafe = args.includes('--safe');
const frames = args.filter((a) => /^\d+$/.test(a)).map(Number);
const list = frames.length
  ? frames
  : [20, 60, 100, 135, 170, 230, 280, 330, 350, 410, 440, 470, 510, 560, 640, 790, 830, 880, 960, 1000, 1030, 1075, 1130, 1160, 1200, 1250, 1290, 1360, 1420, 1460, 1500, 1560, 1640, 1650];

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'out', debugSafe ? 'frames-safe' : 'frames');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const inputProps = {voice: false, debugSafe};
const composition = await selectComposition({serveUrl, id: 'EP07', inputProps});

for (const frame of list) {
  const output = path.join(outDir, `f${String(frame).padStart(4, '0')}.png`);
  await renderStill({composition, serveUrl, frame, output, inputProps, imageFormat: 'png'});
  console.log(output);
}
