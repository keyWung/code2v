import React from 'react';
import {interpolateColors} from 'remotion';
import {alpha, fonts, theme} from '../theme';
import {PanelFrame, Tab} from './CodePanel';

export type ResultRow = {key: string; r: string; omega: string; a: string; period: string; show: number};

const COLS = [150, 210, 224, 200];
const HEAD = ['半径 r', '角速度 ω', '向心加速度 a', '周期 T'];

// 镜 4：两行代码的运行结果；hl 高亮 a 那一列
export const ResultTable: React.FC<{opacity: number; tab: string; rows: ResultRow[]; hl: number}> = ({opacity, tab, rows, hl}) => {
  if (opacity <= 0) return null;
  const left = (i: number) => COLS.slice(0, i).reduce((a, b) => a + b, 0);
  const cell = (i: number, content: React.ReactNode, style: React.CSSProperties) => (
    <div key={i} style={{position: 'absolute', left: left(i), width: COLS[i], textAlign: i === 0 ? 'left' : 'center', ...style}}>
      {content}
    </div>
  );
  return (
    <PanelFrame opacity={opacity} tabs={<Tab label={tab} active />}>
      <div style={{position: 'absolute', inset: '10px 28px', fontFamily: fonts.sans}}>
        {hl > 0 && (
          <div
            style={{position: 'absolute', left: left(2) + 6, width: COLS[2] - 12, top: 0, height: 44 + 62 * rows.length, borderRadius: 10, background: alpha(theme.accent, 0.13 * hl)}}
          />
        )}
        <div style={{position: 'relative', height: 44, fontSize: 22, color: theme.textMuted, display: 'flex', alignItems: 'center'}}>
          {HEAD.map((h, i) => cell(i, h, {}))}
        </div>
        {rows.map((r) => (
          <div key={r.key} style={{position: 'relative', height: 62, fontSize: 32, fontWeight: 800, opacity: r.show, display: 'flex', alignItems: 'center'}}>
            {cell(0, r.r, {color: theme.text})}
            {cell(1, r.omega, {color: theme.text})}
            {cell(2, r.a, {color: interpolateColors(hl, [0, 1], [theme.text, theme.accent]), fontSize: 36})}
            {cell(3, r.period, {color: theme.text})}
          </div>
        ))}
      </div>
    </PanelFrame>
  );
};
