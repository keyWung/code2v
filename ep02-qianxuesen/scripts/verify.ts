import fs from 'node:fs';
import path from 'node:path';
import episode from '../episodes/ep02-qianxuesen.json';
import {chapterStatus} from '../src/components/ChapterHeader';
import {project, TILT_MAX} from '../src/globe';
import {GLOBE_FADE, SAFE, ZONE} from '../src/layout';
import {
  ballistic,
  ballisticAt,
  boostAt,
  GLIDE_A,
  GLIDE_B,
  NEAR_SPACE,
  pathAt,
  Pt,
  RADAR,
  uAtS,
} from '../src/physics';
import {subtitleLines, subtitleNote} from '../src/subtitles';
import {beats, chapters, FREEZE_FROM, glideBU, shots, STAMP_DOCK, STAMP_HOLD, stamps, TOTAL_FRAMES} from '../src/timeline';
import {theme} from '../src/theme';

let failed = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) failed++;
};
const root = path.resolve(import.meta.dirname, '..');

// ---------- 分镜与冻结
check(shots.length === 7 && shots[0].from === 0 && shots[shots.length - 1].to === TOTAL_FRAMES, `7 镜覆盖 0-${TOTAL_FRAMES} 帧`);
check(
  shots.every((s, i) => i === 0 || s.from === shots[i - 1].to),
  '7 镜首尾相接无空档',
);
check(TOTAL_FRAMES === episode.format.duration_seconds * episode.format.fps, '总帧数 = 72 秒 × 30fps');
check(FREEZE_FROM === 2010, `冻结起点 ${FREEZE_FROM} 帧（67 秒）`);

// ---------- 章节进度与盖章
const expectedStamps = episode.chapters.flatMap((c) => c.stamps ?? [c.stamp]);
check(
  stamps.length === expectedStamps.length && stamps.every((s, i) => s.text === expectedStamps[i]),
  `盖章文字与 JSON 一致：${stamps.map((s) => s.text).join(' / ')}`,
);
for (const s of stamps) {
  const shot = shots[s.shot - 1];
  const docked = s.hitAt + STAMP_HOLD + STAMP_DOCK;
  check(
    s.hitAt >= shot.from && docked < shot.to && docked < FREEZE_FROM + 1,
    `「${s.text}」在镜 ${s.shot} 末尾 ${s.hitAt} 帧落下一次，${docked} 帧停靠完成（镜末 ${shot.to}）`,
  );
}
const statusAt = (f: number) => chapters.map((_, i) => chapterStatus(f, i)).join(',');
for (const s of shots) {
  const mid = Math.floor((s.from + s.to) / 2);
  const idx = chapters.findIndex((c) => c.id === s.chapter);
  const want = chapters
    .map((c, i) => (s.chapter === null ? (s.shot === 1 ? 'locked' : 'done') : i < idx ? 'done' : i === idx ? 'current' : 'locked'))
    .join(',');
  check(statusAt(mid) === want, `镜 ${s.shot} 中段章节进度 ${statusAt(mid)}`);
}
check(statusAt(FREEZE_FROM) === 'done,done,done', '冻结段 01/02/03 全部打勾');

// ---------- 示意物理：只验证画面内部自洽，不代表真实数据
const T = ballistic.T;
check(Math.abs(ballisticAt(T).h) < 1e-6 && Math.abs(ballisticAt(T).s - ballistic.landS) < 1e-6, '关机后按 x(t)、y(t) 落到落点');
const a = boostAt(0.999);
const b = boostAt(1);
const slope = (b.h - a.h) / (b.s - a.s);
check(Math.abs(slope - ballistic.vy / ballistic.vx) < 0.05, '助推段在关机点与抛物线相切');
const glideSeg = GLIDE_A.pts.filter((p) => p.s >= -116 && p.s <= 222);
check(
  glideSeg.every((p) => p.h >= NEAR_SPACE.lo && p.h <= NEAR_SPACE.hi),
  `滑行段全程在临近空间带内（${Math.min(...glideSeg.map((p) => p.h)).toFixed(0)}–${Math.max(...glideSeg.map((p) => p.h)).toFixed(0)}）`,
);
check(beats.radar.seenBallistic < beats.radar.seenGlide, `雷达先看到高抛（${beats.radar.seenBallistic} 帧），后看到低滑（${beats.radar.seenGlide} 帧）`);
check(pathAt(GLIDE_A, 1).s < ballistic.landS - 20, '滑翔落点与抛物线落点不同');
const offTrack = (p: Pt) => {
  const actual = pathAt(GLIDE_B, uAtS(GLIDE_B, p.s));
  return Math.hypot(actual.l - p.l, actual.h - p.h);
};
beats.maneuver.predictions.slice(0, 2).forEach((pr, i) => {
  check(offTrack(pr.pt) > 60, `第 ${i + 1} 个预测相遇点被变向甩开 ${offTrack(pr.pt).toFixed(0)}（示意单位）`);
});
check(beats.maneuver.fails.every((f, i) => f > beats.maneuver.predictions[i].at), '预测点先出现、后打叉');

