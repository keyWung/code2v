import episode from '../episodes/ep07-yuanzhou.json';

const {physics} = episode;
const FPS = episode.format.fps;

export type Case = (typeof physics.cases)[number];
export const cases: Case[] = physics.cases;
export const CODE = physics.code;
export const FORMULA = physics.formula;

// 与 JSON code 一致：const omega = v / r; const a = v * v / r;（v 单位 m/s，r 单位 m）
export const omegaOf = (v: number, r: number) => v / r;
export const accelOf = (v: number, r: number) => (v * v) / r;
// T = 2πr / v
export const periodOf = (v: number, r: number) => (2 * Math.PI * r) / v;

export const V = cases[0].v;
export const R_BIG = cases[0].r_m;
export const R_SMALL = cases[1].r_m;

// 除不尽的周期写成“约 3.14”
export const periodText = (v: number, r: number) => `约 ${periodOf(v, r).toFixed(2)}`;

export type Pt = {x: number; y: number};

// 画面比例：1 米画 PX_PER_M 像素；速度箭头每 m/s 画 V_PX 像素；向心加速度箭头每 m/s² 画 A_PX 像素
export const PX_PER_M = 130;
export const V_PX = 30;
export const A_PX = 7.5;

// 匀速圆周运动：角度每帧增加 ω / FPS，屏幕上逆时针转
// p = c + R(cos θ, −sin θ)；速度沿切线 (−sin θ, −cos θ)；向心方向从物体指向圆心 (−cos θ, sin θ)
export type Orbit = {r: number; v: number; phase: number};
export const angleAt = (o: Orbit, f: number) => o.phase + (omegaOf(o.v, o.r) * f) / FPS;
export const ringAt = (c: Pt, rPx: number, th: number) => ({
  th,
  p: {x: c.x + rPx * Math.cos(th), y: c.y - rPx * Math.sin(th)},
  vel: {x: -Math.sin(th), y: -Math.cos(th)},
  inward: {x: -Math.cos(th), y: Math.sin(th)},
});
export const orbitAt = (o: Orbit, c: Pt, f: number, rPx = o.r * PX_PER_M) => ringAt(c, rPx, angleAt(o, f));

// 镜 1-4 的两条轨道，角度从第 0 帧起连续算
export const BIG: Orbit = {r: R_BIG, v: V, phase: Math.PI / 4};
export const SMALL: Orbit = {r: R_SMALL, v: V, phase: Math.PI};

export const add = (a: Pt, b: Pt, k = 1): Pt => ({x: a.x + b.x * k, y: a.y + b.y * k});
export const unit = (v: Pt): Pt => {
  const n = Math.hypot(v.x, v.y);
  return n < 1e-12 ? {x: 0, y: 0} : {x: v.x / n, y: v.y / n};
};
