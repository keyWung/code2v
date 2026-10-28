import episode from '../episodes/ep01-paowuxian.json';

const conditionText = episode.physics.conditions.join(' ');
const readNumber = (re: RegExp): number => {
  const m = conditionText.match(re);
  if (!m) throw new Error(`JSON conditions 里找不到 ${re}`);
  return Number(m[1]);
};

export const g = readNumber(/g = (\d+(?:\.\d+)?)/);
export const v0 = readNumber(/v0 = (\d+(?:\.\d+)?)/);

export type Case = (typeof episode.physics.cases)[number];
export const cases: Case[] = episode.physics.cases;
export const mainCase = cases.find((c) => 'is_main_case' in c && c.is_main_case)!;

const rad = (deg: number) => (deg * Math.PI) / 180;

// 与 JSON core_code 两行一致
export const position = (deg: number, t: number) => {
  const theta = rad(deg);
  const x = v0 * Math.cos(theta) * t;
  const y = v0 * Math.sin(theta) * t - 0.5 * g * t * t;
  return {x, y};
};

export const velocity = (deg: number, t: number) => {
  const theta = rad(deg);
  return {vx: v0 * Math.cos(theta), vy: v0 * Math.sin(theta) - g * t};
};

// y(t) = 0 的正根
export const flightTime = (deg: number) => (2 * v0 * Math.sin(rad(deg))) / g;
// vy(t) = 0 时的高度
export const maxHeight = (deg: number) => position(deg, (v0 * Math.sin(rad(deg))) / g).y;
export const range = (deg: number) => position(deg, flightTime(deg)).x;

const parseRange = (s: string) => {
  const [lo, hi] = s.split('至').map((p) => Number(p.trim()));
  return {lo, hi};
};
export const axes = {
  x: parseRange(episode.physics.axes.x_range_m),
  y: parseRange(episode.physics.axes.y_range_m),
  step: episode.physics.axes.grid_step_m,
};
