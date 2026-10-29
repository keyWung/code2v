import fs from 'node:fs';
import path from 'node:path';
import episode from '../episodes/ep05-dianchangxian.json';
import {chapterStatus} from '../src/components/ChapterHeader';
import {ARC_INDEX, LIKE_LINES, MID, OPPOSITE_LINES, PAIR_R, pairCharges, PARTICLE_PATH, TITLE_H} from '../src/components/Dipole';
import {UNIFORM_PLATE, UNIFORM_X} from '../src/components/UniformField';
import {cell, CENTER, CHARGE_R, E_PX, GRID, HOOK, LEFT, SAFE, STAGE, STAGE_TALL_BOTTOM, ZONE} from '../src/layout';
import {cases, CODE, fieldAt, fieldE, FORMULA, K, PX_PER_M, Q, sciCaret, type Pt} from '../src/physics';
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
const near = (a: number, b: number, rel = 1e-9) => Math.abs(a - b) <= rel * Math.max(Math.abs(a), Math.abs(b));

// ---------- 三组数字：规划包第二节表格，独立于 JSON 再对一遍
check(near(K, 9.0e9) && near(Q, 1e-6), `条件：k = ${K}，Q = ${Q} C`);
const TABLE = [
  {r: 0.1, display: '9.0×10^5'},
  {r: 0.2, display: '2.25×10^5'},
  {r: 0.4, display: '约 5.6×10^4'},
];
for (const row of TABLE) {
  const c = cases.find((x) => x.r_m === row.r);
  const e = fieldE(Q, row.r);
  check(
    !!c && near(e, c.field_E) && sciCaret(e) === row.display && c.display_E === `${row.display} N/C`,
    `r = ${row.r} m：公式 ${e.toFixed(1)} N/C → ${sciCaret(e)} / JSON ${c?.field_E}「${c?.display_E}」/ 表 ${row.display}`,
  );
}
const e1 = fieldE(Q, 0.1);
check(near(fieldE(Q, 0.2) / e1, 1 / 4) && !near(fieldE(Q, 0.2) / e1, 1 / 2) && near(fieldE(Q, 0.4) / e1, 1 / 16), '距离翻倍场强只剩 1/4（不是 1/2），距离 4 倍只剩 1/16');

// ---------- 场强由 JSON 里的代码算出
check(CODE === 'const E = k * Q / (r * r);' && FORMULA === 'E = kQ / r²', `代码与公式与 JSON 一致：${CODE}`);
const jsonCode = new Function('k', 'Q', 'r', `${CODE} return E;`) as (k: number, q: number, r: number) => number;
const rs = [0.1, 0.2, 0.4, 0.05, 0.137, 0.26, 1];
check(rs.every((r) => jsonCode(K, Q, r) === fieldE(Q, r)), '画面用的 fieldE() 与 JSON 那行代码逐点完全相同');
const src = ['src/EP05.tsx', 'src/components/Dipole.tsx', 'src/components/UniformField.tsx', 'src/Cover.tsx'].map(read).join('\n');
check(!/display_E|field_E/.test(src) && /fieldE\(Q, /.test(read('src/EP05.tsx')) && /K \* q\) \/ \(r \* r\)/.test(read('src/physics.ts')), '场强数字、箭头长度都调用 fieldE() 现算，没有直接拿 JSON 里的数');
check(near(E_PX * fieldE(Q, 0.2), 25) && near(E_PX * fieldE(Q, 0.1), 100), '箭头长度与 E 成正比：0.1 米 100 像素，0.2 米 25 像素');

// ---------- 电场线的规则：用画面上真正画的线来验
const unit = (v: Pt) => ({x: v.x / Math.hypot(v.x, v.y), y: v.y / Math.hypot(v.x, v.y)});
const tangentOk = (lines: Pt[][], charges: {x: number; y: number; q: number}[]) =>
  lines.every((l) =>
    l.slice(1, -1).every((p, i) => {
      const seg = unit({x: l[i + 2].x - l[i].x, y: l[i + 2].y - l[i].y});
      const e = unit(fieldAt(charges, p));
      return seg.x * e.x + seg.y * e.y > 0.999;
    }),
  );
