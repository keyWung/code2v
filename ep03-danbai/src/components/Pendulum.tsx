import React from 'react';
import {DRAW_GAIN, SMALL_ANGLE_DEG} from '../physics';
import {alpha, theme} from '../theme';
import {AngleArc} from './AngleArc';
import {Bob} from './Bob';
import {StringLine} from './String';

const rad = (d: number) => (d * Math.PI) / 180;

export const bobPosition = (x: number, pivotY: number, lengthPx: number, thetaDeg: number) => {
  const a = rad(thetaDeg * DRAW_GAIN);
  return {x: x + lengthPx * Math.sin(a), y: pivotY + lengthPx * Math.cos(a)};
};

// 天花板：一条横梁加斜线
export const Mount: React.FC<{x1: number; x2: number; y: number; opacity?: number}> = ({x1, x2, y, opacity = 1}) =>
  opacity <= 0 ? null : (
    <g opacity={opacity}>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={theme.axis} strokeWidth={4} strokeLinecap="round" />
      {Array.from({length: Math.floor((x2 - x1) / 22)}, (_, i) => (
        <line key={i} x1={x1 + 10 + i * 22} y1={y} x2={x1 + 22 + i * 22} y2={y - 12} stroke={alpha(theme.textMuted, 0.6)} strokeWidth={2} />
      ))}
    </g>
  );

// 单摆：角度由 θ(t) 算出后传进来，这里只负责画
export const Pendulum: React.FC<{
  x: number;
  pivotY: number;
  lengthPx: number;
  thetaDeg: number;
  bobR: number;
  color: string;
  opacity?: number;
  stringProgress?: number;
  bobScale?: number;
  swingDeg?: number;
  arc?: {thetaDeg: number; label: string; opacity: number; radius?: number};
}> = ({x, pivotY, lengthPx, thetaDeg, bobR, color, opacity = 1, stringProgress = 1, bobScale = 1, swingDeg, arc}) => {
  if (opacity <= 0) return null;
  const b = bobPosition(x, pivotY, lengthPx, thetaDeg);
  const swing = swingDeg === undefined ? null : rad(swingDeg * DRAW_GAIN);
  return (
    <g opacity={opacity}>
      {swing !== null && (
        <path
          d={`M ${x - lengthPx * Math.sin(swing)} ${pivotY + lengthPx * Math.cos(swing)} A ${lengthPx} ${lengthPx} 0 0 0 ${x + lengthPx * Math.sin(swing)} ${pivotY + lengthPx * Math.cos(swing)}`}
          fill="none"
          stroke={alpha(color, 0.35)}
          strokeWidth={3}
          strokeDasharray="6 8"
        />
      )}
      {arc && <AngleArc x={x} y={pivotY} length={lengthPx} thetaDeg={arc.thetaDeg} label={arc.label} opacity={arc.opacity} radius={arc.radius} />}
      <StringLine x1={x} y1={pivotY} x2={b.x} y2={b.y} progress={stringProgress} />
      <circle cx={x} cy={pivotY} r={6} fill={theme.axis} />
      {stringProgress >= 1 && <Bob x={b.x} y={b.y} r={bobR} color={color} scale={bobScale} />}
    </g>
  );
};

export const smallAngleLabel = (deg: number) => `θ₀ = ${deg}°（< ${SMALL_ANGLE_DEG}°）`;
