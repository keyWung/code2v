import React from 'react';
import {GlidePath, pathAt, pathUntil, Pt} from '../physics';
import {polyline, project} from '../globe';
import {alpha} from '../theme';
import {Projectile} from './Projectile';
import {Trajectory} from './Trajectory';

// 地面投影 + 轨迹与投影之间的半透明“帘子”：斜着看时，侧向转弯靠它看出来
export const GroundTrack: React.FC<{pts: Pt[]; tilt: number; color: string; opacity: number}> = ({
  pts,
  tilt,
  color,
  opacity,
}) => {
  if (opacity <= 0 || pts.length < 2) return null;
  const ground = pts.map((p) => ({...p, h: 0}));
  const top = polyline(pts, tilt);
  const base = polyline([...ground].reverse(), tilt).replace(/^M/, 'L');
  return (
    <g opacity={opacity}>
      <path d={`${top} ${base} Z`} fill={alpha(color, 0.12)} />
      <path d={polyline(ground, tilt)} fill="none" stroke={alpha(color, 0.75)} strokeWidth={4} strokeDasharray="6 9" strokeLinecap="round" />
    </g>
  );
};

// 升力滑翔示意轨迹：画面小注写明是示意图、非真实比例与参数
export const GlideTrajectory: React.FC<{
  path: GlidePath;
  u: number;
  from?: number;
  tilt: number;
  color: string;
  opacity?: number;
  width?: number;
  glow?: number;
  dash?: string;
  head?: boolean;
  headOpacity?: number;
}> = ({path, u, from = 0, tilt, color, opacity = 1, width = 6, glow = 6, dash, head = true, headOpacity = 1}) => {
  if (opacity <= 0 || u <= from) return null;
  const pts = pathUntil(path, u, from);
  const shadow = Math.min(1, Math.sin(tilt) / 0.3);
  const p = pathAt(path, u);
  const a = project(p, tilt);
  const g = project({...p, h: 0}, tilt);
  return (
    <g opacity={opacity}>
      <GroundTrack pts={pts} tilt={tilt} color={color} opacity={shadow} />
      {head && shadow > 0 && p.h > 4 && (
        <line x1={a.x} y1={a.y} x2={g.x} y2={g.y} stroke={alpha(color, 0.4 * shadow * headOpacity)} strokeWidth={2} strokeDasharray="3 6" />
      )}
      <Trajectory d={polyline(pts, tilt)} color={color} width={width} glow={glow} dash={dash} />
      {head && <Projectile x={a.x} y={a.y} color={color} opacity={headOpacity} r={12} />}
    </g>
  );
};
