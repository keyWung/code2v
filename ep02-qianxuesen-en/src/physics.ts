import {GLOBE} from './layout';

const rad = (deg: number) => (deg * Math.PI) / 180;

// ---------- 复用 EP01：同一组 x(t)、y(t)，镜 1 回顾与镜 2 代码区用；画面上不显示具体数字
export const EP01 = {v0: 20, g: 10, deg: 45, axes: {x: 44, y: 17, step: 5}};
export const CORE_CODE = [
  'const x = v0 * Math.cos(theta) * t;',
  'const y = v0 * Math.sin(theta) * t - 0.5 * g * t * t;',
];

export const position = (t: number) => {
  const theta = rad(EP01.deg);
  const x = EP01.v0 * Math.cos(theta) * t;
  const y = EP01.v0 * Math.sin(theta) * t - 0.5 * EP01.g * t * t;
  return {x, y};
};
export const flightTime = (2 * EP01.v0 * Math.sin(rad(EP01.deg))) / EP01.g;

// ---------- 地球示意的世界坐标：s 沿地面的弧长、h 离地高度、l 侧向偏移，都是示意像素，不是真实数据
export type Pt = {s: number; h: number; l: number};
const {R} = GLOBE;

// 临近空间带（示意）：口播里的“约 20 至 100 公里”只作标注，高度不按比例
export const NEAR_SPACE = {lo: 50, hi: 180};

// 普通弹道：关机后只剩惯性 + 重力，和 EP01 同一形式
//   s(t) = s0 + vx·t，h(t) = h0 + vy·t − ½·g·t²
const S_LAND = R * rad(25);
const APEX_H = 480;
const K = APEX_H / S_LAND ** 2;
const S_CUT = -R * rad(21);
export const ballistic = {
  launchS: S_CUT - 22,
  cut: {s: S_CUT, h: APEX_H - K * S_CUT ** 2, l: 0},
  vx: 1,
  vy: -2 * K * S_CUT,
  g: 2 * K,
  T: S_LAND - S_CUT,
  landS: S_LAND,
};

export const ballisticAt = (t: number): Pt => {
  const {cut, vx, vy, g} = ballistic;
  return {s: cut.s + vx * t, h: Math.max(0, cut.h + vy * t - 0.5 * g * t * t), l: 0};
};

// 助推段：从地面竖直起飞，到关机点时与抛物线相切（二次贝塞尔）
export const boostAt = (u: number): Pt => {
  const {launchS, cut, vy, vx} = ballistic;
  const c = {s: launchS, h: cut.h - (vy / vx) * (cut.s - launchS)};
  const a = (1 - u) ** 2;
  const b = 2 * (1 - u) * u;
  const d = u * u;
  return {s: a * launchS + b * c.s + d * cut.s, h: b * c.h + d * cut.h, l: 0};
};

// 整条普通弹道按进度 p 取点：前 boostShare 是助推段
export const ballisticPath = (p: number, boostShare: number): Pt =>
  p < boostShare ? boostAt(p / boostShare) : ballisticAt(((p - boostShare) / (1 - boostShare)) * ballistic.T);

// ---------- 升力滑翔：示意曲线，过一组控制点的平滑样条，不是飞行数据
const launch = {s: ballistic.launchS, h: 0, l: 0};
const ascent: Pt[] = [
  launch,
  {s: launch.s + 4, h: 70, l: 0},
  {s: -258, h: 150, l: 0},
  {s: -224, h: 196, l: 0},
  {s: -186, h: 186, l: 0},
  {s: -150, h: 140, l: 0},
  {s: -116, h: 104, l: 0},
  {s: -72, h: 108, l: 0},
  {s: -28, h: 100, l: 0},
];

// 镜 3：一次转向
const GLIDE_A_PTS: Pt[] = [
  ...ascent,
  {s: 10, h: 104, l: 0},
  {s: 50, h: 98, l: -8},
  {s: 92, h: 96, l: -55},
  {s: 135, h: 94, l: -100},
  {s: 180, h: 92, l: -118},
  {s: 222, h: 88, l: -122},
  {s: 250, h: 66, l: -123},
  {s: 270, h: 30, l: -124},
  {s: 280, h: 0, l: -124},
];

