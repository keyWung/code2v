import fs from 'node:fs';
import path from 'node:path';
import episode from '../episodes/ep07-yuanzhou.json';
import {chapterStatus} from '../src/components/ChapterHeader';
import {CAR, carAt, CONE, CONE_BOB, CONE_GRAVITY, CONE_NET, CONE_TENSION, ROPE, ropeAt, SNAP, SNAP_AT, SNAP_SPEED, snapAt, snapGhosts} from '../src/components/ForceCells';
import {centersAt} from '../src/EP07';
import {BALL_R, BIG_AT, cell, GRID, SAFE, SMALL_AT, STAGE_TALL_BOTTOM, W, ZONE} from '../src/layout';
import {A_PX, accelOf, angleAt, BIG, cases, CODE, FORMULA, omegaOf, orbitAt, periodOf, periodText, PX_PER_M, R_BIG, R_SMALL, SMALL, V, V_PX, type Pt} from '../src/physics';
import {stampWidth} from '../src/stampText';
import {subtitleLines, subtitleNote} from '../src/subtitles';
import {beats, chapters, FPS, FREEZE_FROM, shots, STAMP_DOCK, STAMP_HOLD, stamps, TOTAL_FRAMES} from '../src/timeline';
import {theme} from '../src/theme';

let failed = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) failed++;
};
const root = path.resolve(import.meta.dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');
const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));
const dot = (a: Pt, b: Pt) => a.x * b.x + a.y * b.y;
const crossZ = (a: Pt, b: Pt) => a.x * b.y - a.y * b.x;
const unit = (v: Pt) => ({x: v.x / Math.hypot(v.x, v.y), y: v.y / Math.hypot(v.x, v.y)});
const sub = (a: Pt, b: Pt) => ({x: a.x - b.x, y: a.y - b.y});

// ---------- 两组数字：规划包第二节表格，独立于 JSON 再对一遍
const TABLE = [
  {r: 2, omega: 2, a: 8, T: '约 3.14 秒'},
  {r: 1, omega: 4, a: 16, T: '约 1.57 秒'},
];
check(V === 4 && cases.every((c) => c.v === 4), `两组速度都是 v = ${V} m/s`);
for (const row of TABLE) {
  const c = cases.find((x) => x.r_m === row.r);
  const w = omegaOf(V, row.r);
  const a = accelOf(V, row.r);
  check(
    !!c && w === row.omega && a === row.a && c.omega === w && c.a === a && `${periodText(V, row.r)} 秒` === row.T && c.display_T === row.T,
    `r = ${row.r} m：ω = ${w} rad/s，a = ${a} m/s²，T = ${periodOf(V, row.r).toFixed(4)} s → ${periodText(V, row.r)} 秒 / JSON ω ${c?.omega}、a ${c?.a}「${c?.display_T}」`,
  );
  check(near(a, w * w * row.r) && near(periodOf(V, row.r), (2 * Math.PI) / w), `r = ${row.r} m：a = ω²r = ${w * w * row.r}，T = 2π/ω 也成立`);
}
check(accelOf(V, R_SMALL) / accelOf(V, R_BIG) === 2, '同样速度，半径减半，向心加速度翻倍（8 → 16）');