// ---------- 版式：关键画面不压右侧互动区和底部操作栏
const inRail = (x: number, y: number) => x >= SAFE.railX && y >= SAFE.railFromY;
const bad = (x: number, y: number) => inRail(x, y) || y >= SAFE.bottomY || y <= SAFE.top;
const keyPoints: {name: string; pts: {x: number; y: number}[]}[] = [];
for (const tilt of [0, TILT_MAX]) {
  keyPoints.push({name: `普通弹道 tilt=${tilt.toFixed(2)}`, pts: Array.from({length: 101}, (_, i) => project(ballisticAt((T * i) / 100), tilt))});
  keyPoints.push({name: `滑翔 A tilt=${tilt.toFixed(2)}`, pts: GLIDE_A.pts.map((p) => project(p, tilt))});
}
keyPoints.push({name: '滑翔 B', pts: GLIDE_B.pts.map((p) => project(p, TILT_MAX))});
keyPoints.push({name: '预测相遇点', pts: beats.maneuver.predictions.map((p) => project(p.pt, TILT_MAX))});
keyPoints.push({name: '雷达', pts: [project(RADAR, 0)]});
keyPoints.push({name: '落点', pts: [project({s: ballistic.landS, h: 0, l: 0}, 0), project(pathAt(GLIDE_A, 1), TILT_MAX)]});
keyPoints.push({name: '镜 6 滑翔头', pts: [project(pathAt(GLIDE_B, glideBU(FREEZE_FROM)), TILT_MAX)]});
for (const k of keyPoints) {
  const off = k.pts.filter((p) => bad(p.x, p.y));
  check(off.length === 0, `${k.name} 不进遮挡区${off.length ? `（${off.length} 点越界）` : ''}`);
}
check(GLOBE_FADE.right[1] <= SAFE.railX, `地球在 x=${GLOBE_FADE.right[1]} 前淡出，不进右侧互动区`);
const {subtitle, panel, reasons} = ZONE;
check(subtitle.left + subtitle.width <= SAFE.railX && subtitle.top + subtitle.height <= SAFE.bottomY, '字幕区在遮挡区外');
check(panel.left + panel.width <= SAFE.railX, '代码面板 / 预警时间面板在遮挡区外');
check(Math.max(...reasons.xs) + (280 * reasons.scale) / 2 <= SAFE.railX, '原因栏三枚盖章在遮挡区外');

// ---------- 事实边界与比喻小注
const shotText = episode.shots.map((s) => [s.口播, s.字幕, s.画面].join(' ')).join(' ');
const pub = Object.values(episode.publish).flat().join(' ');
const srcFiles = (dir: string): string[] =>
  fs.readdirSync(dir, {withFileTypes: true}).flatMap((e) => (e.isDirectory() ? srcFiles(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const src = srcFiles(path.join(root, 'src'))
  .filter((p) => /\.tsx?$/.test(p))
  .map((p) => fs.readFileSync(p, 'utf8'))
  .join('\n');
const forbidden = [/(1[89]|20)\d{2}\s*年/, /马赫/, /mach/i, /km\/h/i, /公里\s*[\/每]\s*小时/, /米每秒/, /东风|DF-\d|先锋|锆石|匕首|Avangard|Zircon|Kinzhal/i, /射程\s*\d|速度\s*\d/];
for (const re of forbidden) {
  check(!re.test(shotText + pub + src), `口播、字幕、简介、画面都不含 ${re}`);
}
const kmInSrc = [...src.matchAll(/(\d+)\s*(?:–|-|至|到)?\s*(\d+)?\s*公里/g)].map((m) => m[0]);
check(kmInSrc.every((s) => /20\s*(?:[–-]|至)\s*100\s*公里/.test(s)), `画面上的公里数只有临近空间 20–100：${kmInSrc.join(', ')}`);
check(shots[2].口播.includes('七十多年前') && !/\d{4}/.test(shots[2].口播), '只说七十多年前，不写具体年份');
const n3 = subtitleNote(shots[2])?.text ?? '';
const n5 = subtitleNote(shots[4])?.text ?? '';
check(n3.includes('打水漂是比喻') && n3.includes('示意图'), `镜 3 小注：${n3}`);
check(n5.includes('夹层是通俗说法') && n5.includes('示意图'), `镜 5 小注：${n5}`);
check(/示意图 · 非真实比例与参数/.test(fs.readFileSync(path.join(root, 'src/EP02.tsx'), 'utf8')), '全片左上角常驻“示意图 · 非真实比例与参数”');
check(subtitleLines(shots[6]).length === 2, `镜 7 字幕分两行：${subtitleLines(shots[6]).map((l) => l.text).join(' | ')}`);

// ---------- 配色、数据来源
const files = srcFiles(root).filter((p) => !p.includes(`${path.sep}node_modules${path.sep}`) && !p.includes(`${path.sep}.`));
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
