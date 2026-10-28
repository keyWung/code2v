import React from 'react';
import {position, velocity} from '../physics';
import {toScreen} from '../layout';
import {fonts, theme} from '../theme';

// 每 1 m/s 画多长
const K = 5.5;
const HEAD = 16;

const Arrow: React.FC<{x1: number; y1: number; x2: number; y2: number; color: string}> = ({
  x1,
  y1,
  x2,
  y2,
  color,
}) => {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 6) return null;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const bx = x2 - ux * HEAD;
  const by = y2 - uy * HEAD;
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={5} strokeLinecap="round" />
      <path
        d={`M ${x2} ${y2} L ${bx - uy * 9} ${by + ux * 9} L ${bx + uy * 9} ${by - ux * 9} Z`}
        fill={color}
      />
    </g>
  );
};

const Label: React.FC<{x: number; y: number; sub: string; color: string; anchor?: 'start' | 'end'}> = ({
  x,
  y,
  sub,
  color,
  anchor = 'start',
}) => (
  <text x={x} y={y} textAnchor={anchor} style={{fontFamily: fonts.math, fontStyle: 'italic', fontSize: 34, fill: color}}>
    v
    <tspan dy={8} style={{fontSize: 22}}>
      {sub}
    </tspan>
  </text>
);

export const VelocityVector: React.FC<{deg: number; t: number; opacity?: number}> = ({deg, t, opacity = 1}) => {
  if (opacity <= 0) return null;
  const {x, y} = position(deg, t);
  const {vx, vy} = velocity(deg, t);
  const {sx, sy} = toScreen(x, Math.max(0, y));
  const hx = sx + vx * K;
  const vyTip = sy - vy * K;
  return (
    <g opacity={opacity}>
      <Arrow x1={sx} y1={sy} x2={hx} y2={sy} color={theme.text} />
      <Arrow x1={sx} y1={sy} x2={sx} y2={vyTip} color={theme.accent} />
      <Label x={hx + 8} y={sy + 10} sub="x" color={theme.text} />
      {Math.abs(vy * K) > 24 && (
        <Label x={sx - 12} y={vy > 0 ? vyTip + 18 : vyTip} sub="y" color={theme.accent} anchor="end" />
      )}
    </g>
  );
};
