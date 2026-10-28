import fs from 'node:fs';
import path from 'node:path';
import episode from '../episodes/ep04-guangzheshe.json';
import {chapterStatus} from '../src/components/ChapterHeader';
import {PIVOT_Y, PX_PER_M, SAFE, ZONE} from '../src/layout';
import {cases, CODE, DRAW_GAIN, g, omega, period, SMALL_ANGLE_DEG, theta, THETA0_DEG, THETA0_SMALL_DEG} from '../src/physics';
import {stampWidth} from '../src/stampText';
import {subtitleLines, subtitleNote} from '../src/subtitles';
import {chapters, FREEZE_FROM, shots, STAMP_DOCK, STAMP_HOLD, stamps, TOTAL_FRAMES} from '../src/timeline';
import {theme} from '../src/theme';

let failed = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) failed++;
};
const root = path.resolve(import.meta.dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

// ---------- 三组数字：规划包第二节表格，独立于 JSON 再对一遍
const TABLE: Record<number, {t: string; display: string}> = {
  0.25: {t: '0.99', display: '约 1 秒'},
  1: {t: '1.99', display: '约 2 秒'},
  4: {t: '3.97', display: '约 4 秒'},
};
check(g === 10, `g 取 ${g}`);
for (const c of cases) {
  const T = period(c.length_m);
  const row = TABLE[c.length_m];
  check(
    T.toFixed(2) === row.t && c.period_s.toFixed(2) === row.t && c.display_period === row.display && c.display_period === `约 ${Math.round(T)} 秒`,
    `${c.length_m} 米 周期 公式 ${T.toFixed(3)} s / JSON ${c.period_s}「${c.display_period}」/ 表 ${row.t}`,
  );
  check(Math.abs(theta(THETA0_DEG, c.length_m, T) - THETA0_DEG) < 1e-9, `${c.length_m} 米 θ(T) 回到 θ0：一个周期由 θ0·cos(ωt) 算出`);
  check(Math.abs(theta(THETA0_DEG, c.length_m, T / 2) + THETA0_DEG) < 1e-9, `${c.length_m} 米 θ(T/2) = −θ0`);
}
check(Math.abs(period(4) / period(1) - 2) < 1e-12 && Math.abs(period(1) / period(0.25) - 2) < 1e-12, '摆长 ×4，周期 ×2（平方根关系）');
check(
  CODE[0] === 'const omega = Math.sqrt(g / L);' && CODE[1] === 'const theta = theta0 * Math.cos(omega * t);' && Math.abs(omega(1) - Math.sqrt(g)) < 1e-12,
  '摆动代码与 JSON 两行一致：ω = √(g/L)，θ = θ0·cos(ωt)',
);
const ep03 = read('src/EP03.tsx');
check(!/Math\.(sin|cos)\(/.test(ep03) && /theta\(/.test(ep03), '画面里的摆角都调用 theta()，没有另外手写摇摆');

// ---------- 小角度条件
check(THETA0_DEG < SMALL_ANGLE_DEG && THETA0_SMALL_DEG < SMALL_ANGLE_DEG, `用到的摆角 ${THETA0_SMALL_DEG}°、${THETA0_DEG}° 都小于 ${SMALL_ANGLE_DEG}°`);
check(/大角度不适用本期公式/.test(ep03), '全片常驻“摆角 < 5° · 大角度不适用本期公式”');
check(/角度画大/.test(ep03) && DRAW_GAIN > 1, `画面角度放大 ${DRAW_GAIN} 倍，并在画面上写明`);
const n2 = subtitleNote(shots[1])?.text ?? '';
const n4 = subtitleNote(shots[3])?.text ?? '';
check(n2.includes(`小于 ${SMALL_ANGLE_DEG}°`) && n2.includes('大角度不适用'), `镜 2 小注：${n2}`);
check(n4.includes(`< ${SMALL_ANGLE_DEG}°`) && n4.includes('大角度不适用'), `镜 4 质量、振幅结论带条件：${n4}`);
check(/摆角 &lt; \{SMALL_ANGLE_DEG\}° 时，周期/.test(ep03), '镜 4 运行输出写明“摆角 < 5° 时”');
check(/×4/.test(read('src/components/Comparison.tsx')) && /×2/.test(read('src/components/Comparison.tsx')), '镜 5 标出 ×4 → ×2');

// ---------- 分镜、冻结、章节、盖章
check(shots.length === 6 && shots[0].from === 0 && shots[shots.length - 1].to === TOTAL_FRAMES, `6 镜覆盖 0-${TOTAL_FRAMES} 帧`);
check(
  shots.every((s, i) => i === 0 || s.from === shots[i - 1].to),
  '6 镜首尾相接无空档',
);
check(TOTAL_FRAMES === episode.format.duration_seconds * episode.format.fps, '总帧数 = 60 秒 × 30fps');
check(FREEZE_FROM === 1650, `冻结起点 ${FREEZE_FROM} 帧（55 秒）`);
const expected = episode.chapters.flatMap((c) => c.stamps ?? [c.stamp]);
check(stamps.length === expected.length && stamps.every((s, i) => s.text === expected[i]), `盖章文字与 JSON 一致：${stamps.map((s) => s.text).join(' / ')}`);
for (const s of stamps) {
  const shot = shots[s.shot - 1];
  const docked = s.hitAt + STAMP_HOLD + STAMP_DOCK;
  check(s.hitAt >= shot.from && docked < shot.to, `「${s.text}」在镜 ${s.shot} 末尾 ${s.hitAt} 帧落下一次，${docked} 帧停靠完成（镜末 ${shot.to}）`);
}
const boxes = stamps.map((s) => ({l: s.dock.x - (stampWidth(s.text) * s.dock.scale) / 2, r: s.dock.x + (stampWidth(s.text) * s.dock.scale) / 2}));
check(
  boxes.every((b, i) => i === 0 || b.l > boxes[i - 1].r) && boxes[0].l > ZONE.header.left - 10 && boxes[boxes.length - 1].r < SAFE.railX,
  '顶部四枚停靠的盖章互不重叠',
);
const statusAt = (f: number) => chapters.map((_, i) => chapterStatus(f, i)).join(',');
for (const s of shots) {
  const mid = Math.floor((s.from + s.to) / 2);
  const idx = chapters.findIndex((c) => c.id === s.chapter);
  const want = chapters
    .map((_, i) => (s.chapter === null ? (s.shot === 1 ? 'locked' : 'done') : i < idx ? 'done' : i === idx ? 'current' : 'locked'))
    .join(',');
  check(statusAt(mid) === want, `镜 ${s.shot} 中段章节进度 ${statusAt(mid)}`);
}
check(statusAt(FREEZE_FROM) === 'done,done,done', '冻结段 01/02/03 全部打勾');
check(subtitleLines(shots[4]).some((l) => l.text.includes('√(L/g)')), `镜 5 字幕公式不被拆开：${subtitleLines(shots[4]).map((l) => l.text).join(' | ')}`);
check(subtitleLines(shots[5]).length === 2, `镜 6 字幕分两行：${subtitleLines(shots[5]).map((l) => l.text).join(' | ')}`);

// ---------- 版式：摆球、计时器、字幕不压遮挡区
const rad = (d: number) => (d * Math.PI) / 180;
const rig = [
  {name: '镜 2 单摆', x: 320, L: 1, th: THETA0_DEG, r: 26},
  {name: '镜 3 长摆', x: 290, L: 1, th: THETA0_DEG, r: 26},
  {name: '镜 3 短摆', x: 690, L: 0.25, th: THETA0_DEG, r: 22},
  {name: '镜 4 最右摆', x: 770, L: 1, th: THETA0_DEG, r: 22},
  {name: '镜 5 单摆', x: 170, L: 1, th: THETA0_DEG, r: 26},
];
for (const p of rig) {
  const a = rad(p.th * DRAW_GAIN);
  const right = p.x + p.L * PX_PER_M * Math.sin(a) + p.r * 1.9;
  const bottom = PIVOT_Y + p.L * PX_PER_M + p.r * 1.9;
  const inRail = right >= SAFE.railX && bottom >= SAFE.railFromY;
  check(!inRail && bottom < ZONE.panel.top, `${p.name} 摆到最右 x=${right.toFixed(0)}、最低 y=${bottom.toFixed(0)}，不进遮挡区、不压面板`);
}
const {subtitle, panel} = ZONE;
check(subtitle.left + subtitle.width <= SAFE.railX && subtitle.top + subtitle.height <= SAFE.bottomY, '字幕区在遮挡区外');
check(panel.left + panel.width <= SAFE.railX, '代码 / 运行输出 / 公式面板在遮挡区外');
check(/top=\{470\}/.test(ep03) && 470 + 80 < SAFE.railFromY, '计时器在右上，不进右侧互动区');

// ---------- 配色、数据来源
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
  .filter((p) => /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(fs.readFileSync(p, 'utf8')))
  .map((p) => path.relative(root, p));
check(hardcoded.length === 0, `颜色只出现在 theme.ts${hardcoded.length ? '，违规：' + hardcoded.join(', ') : ''}`);
const ep01Theme = path.resolve(root, '../ep01-paowuxian/src/theme.ts');
if (fs.existsSync(ep01Theme)) {
  const ep01 = (await import(ep01Theme)).theme as Record<string, string>;
  check(JSON.stringify(ep01) === JSON.stringify(theme), '色值与 EP01 的 theme.ts 完全一致');
} else {
  console.log('- 未找到 EP01 的 theme.ts，跳过色值比对');
}

if (failed) {
  console.error(`\n${failed} 项未通过`);
  process.exit(1);
}
console.log('\n全部通过');
