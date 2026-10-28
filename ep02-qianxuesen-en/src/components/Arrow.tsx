import React from 'react';
import {alpha, fonts, theme} from '../theme';

const HEAD = 16;

export const Arrow: React.FC<{x1: number; y1: number; x2: number; y2: number; color: string; width?: number}> = ({
  x1,
  y1,
  x2,
  y2,
  color,
  width = 5,
}) => {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 6) return null;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const bx = x2 - ux * HEAD;
  const by = y2 - uy * HEAD;
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <path d={`M ${x2} ${y2} L ${bx - uy * 9} ${by + ux * 9} L ${bx + uy * 9} ${by - ux * 9} Z`} fill={color} />
    </g>
  );
};

export const Label: React.FC<{
  x: number;
  y: number;
  color: string;
  size?: number;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
  opacity?: number;
  children: React.ReactNode;
}> = ({x, y, color, size = 28, anchor = 'start', weight = 800, opacity = 1, children}) =>
  opacity <= 0 ? null : (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      opacity={opacity}
      style={{
        fontFamily: fonts.sans,
        fontWeight: weight,
        fontSize: size,
        fill: color,
        stroke: alpha(theme.bg, 0.85),
        strokeWidth: 6,
        strokeLinejoin: 'round',
        paintOrder: 'stroke',
      }}
    >
      {children}
    </text>
  );
