import React from 'react';
import type {Pt} from '../physics';
import {BALL_R, ROAD_W} from '../layout';
import {alpha, roles, theme} from '../theme';

// 圆轨迹：road 为 1 时画成弯道（镜 1），为 0 时是细线轨迹；radius 画出圆心到物体的半径虚线
export const CircularOrbit: React.FC<{
  c: Pt;
  rPx: number;
  p?: Pt;
  road?: number;
  radius?: number;
  radiusColor?: string;
  ball?: number;
  opacity?: number;
}> = ({c, rPx, p, road = 0, radius = 0, radiusColor = theme.textMuted, ball = 1, opacity = 1}) => {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      {road > 0 && (
        <g opacity={road}>
          <circle cx={c.x} cy={c.y} r={rPx} fill="none" stroke={roles.road} strokeWidth={ROAD_W} />
          {[-1, 1].map((s) => (
            <circle key={s} cx={c.x} cy={c.y} r={rPx + (s * ROAD_W) / 2} fill="none" stroke={alpha(theme.textMuted, 0.4)} strokeWidth={2} />
          ))}
          <circle cx={c.x} cy={c.y} r={rPx} fill="none" stroke={alpha(theme.textMuted, 0.45)} strokeWidth={2} strokeDasharray="14 14" />
        </g>
      )}
      {road < 1 && <circle cx={c.x} cy={c.y} r={rPx} fill="none" stroke={alpha(roles.orbit, 0.55)} strokeWidth={3} opacity={1 - road} />}
      {p && radius > 0 && (
        <line x1={c.x} y1={c.y} x2={p.x} y2={p.y} stroke={alpha(radiusColor, 0.75)} strokeWidth={3} strokeDasharray="10 9" opacity={radius} />
      )}
      <circle cx={c.x} cy={c.y} r={6} fill={theme.text} opacity={Math.max(1 - road, radius)} />
      {p && ball > 0 && <circle cx={p.x} cy={p.y} r={BALL_R} fill={roles.body} stroke={alpha(theme.bg, 0.6)} strokeWidth={3} opacity={ball} />}
    </g>
  );
};