// ---------- 向心加速度由 JSON 里的代码算出
check(CODE[0] === 'const omega = v / r;' && CODE[1] === 'const a = v * v / r;' && FORMULA === 'a = v² / r = ω²r，F = m·a', `代码与公式与 JSON 一致：${CODE.join(' ')}`);
const jsonCode = new Function('v', 'r', `${CODE.join(' ')} return [omega, a];`) as (v: number, r: number) => [number, number];
const samples = [[4, 2], [4, 1], [3, 0.5], [7.3, 2.6], [1, 10]];
check(samples.every(([v, r]) => jsonCode(v, r)[0] === omegaOf(v, r) && jsonCode(v, r)[1] === accelOf(v, r)), '画面用的 omegaOf()、accelOf() 与 JSON 两行代码逐点完全相同');
const src = ['src/EP07.tsx', 'src/Cover.tsx', 'src/components/ForceCells.tsx', 'src/components/ResultTable.tsx'].map(read).join('\n');
check(
  !/display_T|\bc\.(a|omega)\b|cases\[\d\]\.(a|omega)\b/.test(src) && /accelOf\(V, /.test(read('src/EP07.tsx')) && /\(v \* v\) \/ r/.test(read('src/physics.ts')) && /=> v \/ r/.test(read('src/physics.ts')),
  'ω、a、T 的数字和箭头长度都调用函数现算，没有直接拿 JSON 里的数',
);

// ---------- 运动：每帧转 ω / FPS，转一圈用时 T
for (const o of [BIG, SMALL]) {
  const per = angleAt(o, 1) - angleAt(o, 0);
  check(near(per, omegaOf(o.v, o.r) / FPS) && near((2 * Math.PI) / per / FPS, periodOf(o.v, o.r)), `r = ${o.r} m：每帧转 ${per.toFixed(4)} rad，一圈 ${((2 * Math.PI) / per).toFixed(1)} 帧 = ${periodOf(o.v, o.r).toFixed(2)} s`);
}
const pxSpeed = (o: typeof BIG) => (omegaOf(o.v, o.r) * o.r * PX_PER_M) / FPS;
check(near(pxSpeed(BIG), pxSpeed(SMALL)), `两个圆上物体每帧走的弧长相同（${pxSpeed(BIG).toFixed(2)} 像素/帧）：线速度一样`);

// ---------- 方向：向心箭头指向圆心、与速度垂直；速度沿切线
let dirOk = true;
let tanOk = true;
for (let f = 1; f < shots[4].from; f++) {
  const {bigC, smallC} = centersAt(f);
  for (const [o, c] of [[BIG, bigC], [SMALL, smallC]] as const) {
    const s = orbitAt(o, c, f);
    if (dot(s.inward, unit(sub(c, s.p))) < 1 - 1e-12 || Math.abs(dot(s.inward, s.vel)) > 1e-12) dirOk = false;
    const d = unit(sub(orbitAt(o, c, f + 0.01).p, orbitAt(o, c, f - 0.01).p));
    if (dot(d, s.vel) < 1 - 1e-6) tanOk = false;
  }
}
check(dirOk, '镜 1-4 每一帧：向心箭头方向 = 物体指向圆心（不是切线方向），且与速度垂直');
check(tanOk, '镜 1-4 每一帧：速度箭头沿轨迹切线、和物体实际走的方向一致');
check(
  A_PX * accelOf(V, R_BIG) === 60 && A_PX * accelOf(V, R_SMALL) === 120 && A_PX * accelOf(V, R_SMALL) < R_SMALL * PX_PER_M - BALL_R / 2,
  '向心箭头长度与 a 成正比：8 → 60 像素，16 → 120 像素，且不越过圆心',
);
check(V * V_PX === 120, '两个圆的速度箭头一样长（120 像素）');

// ---------- 镜 5：向心力来源
let cellsOk = true;
for (let f = shots[4].from; f <= FREEZE_FROM; f++) {
  for (const [s, c] of [[carAt(f), CAR.c], [ropeAt(f), ROPE.c]] as const) {
    if (dot(s.inward, unit(sub(c, s.p))) < 1 - 1e-12) cellsOk = false;
  }
}
check(cellsOk, '汽车的摩擦力、绳子的拉力每一帧都指向圆心');
const string = unit(sub(CONE.pivot, CONE_BOB));
check(
  near(CONE_NET.x, CONE_GRAVITY.x + CONE_TENSION.x) && near(CONE_NET.y, CONE_GRAVITY.y + CONE_TENSION.y) && Math.abs(CONE_NET.y) < 1e-9 && CONE_NET.x < 0,
  `圆锥摆：合力 = 重力 + 拉力 = (${CONE_NET.x.toFixed(1)}, ${CONE_NET.y.toFixed(1)})，水平指向转轴`,
);
check(
  Math.abs(crossZ(unit(CONE_TENSION), string)) < 1e-12 && dot(CONE_TENSION, string) > 0 && near(Math.abs(CONE_NET.x), CONE.g * ((CONE_BOB.x - CONE.pivot.x) / (CONE_BOB.y - CONE.pivot.y))),
  '圆锥摆：拉力沿绳指向悬点，合力大小 = mg·tanθ',
);
const after = Array.from({length: FREEZE_FROM - SNAP_AT}, (_, i) => snapAt(SNAP_AT + 1 + i).p);
const rel = snapAt(SNAP_AT);
const before = snapAt(SNAP_AT - 1).p;
check(
  near(rel.p.y, SNAP.c.y + SNAP.r) && near(rel.vel.x, 1) && after.every((p) => near(p.y, rel.p.y)) && after.every((p, i) => near(p.x - (i ? after[i - 1].x : rel.p.x), SNAP_SPEED)),
  `绳断后：沿断开那一刻的切线走直线，每帧 ${SNAP_SPEED.toFixed(2)} 像素，速度不变`,
);
check(Math.abs(Math.hypot(rel.p.x - before.x, rel.p.y - before.y) - SNAP_SPEED) < 0.01, '断开前后速度大小一样（只是不再拐弯）');
const ghosts = snapGhosts(FREEZE_FROM);
check(ghosts.length > 3 && ghosts.every((g, i) => i === 0 || near(g.x - ghosts[i - 1].x, SNAP_SPEED * SNAP.ghostStep)), `频闪残影 ${ghosts.length} 个，间隔相等`);

// ---------- 离心力的说法
const vo = episode.shots.map((s) => s.口播).join('');
const onScreen = [src, read('src/subtitles.ts'), ...episode.shots.map((s) => s.字幕 + s.口播), episode.publish.description].join('\n');
check(!/离心力/.test(onScreen), '口播、字幕、画面、简介里都没有“离心力”');
check(/不是被推出去/.test(vo) && /不是被推出去/.test(read('src/components/ForceCells.tsx')) && /惯性/.test(vo), '口播和第 4 格都写明：按惯性走直线，不是被推出去的');
check(/受力分析只画真实的力/.test(subtitleNote(shots[4])?.text ?? '') && /不是一种/.test(episode.chapters[2].stamp), '向心力不是一种新力：镜 5 小注与盖章都写到');

// ---------- 分镜、冻结、章节、盖章
check(shots.length === 6 && shots[0].from === 0 && shots[shots.length - 1].to === TOTAL_FRAMES, `6 镜覆盖 0-${TOTAL_FRAMES} 帧`);
check(
  shots.map((s) => s.frames).join(',') === '0-150,150-420,420-810,810-1140,1140-1650,1650-1800',
  '分镜帧段与规划一致：0-150、150-420、420-810、810-1140、1140-1650、1650-1800',
);
check(TOTAL_FRAMES === episode.format.duration_seconds * episode.format.fps, '总帧数 = 60 秒 × 30fps');
check(FREEZE_FROM === 1650, `冻结起点 ${FREEZE_FROM} 帧（55 秒）`);
const expected = episode.chapters.map((c) => c.stamp);
check(stamps.length === expected.length && stamps.every((s, i) => s.text === expected[i]), `盖章文字与 JSON 一致：${stamps.map((s) => s.text).join(' / ')}`);
check(stamps.map((s) => s.shot).join(',') === '2,4,5', '盖章分别落在镜 2、镜 4、镜 5');
for (const s of stamps) {
  const shot = shots[s.shot - 1];
  const docked = s.hitAt + STAMP_HOLD + STAMP_DOCK;
  check(s.hitAt >= shot.from && docked < shot.to, `「${s.text}」在镜 ${s.shot} 末尾 ${s.hitAt} 帧落下一次，${docked} 帧停靠完成（镜末 ${shot.to}）`);
}
const boxes = stamps.map((s) => ({l: s.dock.x - (stampWidth(s.text) * s.dock.scale) / 2, r: s.dock.x + (stampWidth(s.text) * s.dock.scale) / 2}));
check(
  boxes.every((b, i) => i === 0 || b.l > boxes[i - 1].r) && boxes[0].l > ZONE.header.left - 10 && boxes[boxes.length - 1].r < SAFE.railX,
  '顶部三枚停靠的盖章互不重叠',
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
check(subtitleLines(shots[2]).length === 1 && subtitleLines(shots[2])[0].text.includes('a = v² / r'), `镜 3 字幕不把公式里的“ / ”当分行：${subtitleLines(shots[2]).map((l) => l.text).join(' | ')}`);
check(subtitleLines(shots[5]).length === 2, `镜 6 字幕分两行：${subtitleLines(shots[5]).map((l) => l.text).join(' | ')}`);
check(
  shots.every((s) => subtitleLines(s).every((l) => l.keywords.every((k) => s.字幕.includes(k)))),
  '每条字幕的高亮关键词都在字幕里',
);

// ---------- 版式：轨道、物体、箭头、字幕不压遮挡区
const inRail = (p: Pt) => p.x >= SAFE.railX && p.y >= SAFE.railFromY;
const bad = new Set<string>();
for (let f = 0; f < shots[4].from; f++) {
  const {bigC, smallC} = centersAt(f);
  const bottom = f < shots[2].from + 24 ? STAGE_TALL_BOTTOM : ZONE.panel.top;
  for (const [name, o, c] of [['大圆', BIG, bigC], ['小圆', SMALL, smallC]] as const) {
    if (name === '小圆' && f >= shots[1].from + 12 && f < shots[3].from) continue;
    const s = orbitAt(o, c, f);
    const R = o.r * PX_PER_M;
    const pts: Pt[] = [
      {x: c.x - R - 17, y: c.y},
      {x: c.x + R + 17, y: c.y},
      {x: c.x, y: c.y - R - 17},
      {x: c.x, y: c.y + R + 17},
    ];
    // 速度箭头和跟着它的标签从镜 1 讲到“油门”时才出现
    if (f >= beats.hook.throttle) pts.push({x: s.p.x + s.vel.x * (V * V_PX + 30), y: s.p.y + s.vel.y * (V * V_PX + 30)}, {x: s.p.x + s.vel.x * V * V_PX, y: s.p.y + s.vel.y * V * V_PX});
    for (const p of pts) {
      if (inRail(p) || p.y >= bottom || p.x > W - 40 || p.x < 30 || p.y < ZONE.chip.top + 40) bad.add(`${name} 第 ${f} 帧`);
    }
  }
}
check(bad.size === 0, `镜 1-4 每一帧的轨道、物体、速度箭头和标签都不进遮挡区、不出画面、不压小标签、代码区和字幕${bad.size ? '，违规：' + `${bad.size} 处，如 ${[...bad].slice(0, 5).join(', ')}` : ''}`);
check(
  SMALL_AT.compare.x + 150 < SAFE.railX && SMALL_AT.compare.y + SMALL.r * PX_PER_M + 138 + 6 < ZONE.panel.top && Math.hypot(SMALL_AT.compare.x - BIG_AT.compare.x, SMALL_AT.compare.y - BIG_AT.compare.y) > (BIG.r + SMALL.r) * PX_PER_M + 30,
  '镜 4 两个圆不相碰；小圆下方三行字在右侧互动区左边、代码区上方',
);
check(cell(3).right < SAFE.railX && cell(3).bottom < ZONE.subtitle.top && GRID.top > ZONE.chip.top + 40, '镜 5 四格不压右侧互动区、字幕和小标签');
const {subtitle, panel} = ZONE;
check(subtitle.left + subtitle.width <= SAFE.railX && subtitle.top + subtitle.height <= SAFE.bottomY, '字幕区在遮挡区外');
check(panel.left + panel.width <= SAFE.railX, '代码 / 运行结果面板在遮挡区外');

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
