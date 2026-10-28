import episode from '../episodes/ep03-danbai.json';

const conditionText = episode.physics.conditions.join(' ');
const readNumber = (re: RegExp): number => {
  const m = conditionText.match(re);
  if (!m) throw new Error(`JSON conditions 里找不到 ${re}`);
  return Number(m[1]);
};

export const g = readNumber(/g = (\d+(?:\.\d+)?)/);
// 小角度上限：一般小于 5°
export const SMALL_ANGLE_DEG = readNumber(/小于 (\d+)°/);

export type Case = (typeof episode.physics.cases)[number];
export const cases: Case[] = episode.physics.cases;
export const mainCase = cases.find((c) => 'is_main_case' in c && c.is_main_case)!;
export const caseOf = (L: number) => cases.find((c) => c.length_m === L)!;
export const CODE = episode.physics.code;

// 本期用的摆角，都在小角度范围内
export const THETA0_DEG = 4;
export const THETA0_SMALL_DEG = 2;
// 真实 4° 在画面上只挪几十像素，画的时候把角度放大 3 倍，画面上写明
export const DRAW_GAIN = 3;

// 与 JSON code 两行一致
export const omega = (L: number) => Math.sqrt(g / L);
export const theta = (theta0: number, L: number, t: number) => theta0 * Math.cos(omega(L) * t);

// T = 2π√(L/g)
export const period = (L: number) => 2 * Math.PI * Math.sqrt(L / g);
