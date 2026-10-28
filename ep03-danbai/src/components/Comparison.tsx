import React from 'react';
import {Case} from '../physics';
import {alpha, fonts, theme} from '../theme';
import {PanelFrame} from './CodePanel';

export type RunRow = {name: string; color: string; swings: number; period: string; periodOpacity: number};

// 镜 3、镜 4 的运行输出：同一个时钟下，各自来回了几次、周期多少
export const RunPanel: React.FC<{
  opacity: number;
  t: number;
  rows: RunRow[];
  footer: React.ReactNode;
  footerOpacity: number;
}> = ({opacity, t, rows, footer, footerOpacity}) => {
  if (opacity <= 0) return null;
  return (
    <PanelFrame
      opacity={opacity}
      tabs={
        <div style={{display: 'flex', alignItems: 'baseline', gap: 16, fontFamily: fonts.sans, fontSize: 22, color: theme.text}}>
          运行输出
          <span style={{fontFamily: fonts.mono, color: theme.textMuted}}>t = {t.toFixed(1).padStart(4, ' ')} s</span>
        </div>
      }
    >
      <div style={{position: 'absolute', inset: 0, padding: '10px 28px', fontFamily: fonts.sans, fontSize: 28, color: theme.text}}>
        {rows.map((r) => (
          <div key={r.name} style={{display: 'grid', gridTemplateColumns: '260px 220px 1fr', alignItems: 'baseline', height: 54}}>
            <span style={{fontWeight: 800, color: r.color}}>{r.name}</span>
            <span>
              来回 <span style={{fontFamily: fonts.mono, fontWeight: 700}}>{String(r.swings).padStart(2, ' ')}</span> 次
            </span>
            <span style={{opacity: r.periodOpacity}}>
              周期 <span style={{fontWeight: 800, color: theme.accent}}>{r.period}</span>
            </span>
          </div>
        ))}
        <div style={{marginTop: 6, fontSize: 28, fontWeight: 800, opacity: footerOpacity}}>{footer}</div>
      </div>
    </PanelFrame>
  );
};

const ROW_H = 132;

// 镜 5 三组数字：摆长 ×4，周期只 ×2
export const PeriodTable: React.FC<{
  x: number;
  y: number;
  w: number;
  rows: {c: Case; color: string; show: number}[];
  arrows: number;
}> = ({x, y, w, rows, arrows}) => {
  const colL = x + 50;
  const colT = x + w - 196;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', fontFamily: fonts.sans}}>
      <div style={{position: 'absolute', left: colL - 10, top: y, fontSize: 26, color: theme.textMuted, opacity: rows[0]?.show ?? 0}}>摆长 L</div>
      <div style={{position: 'absolute', left: colT, top: y, fontSize: 26, color: theme.textMuted, opacity: rows[0]?.show ?? 0}}>周期 T（g 取 10）</div>
      {rows.map((r, i) => (
        <div key={r.c.length_m} style={{position: 'absolute', left: x, top: y + 50 + i * ROW_H, width: w, height: ROW_H - 18, opacity: r.show}}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 18,
              background: alpha(r.color, 0.08),
              border: `2px solid ${alpha(r.color, 0.45)}`,
            }}
          />
          <div style={{position: 'absolute', left: colL - x, top: 26, fontSize: 40, fontWeight: 900, color: r.color}}>{r.c.length_m} 米</div>
          <div style={{position: 'absolute', left: colT - x, top: 12, fontFamily: fonts.mono, fontSize: 40, fontWeight: 700, color: theme.text}}>
            {r.c.period_s.toFixed(2)} 秒
          </div>
          <div style={{position: 'absolute', left: colT - x, top: 62, fontSize: 30, fontWeight: 800, color: theme.accent}}>{r.c.display_period}</div>
        </div>
      ))}
      {[0, 1].map((i) => {
        const top = y + 50 + i * ROW_H + ROW_H / 2 - 10;
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: x - 70, top: top + 20, fontSize: 32, fontWeight: 900, color: theme.text, opacity: arrows}}>×4</div>
            <div style={{position: 'absolute', left: x + w + 14, top: top + 20, fontSize: 32, fontWeight: 900, color: theme.accent, opacity: arrows}}>×2</div>
            <svg style={{position: 'absolute', left: x - 34, top, overflow: 'visible'}} width={30} height={ROW_H} opacity={arrows}>
              <path d={`M 26 4 Q 2 ${ROW_H / 2} 26 ${ROW_H - 4}`} fill="none" stroke={theme.text} strokeWidth={4} />
              <path d={`M 26 ${ROW_H - 4} l -12 -2 l 7 -10 z`} fill={theme.text} />
            </svg>
            <svg style={{position: 'absolute', left: x + w + 4, top, overflow: 'visible'}} width={30} height={ROW_H} opacity={arrows}>
              <path d={`M 4 4 Q 28 ${ROW_H / 2} 4 ${ROW_H - 4}`} fill="none" stroke={theme.accent} strokeWidth={4} />
              <path d={`M 4 ${ROW_H - 4} l 12 -2 l -7 -10 z`} fill={theme.accent} />
            </svg>
          </React.Fragment>
        );
      })}
    </div>
  );
};
