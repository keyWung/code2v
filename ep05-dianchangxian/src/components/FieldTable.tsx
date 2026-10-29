import React from 'react';
import {interpolateColors} from 'remotion';
import {alpha, fonts, theme} from '../theme';
import {PanelFrame, Tab} from './CodePanel';

export type FieldRow = {key: string; r: string; e: string; ratio: string; show: number};

const COLS = [180, 360, 244];
const HEAD = ['距离 r', '场强 E', '和 0.1 m 处比'];

// 镜 4：E = kQ / r² 的运行结果；hl 高亮最后一列“只剩几分之几”
export const FieldTable: React.FC<{opacity: number; tab: string; rows: FieldRow[]; hl: number}> = ({opacity, tab, rows, hl}) => {
  if (opacity <= 0) return null;
  const left = (i: number) => COLS.slice(0, i).reduce((a, b) => a + b, 0);
  const cell = (i: number, content: React.ReactNode, style: React.CSSProperties) => (
    <div key={i} style={{position: 'absolute', left: left(i), width: COLS[i], textAlign: i === 0 ? 'left' : 'center', ...style}}>
      {content}
    </div>
  );
  return (
    <PanelFrame opacity={opacity} tabs={<Tab label={tab} active />}>
      <div style={{position: 'absolute', inset: '8px 28px', fontFamily: fonts.sans}}>
        {hl > 0 && (
          <div
            style={{position: 'absolute', left: left(2) + 6, width: COLS[2] - 12, top: 0, height: 40 + 52 * rows.length, borderRadius: 10, background: alpha(theme.accent, 0.13 * hl)}}
          />
        )}
        <div style={{position: 'relative', height: 40, fontSize: 22, color: theme.textMuted, display: 'flex', alignItems: 'center'}}>
          {HEAD.map((h, i) => cell(i, h, {}))}
        </div>
        {rows.map((r) => (
          <div key={r.key} style={{position: 'relative', height: 52, fontSize: 30, fontWeight: 800, opacity: r.show, display: 'flex', alignItems: 'center'}}>
            {cell(0, r.r, {color: theme.text})}
            {cell(1, `${r.e} N/C`, {color: theme.text, fontFamily: fonts.math})}
            {cell(2, r.ratio, {color: interpolateColors(hl, [0, 1], [theme.text, theme.accent])})}
          </div>
        ))}
      </div>
    </PanelFrame>
  );
};
