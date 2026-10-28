import React from 'react';
import {interpolateColors} from 'remotion';
import {alpha, fonts, theme} from '../theme';
import {PanelFrame, Tab} from './CodePanel';

export type IndexRow = {name: string; color: string; n: number; speed: string; theta2: string; show: number};

const COLS = [150, 170, 270, 196];
const HEAD = ['介质', '折射率 n', '光速', '折射角 θ2'];

// 镜 4：同样 45° 入射，水和玻璃的运行结果；hl 依次高亮折射率、光速、折射角三列
export const IndexTable: React.FC<{opacity: number; tab: string; rows: IndexRow[]; hl: [number, number, number]; footer: number}> = ({
  opacity,
  tab,
  rows,
  hl,
  footer,
}) => {
  if (opacity <= 0) return null;
  const colHl = [0, ...hl];
  const left = (i: number) => COLS.slice(0, i).reduce((a, b) => a + b, 0);
  const cell = (i: number, content: React.ReactNode, style: React.CSSProperties) => (
    <div key={i} style={{position: 'absolute', left: left(i), width: COLS[i], textAlign: i === 0 ? 'left' : 'center', ...style}}>
      {content}
    </div>
  );
  const parts = ['折射率越大', '速度越慢', '拐得越多'];
  return (
    <PanelFrame opacity={opacity} tabs={<Tab label={tab} active />}>
      <div style={{position: 'absolute', inset: '8px 28px', fontFamily: fonts.sans}}>
        {colHl.map((h, i) =>
          h > 0 ? (
            <div
              key={`band-${i}`}
              style={{position: 'absolute', left: left(i) + 6, width: COLS[i] - 12, top: 0, height: 40 + 52 * rows.length, borderRadius: 10, background: alpha(theme.accent, 0.13 * h)}}
            />
          ) : null,
        )}
        <div style={{position: 'relative', height: 40, fontSize: 22, color: theme.textMuted, display: 'flex', alignItems: 'center'}}>
          {HEAD.map((h, i) => cell(i, h, {}))}
        </div>
        {rows.map((r) => (
          <div key={r.name} style={{position: 'relative', height: 52, fontSize: 30, fontWeight: 800, opacity: r.show, display: 'flex', alignItems: 'center'}}>
            {cell(0, r.name, {color: r.color})}
            {[r.n, r.speed, r.theta2].map((v, j) =>
              cell(j + 1, v, {color: interpolateColors(hl[j], [0, 1], [theme.text, theme.accent]), fontSize: j === 1 ? 26 : 30}),
            )}
          </div>
        ))}
        <div style={{position: 'relative', height: 46, display: 'flex', alignItems: 'center', fontSize: 28, fontWeight: 800, color: theme.text, opacity: footer}}>
          {parts.map((p, i) => (
            <React.Fragment key={p}>
              {i > 0 && <span style={{color: theme.textMuted, margin: '0 14px'}}>→</span>}
              <span style={{color: interpolateColors(hl[i], [0, 1], [theme.textMuted, theme.accent])}}>{p}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </PanelFrame>
  );
};
