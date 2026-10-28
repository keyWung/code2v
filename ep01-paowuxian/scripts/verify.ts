import fs from 'node:fs';
import path from 'node:path';
import episode from '../episodes/ep01-paowuxian.json';
import {cases, flightTime, maxHeight, position, range, velocity} from '../src/physics';
import {chapters, FREEZE_FROM, shots, STAMP_DOCK, STAMP_HOLD, TOTAL_FRAMES} from '../src/timeline';

// 制作包第二节表格，独立于 JSON 再对一遍
const TABLE: Record<number, {t: string; h: number; r: string; display: string}> = {
  30: {t: '2.00', h: 5, r: '34.64', display: '34.6 米'},
  45: {t: '2.83', h: 10, r: '40.00', display: '40 米'},
  60: {t: '3.46', h: 15, r: '34.64', display: '34.6 米'},
};

let failed = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) failed++;
};

for (const c of cases) {
  const d = c.angle_deg;
  const T = flightTime(d);
  const {vx, vy} = velocity(d, 0);
  const row = TABLE[d];
  check(
    T.toFixed(2) === row.t && c.flight_time_s.toFixed(2) === row.t,
    `${d}° 飞行时间 公式 ${T.toFixed(3)} s / JSON ${c.flight_time_s} / 表 ${row.t}`,
  );
  check(
    Math.abs(maxHeight(d) - row.h) < 1e-9 && c.max_height_m === row.h,
    `${d}° 最高点 公式 ${maxHeight(d).toFixed(3)} m / JSON ${c.max_height_m} / 表 ${row.h}`,
  );
  check(
    range(d).toFixed(2) === row.r && c.range_m.toFixed(2) === row.r && c.range_display === row.display,
    `${d}° 射程 公式 ${range(d).toFixed(3)} m / JSON ${c.range_m}「${c.range_display}」/ 表 ${row.r}`,
  );
  check(
    vx.toFixed(2) === c.vx_m_per_s.toFixed(2) && vy.toFixed(2) === c.vy_m_per_s.toFixed(2),
    `${d}° 初速度分量 vx=${vx.toFixed(2)} vy=${vy.toFixed(2)}`,
  );
  check(Math.abs(position(d, T).y) < 1e-9, `${d}° 轨迹在 t=T 时回到地面`);
}
check(range(30).toFixed(6) === range(60).toFixed(6), '30° 与 60° 射程相等');
check(range(45) > range(30) && range(45) > range(60), '45° 射程最远');

check(shots[0].from === 0 && shots[shots.length - 1].to === TOTAL_FRAMES, `分镜覆盖 0-${TOTAL_FRAMES} 帧`);
check(
  shots.every((s, i) => i === 0 || s.from === shots[i - 1].to),
  '6 镜首尾相接无空档',
);
check(TOTAL_FRAMES === episode.format.duration_seconds * episode.format.fps, '总帧数 = 52 秒 × 30fps');
check(FREEZE_FROM === 1410, `冻结起点 ${FREEZE_FROM} 帧（47 秒）`);
for (const c of chapters) {
  check(
    c.stampAt + STAMP_HOLD + STAMP_DOCK < Math.min(c.end, FREEZE_FROM + 1),
    `章 ${c.id} 盖章「${c.stamp}」在 ${c.stampAt} 帧落下，${c.stampAt + STAMP_HOLD + STAMP_DOCK} 帧停靠完成（章末 ${c.end}）`,
  );
}

const root = path.resolve(import.meta.dirname, '..');
const walk = (dir: string): string[] =>
  fs.readdirSync(dir, {withFileTypes: true}).flatMap((e) => {
    if (e.name === 'node_modules' || e.name.startsWith('.')) return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
const files = walk(root);
const episodeJsons = files.filter(
  (p) => p.endsWith('.json') && !['package.json', 'package-lock.json', 'tsconfig.json'].includes(path.basename(p)),
);
check(
  episodeJsons.length === 1 && episodeJsons[0].includes(`${path.sep}episodes${path.sep}`),
  `项目内只有一份分集 JSON：${episodeJsons.map((p) => path.relative(root, p)).join(', ')}`,
);
check(!('palette' in episode), 'JSON 里没有 palette');
const hardcoded = files
  .filter((p) => p.includes(`${path.sep}src${path.sep}`) && /\.tsx?$/.test(p) && !p.endsWith('theme.ts'))
  .filter((p) => /#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(fs.readFileSync(p, 'utf8')))
  .map((p) => path.relative(root, p));
check(hardcoded.length === 0, `颜色只出现在 theme.ts${hardcoded.length ? '，违规：' + hardcoded.join(', ') : ''}`);

if (failed) {
  console.error(`\n${failed} 项未通过`);
  process.exit(1);
}
console.log('\n全部通过');
