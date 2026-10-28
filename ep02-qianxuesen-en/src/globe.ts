import {GLOBE} from './layout';
import type {Pt} from './physics';

const {cx, cy, R} = GLOBE;

// 俯视时整体上移，让发射点、落点的屏幕高度基本不变
const LIFT = 648;
export const TILT_MAX = (40 * Math.PI) / 180;

export const lift = (tilt: number) => LIFT * (1 - Math.cos(tilt));
// 投影后地球轮廓（正交投影下始终是圆）
export const limb = (tilt: number) => ({cx, cy: cy - lift(tilt), r: R});

// 正交投影：tilt = 0 是正侧面剖面，tilt > 0 从斜上方看，侧向偏移才看得出来
export const projectXYZ = (X: number, Y: number, Z: number, tilt: number) => ({
  x: cx + X,
  y: cy - (Y * Math.cos(tilt) - Z * Math.sin(tilt)) - lift(tilt),
});

export const toXYZ = (p: Pt) => {
  const th = p.s / R;
  const be = p.l / R;
  const r = R + p.h;
  return {X: r * Math.sin(th) * Math.cos(be), Y: r * Math.cos(th) * Math.cos(be), Z: r * Math.sin(be)};
};

export const project = (p: Pt, tilt: number) => {
  const {X, Y, Z} = toXYZ(p);
  return projectXYZ(X, Y, Z, tilt);
};

export const polyline = (pts: Pt[], tilt: number) =>
  pts
    .map((p, i) => {
      const {x, y} = project(p, tilt);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

// 该点“离地向上”在屏幕上的单位方向
export const upDir = (p: Pt, tilt: number) => {
  const a = project(p, tilt);
  const b = project({...p, h: p.h + 10}, tilt);
  const n = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return {x: (b.x - a.x) / n, y: (b.y - a.y) / n};
};