// 镜 6：中途两次变向，预测点一再失效
const GLIDE_B_PTS: Pt[] = [
  ...ascent,
  {s: 10, h: 104, l: 0},
  {s: 36, h: 100, l: -40},
  {s: 64, h: 98, l: -125},
  {s: 98, h: 96, l: -160},
  {s: 128, h: 95, l: -140},
  {s: 158, h: 94, l: -60},
  {s: 190, h: 93, l: 0},
  {s: 222, h: 92, l: 20},
  {s: 256, h: 84, l: 24},
  {s: 280, h: 50, l: 24},
  {s: 292, h: 0, l: 24},
];

const lerpPt = (a: Pt, b: Pt, u: number): Pt => ({
  s: a.s + (b.s - a.s) * u,
  h: a.h + (b.h - a.h) * u,
  l: a.l + (b.l - a.l) * u,
});
const dist = (a: Pt, b: Pt) => Math.hypot(b.s - a.s, b.h - a.h, b.l - a.l);

// 均匀 Catmull-Rom
const catmull = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  return {s: f(p0.s, p1.s, p2.s, p3.s), h: Math.max(0, f(p0.h, p1.h, p2.h, p3.h)), l: f(p0.l, p1.l, p2.l, p3.l)};
};

export type GlidePath = {pts: Pt[]; len: number[]; total: number};

const buildPath = (ctrl: Pt[], perSeg = 48): GlidePath => {
  const pts: Pt[] = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)];
    const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let j = 0; j < perSeg; j++) pts.push(catmull(p0, ctrl[i], ctrl[i + 1], p3, j / perSeg));
  }
  pts.push(ctrl[ctrl.length - 1]);
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + dist(pts[i - 1], pts[i]));
  return {pts, len, total: len[len.length - 1]};
};

export const GLIDE_A = buildPath(GLIDE_A_PTS);
export const GLIDE_B = buildPath(GLIDE_B_PTS);

// 镜 1：EP01 的抛物线画到最高点，突然改成滑行（EP01 坐标，单位米，l 不用）
export const HOOK_TURN = buildPath([
  {s: 20, h: 10, l: 0},
  {s: 23.5, h: 10.1, l: 0},
  {s: 27, h: 9.4, l: 0},
  {s: 30.5, h: 9.8, l: 0},
  {s: 34, h: 9.1, l: 0},
  {s: 37, h: 8.7, l: 0},
]);

// 按弧长比例 u 取点
export const pathAt = (path: GlidePath, u: number): Pt => {
  const target = Math.max(0, Math.min(1, u)) * path.total;
  let lo = 0;
  let hi = path.len.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (path.len[mid] <= target) lo = mid;
    else hi = mid;
  }
  const seg = path.len[hi] - path.len[lo];
  return lerpPt(path.pts[lo], path.pts[hi], seg > 0 ? (target - path.len[lo]) / seg : 0);
};

// 从起点到 u 的折线点
export const pathUntil = (path: GlidePath, u: number, from = 0): Pt[] => {
  const a = Math.max(0, Math.min(1, from)) * path.total;
  const b = Math.max(0, Math.min(1, u)) * path.total;
  if (b <= a) return [];
  const out = [pathAt(path, from)];
  for (let i = 0; i < path.pts.length; i++) if (path.len[i] > a && path.len[i] < b) out.push(path.pts[i]);
  out.push(pathAt(path, u));
  return out;
};

// 第一次到达地面弧长 s 时的进度
export const uAtS = (path: GlidePath, s: number): number => {
  const i = path.pts.findIndex((p) => p.s >= s);
  return i < 0 ? 1 : path.len[i] / path.total;
};

// 沿当前航向（只看 s、l 方向）直线外推 d，高度保持不变：拦截方按“它不变向”算出的点
export const extrapolate = (path: GlidePath, u: number, d: number): Pt => {
  const a = pathAt(path, u - 0.004);
  const b = pathAt(path, u + 0.004);
  const n = Math.hypot(b.s - a.s, b.l - a.l) || 1;
  const p = pathAt(path, u);
  return {s: p.s + ((b.s - a.s) / n) * d, h: p.h, l: p.l + ((b.l - a.l) / n) * d};
};

// ---------- 雷达视距：雷达在地面，视线最低只能贴着地平线（切平面）；切平面以下就被地球挡住
export const RADAR = {s: R * rad(29), h: 0, l: 0};
export const radarSees = (p: Pt) => {
  const th = p.s / R - RADAR.s / R;
  return (R + p.h) * Math.cos(p.l / R) * Math.cos(th) > R + 1e-6;
};