check(
  tangentOk(OPPOSITE_LINES, pairCharges(false)) && tangentOk(LIKE_LINES, pairCharges(true)),
  `两张图共 ${OPPOSITE_LINES.length + LIKE_LINES.length} 条线，每一点的切线方向都与叠加算出的场强方向一致`,
);
const single = [{...HOOK, q: Q}];
check(
  [0, 30, 45, 100, 200].every((deg) => {
    const d = {x: Math.cos((deg * Math.PI) / 180), y: Math.sin((deg * Math.PI) / 180)};
    const e = unit(fieldAt(single, {x: HOOK.x + d.x * 150, y: HOOK.y + d.y * 150}));
    return e.x * d.x + e.y * d.y > 0.999999;
  }),
  '单个正电荷：场强沿半径向外，放射状直线就是电场线（镜 2 放大镜里两者重合）',
);
const inBox = (p: Pt) => p.x >= 0 && p.x <= GRID.w && p.y >= TITLE_H && p.y <= GRID.h;
const startsOk = (l: Pt[], cs: {x: number; y: number; q: number}[]) =>
  !inBox(l[0]) || cs.some((c) => c.q > 0 && Math.abs(Math.hypot(l[0].x - c.x, l[0].y - c.y) - PAIR_R) < 1e-6);
const endsOk = (l: Pt[], cs: {x: number; y: number; q: number}[]) => {
  const e = l[l.length - 1];
  return !inBox(e) || cs.some((c) => c.q < 0 && Math.abs(Math.hypot(e.x - c.x, e.y - c.y) - PAIR_R) < 1e-6);
};
check(
  OPPOSITE_LINES.every((l) => startsOk(l, pairCharges(false)) && endsOk(l, pairCharges(false)) && (inBox(l[0]) || inBox(l[l.length - 1]))) &&
    LIKE_LINES.every((l) => startsOk(l, pairCharges(true)) && endsOk(l, pairCharges(true))),
  '每条线都起于正电荷（或从画面外来）、止于负电荷（或伸出画面），没有半路断掉',
);
const toNeg = OPPOSITE_LINES.filter((l) => inBox(l[0]) && inBox(l[l.length - 1])).length;
check(toNeg >= 6, `等量异种：${toNeg} 条线在画面里从正走到负`);
const cross = (a: Pt, b: Pt, c: Pt, d: Pt) => {
  const o = (p: Pt, q: Pt, r: Pt) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
};
const crossings = (lines: Pt[][]) => {
  let n = 0;
  for (let i = 0; i < lines.length; i++)
    for (let j = i + 1; j < lines.length; j++)
      for (let a = 1; a < lines[i].length; a++)
        for (let b = 1; b < lines[j].length; b++) if (cross(lines[i][a - 1], lines[i][a], lines[j][b - 1], lines[j][b])) n++;
  return n;
};
check(crossings(OPPOSITE_LINES) === 0 && crossings(LIKE_LINES) === 0, '两张典型图里任意两条线都不相交');
const mid = fieldAt(pairCharges(true), MID);
check(Math.hypot(mid.x, mid.y) < 1e-6 * fieldE(Q, 0.1), `等量同种：连线中点场强为零（${Math.hypot(mid.x, mid.y)} N/C）`);
check(
  UNIFORM_X.every((x, i) => i === 0 || Math.abs(x - UNIFORM_X[i - 1] - (UNIFORM_X[1] - UNIFORM_X[0])) < 1e-9) && UNIFORM_X[0] > UNIFORM_PLATE.left && UNIFORM_X[UNIFORM_X.length - 1] < UNIFORM_PLATE.right,
  '平行板：线竖直、等距，只画在板的中间部分',
);
const arc = OPPOSITE_LINES[ARC_INDEX];
const distToArc = (p: Pt) => Math.min(...arc.map((q) => Math.hypot(p.x - q.x, p.y - q.y)));
const apart = Math.max(...PARTICLE_PATH.map(distToArc));
check(apart > 25 && distToArc(PARTICLE_PATH[0]) < 1e-6, `粒子从电场线上静止释放，轨迹最远离开这条线 ${apart.toFixed(0)} 像素：线不是运动轨迹`);

