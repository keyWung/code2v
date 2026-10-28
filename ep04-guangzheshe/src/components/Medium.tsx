import React from 'react';
import {alpha, fonts, theme} from '../theme';

// 一种介质：浅色填充的区域
export const Medium: React.FC<{x1: number; x2: number; y1: number; y2: number; color: string; opacity?: number}> = ({
  x1,
  x2,
  y1,
  y2,
  color,
  opacity = 1,
}) =>
  opacity <= 0 ? null : (
    <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill={alpha(color, 0.16)} opacity={opacity} />
  );

// 介质名称 + 折射率（近似值），下面一行可带光速
export const MediumLabel: React.FC<{
  x: number;
  y: number;
  color: string;
  name: string;
  n: number;
  speed?: string;
  speedOpacity?: number;
  anchor?: 'start' | 'end';
  size?: number;
  opacity?: number;
}> = ({x, y, color, name, n, speed, speedOpacity = 0, anchor = 'start', size = 30, opacity = 1}) =>
  opacity <= 0 ? null : (
    <g opacity={opacity} style={{fontFamily: fonts.sans, paintOrder: 'stroke', stroke: alpha(theme.bg, 0.85), strokeWidth: 6, strokeLinejoin: 'round'}}>
      <text x={x} y={y} textAnchor={anchor} style={{fontSize: size, fontWeight: 800, fill: color}}>
        {name}
        <tspan dx={12} style={{fontFamily: fonts.math, fontStyle: 'italic', fontWeight: 400}}>
          n
        </tspan>
        <tspan style={{fontWeight: 700}}> ≈ {n}</tspan>
      </text>
      {speed && speedOpacity > 0 && (
        <text x={x} y={y + size + 6} textAnchor={anchor} opacity={speedOpacity} style={{fontSize: size * 0.8, fontWeight: 700, fill: theme.textMuted}}>
          光速{speed}
        </text>
      )}
    </g>
  );
