import fs from 'node:fs';
import path from 'node:path';
import {subtitleLines} from '../src/subtitles';
import {FPS, shots} from '../src/timeline';

const stamp = (frame: number) => {
  const ms = Math.round((frame / FPS) * 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

const srt = shots
  .map((s, i) =>
    [i + 1, `${stamp(s.from)} --> ${stamp(s.to)}`, ...subtitleLines(s).map((l) => l.text), ''].join('\n'),
  )
  .join('\n');

const out = path.resolve(import.meta.dirname, '../out/EP03-字幕.srt');
fs.writeFileSync(out, srt);
console.log(out);