// ---------- 模型、边界的说法
const vo = episode.shots.map((s) => s.口播).join('');
const ep = read('src/EP05.tsx');
check(/电场线是人为画的模型 · 条数只是示意/.test(ep) && /模型/.test(subtitleNote(shots[1])?.text ?? '') && /示意/.test(subtitleNote(shots[2])?.text ?? ''), '“线是模型、条数是示意”常驻画面小标签，镜 2、镜 3 小注再写');
const onScreen = [ep, read('src/subtitles.ts'), read('src/components/Cell.tsx'), ...episode.shots.map((s) => s.字幕 + s.口播)].join('\n');
check(!/共\s*\d+\s*条|数一数|条数代表|条数就是/.test(onScreen), '没有把线的条数说成数出来的真实数量');
check(
  ['切线方向 = 场强方向', '线密场强，线稀场弱', '起于正，止于负或无穷远', '不相交，也不闭合', '不是粒子的运动轨迹'].every((t) => ep.includes(t)) &&
    /线不相交/.test(vo) &&
    /不是粒子的运动轨迹/.test(vo),
  '切线、疏密、起止、不相交、不闭合、不是轨迹：读图规则卡全列出，口播点明不相交与不是轨迹',
);
check(/忽略边缘效应/.test(ep) && /边缘效应/.test(subtitleNote(shots[4])?.text ?? ''), '匀强电场注明“忽略边缘效应”才平行等距');

// ---------- 分镜、冻结、章节、盖章
check(shots.length === 6 && shots[0].from === 0 && shots[shots.length - 1].to === TOTAL_FRAMES, `6 镜覆盖 0-${TOTAL_FRAMES} 帧`);
check(
  shots.every((s, i) => i === 0 || s.from === shots[i - 1].to),
  '6 镜首尾相接无空档',
);
check(TOTAL_FRAMES === episode.format.duration_seconds * episode.format.fps, '总帧数 = 60 秒 × 30fps');
check(FREEZE_FROM === 1650, `冻结起点 ${FREEZE_FROM} 帧（55 秒）`);
const expected = episode.chapters.map((c) => c.stamp);
check(stamps.length === expected.length && stamps.every((s, i) => s.text === expected[i]), `盖章文字与 JSON 一致：${stamps.map((s) => s.text).join(' / ')}`);
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
check(subtitleLines(shots[3]).some((l) => l.text.includes('1/4')), `镜 4 字幕“1/4”不被拆开：${subtitleLines(shots[3]).map((l) => l.text).join(' | ')}`);
check(subtitleLines(shots[5]).length === 2, `镜 6 字幕分两行：${subtitleLines(shots[5]).map((l) => l.text).join(' | ')}`);

// ---------- 版式：电荷、场线、箭头、字幕不压遮挡区
const inRail = (x: number, y: number) => x >= SAFE.railX && y >= SAFE.railFromY;
check(STAGE.right < SAFE.railX && STAGE.bottom < ZONE.panel.top && STAGE_TALL_BOTTOM < ZONE.subtitle.top, '舞台在遮挡区外，镜 1-2 不压字幕，镜 3-4 不压代码区');
check(cell(3).right < SAFE.railX && cell(3).bottom < ZONE.subtitle.top, '镜 5 四格不压右侧互动区和字幕');
const pts: {name: string; x: number; y: number}[] = [];
for (const o of [HOOK, CENTER, LEFT]) pts.push({name: '电荷', x: o.x + CHARGE_R, y: o.y + CHARGE_R});
pts.push({name: '镜 3 远处 0.26 米探针', x: CENTER.x + 0.26 * PX_PER_M + E_PX * fieldE(Q, 0.26), y: CENTER.y});
pts.push({name: '镜 4 0.2 米箭头', x: LEFT.x + 0.2 * PX_PER_M + E_PX * fieldE(Q, 0.2), y: LEFT.y});
pts.push({name: '镜 2 放大镜', x: 785 + 105, y: 640 + 105});
for (let i = 0; i < 4; i++) pts.push({name: `镜 5 第 ${i + 1} 格右下角`, x: cell(i).right, y: cell(i).bottom});
for (const p of PARTICLE_PATH) pts.push({name: '粒子轨迹', x: cell(0).left + p.x, y: cell(0).top + p.y});
const bad = pts.filter((p) => inRail(p.x, p.y) || p.y >= SAFE.bottomY || p.x > STAGE.right + 1);
check(bad.length === 0, `电荷、箭头、轨迹、格子都不进遮挡区（检查 ${pts.length} 处）${bad.length ? '，违规：' + bad.map((b) => b.name).join(', ') : ''}`);
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
