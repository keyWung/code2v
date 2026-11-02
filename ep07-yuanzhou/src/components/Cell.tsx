import React from 'react';
import {interpolateColors} from 'remotion';
import {cell, GRID, TITLE_H} from '../layout';
import {alpha, theme} from '../theme';
import {Label} from './Arrow';

// 镜 5 的一格：标题栏 + 只在格子里显示的内容（坐标以格子左上角为原点）
export const Cell: React.FC<{index: number; title: string; opacity: number; lit: number; hl?: number; children?: React.ReactNode}> = ({
  index,
  title,
  opacity,
  lit,
  hl = 0,
  children,
}) => {
  if (opacity <= 0) return null;
  const {left, top} = cell(index);
  const id = `cell-clip-${index}`;
  return (
    <g opacity={opacity} transform={`translate(${left} ${top})`}>
      <defs>
        <clipPath id={id}>
          <rect x={0} y={TITLE_H} width={GRID.w} height={GRID.h - TITLE_H} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={GRID.w} height={GRID.h} rx={18} fill={alpha(theme.panel, 0.92)} />
      <g clipPath={`url(#${id})`}>{children}</g>
      <line x1={0} y1={TITLE_H} x2={GRID.w} y2={TITLE_H} stroke={theme.panelBorder} strokeWidth={2} />
      <rect
        x={1}
        y={1}
        width={GRID.w - 2}
        height={GRID.h - 2}
        rx={18}
        fill="none"
        stroke={interpolateColors(hl, [0, 1], [theme.panelBorder, theme.accent])}
        strokeWidth={2 + 2 * hl}
      />
      <Label x={22} y={43} color={interpolateColors(lit, [0, 1], [theme.textMuted, theme.text])} size={27}>
        {title}
      </Label>
    </g>
  );
};
