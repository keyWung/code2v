import episode from '../episodes/ep04-guangzheshe.json';

const {physics} = episode;
const conditionText = physics.conditions.join(' ');
const readNumber = (re: RegExp): number => {
  const m = conditionText.match(re);
  if (!m) throw new Error(`JSON conditions 里找不到 ${re}`);
  return Number(m[1]);
};

export type Case = (typeof physics.cases)[number];
export const cases: Case[] = physics.cases;
const caseOf = (medium: string) => cases.find((c) => c.medium === medium)!;
export const WATER = caseOf('水');
export const GLASS = caseOf('玻璃');
export const INCIDENT_DEG = WATER.incident_deg;
export const CRITICAL = physics.critical_angle;
export const CODE = physics.code[0];
export const FORMULA = physics.formula;

// 折射率取近似值
export const N_AIR = readNumber(/空气约 (\d+(?:\.\d+)?)/);
export const N_WATER = WATER.n;
export const N_GLASS = GLASS.n;

// 光速，单位 10^8 m/s；空气里和真空几乎一样
export const SPEED = {
  air: readNumber(/真空约 (\d+(?:\.\d+)?)×10\^8/),
  water: readNumber(/水中约 (\d+(?:\.\d+)?)×10\^8/),
  glass: readNumber(/玻璃中约 (\d+(?:\.\d+)?)×10\^8/),
};
export const speedText = (v: number) => `约 ${v}×10⁸ m/s`;

export const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

// 与 JSON code 一致：theta2 = asin(n1·sinθ1 / n2)，角度都从法线量
// 光从 n 大射向 n 小、入射角超过临界角时，asin 的参数大于 1，结果是 NaN：没有折射光
export const snellArg = (n1: number, n2: number, theta1Deg: number) => (n1 * Math.sin(rad(theta1Deg))) / n2;
export const refract = (n1: number, n2: number, theta1Deg: number) => deg(Math.asin(snellArg(n1, n2, theta1Deg)));

// 临界角：折射角正好 90°
export const criticalAngle = (n1: number, n2: number) => deg(Math.asin(n2 / n1));

// 反射光占比（菲涅耳公式，自然光取两种偏振的平均）；全反射时为 1
export const reflectance = (n1: number, n2: number, theta1Deg: number) => {
  const t2 = refract(n1, n2, theta1Deg);
  if (Number.isNaN(t2)) return 1;
  const ci = Math.cos(rad(theta1Deg));
  const ct = Math.cos(rad(t2));
  const rs = (n1 * ci - n2 * ct) / (n1 * ci + n2 * ct);
  const rp = (n2 * ci - n1 * ct) / (n2 * ci + n1 * ct);
  return (rs * rs + rp * rp) / 2;
};

export type Pt = {x: number; y: number};

// 水下一点 P 发出的光：在水里与法线成 a 角射到水面，出水后按 refract() 拐弯
// 二分 a，让出水的光正好进眼睛 E
export const rayToEye = (p: Pt, eye: Pt, surfaceY: number) => {
  const depth = p.y - surfaceY;
  const height = surfaceY - eye.y;
  const dir = Math.sign(eye.x - p.x) || 1;
  const reach = (a: number) => {
    const sx = p.x + dir * depth * Math.tan(rad(a));
    const b = refract(N_WATER, N_AIR, a);
    return {sx, b, x: sx + dir * height * Math.tan(rad(b))};
  };
  let lo = 0;
  let hi = criticalAngle(N_WATER, N_AIR) - 1e-6;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if ((reach(mid).x - eye.x) * dir < 0) lo = mid;
    else hi = mid;
  }
  const a = (lo + hi) / 2;
  const {sx, b} = reach(a);
  // 眼睛以为光走直线：把出水的光反向延长到 P 的正上方，就是看到的位置
  const image = {x: p.x, y: surfaceY + Math.abs(sx - p.x) / Math.tan(rad(b))};
  return {s: {x: sx, y: surfaceY}, a, b, image};
};
