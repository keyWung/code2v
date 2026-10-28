// 一次打包，渲染多张关键帧：npx tsx scripts/stills.ts [--safe] [帧号...]
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const args = process.argv.slice(2);
const debugSafe = args.includes('--safe');
const frames = args.filter((a) => /^\d+$/.test(a)).map(Number);
const list = frames.length ? frames : [0, 120, 300, 380, 400, 600, 760, 1000, 1080, 1130, 1260, 1400, 1410, 1559];

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'out', debugSafe ? 'frames-safe' : 'frames');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const inputProps = {voice: false, debugSafe};
const composition = await selectComposition({serveUrl, id: 'EP01', inputProps});

for (const frame of list) {
  const output = path.join(outDir, `f${String(frame).padStart(4, '0')}.png`);
  await renderStill({composition, serveUrl, frame, output, inputProps, imageFormat: 'png'});
  console.log(output);
}
