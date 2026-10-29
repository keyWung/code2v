import React from 'react';
import {interpolateColors} from 'remotion';
import {cell, GRID} from '../layout';
import {alpha, fonts, theme} from '../theme';
import {Label} from './Arrow';
import {TITLE_H} from './Dipole';

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

export type Rule = {text: string; on: number; hl: number};

const Check: React.FC<{on: number}> = ({on}) => (
  <g>
    <circle r={15} fill={alpha(theme.traj60, on)} stroke={interpolateColors(on, [0, 1], [alpha(theme.textMuted, 0.5), theme.traj60])} strokeWidth={2.5} />
    {on > 0 && <path d="M -7 0.5 l 4.5 4.5 l 9 -9.5" fill="none" stroke={theme.bg} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" opacity={on} />}
  </g>
);

// 读图规则：讲到哪条就勾上哪条，冻结时五条全部打勾
export const RuleCard: React.FC<{rules: Rule[]}> = ({rules}) => (
  <g>
    {rules.map((r, i) => {
      const y = TITLE_H + 52 + i * 64;
      return (
        <g key={r.text}>
          {r.hl > 0 && <rect x={10} y={y - 30} width={GRID.w - 20} height={56} rx={12} fill={alpha(theme.accent, 0.12 * r.hl)} />}
          <g transform={`translate(38 ${y - 2})`}>
            <Check on={r.on} />
          </g>
          <text
            x={66}
            y={y + 8}
            style={{
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 25,
              fill: interpolateColors(r.on, [0, 1], [alpha(theme.textMuted, 0.6), r.hl > 0.5 ? theme.accent : theme.text]),
            }}
          >
            {r.text}
          </text>
        </g>
      );
    })}
  </g>
);
