import React from 'react';
import {ZONE} from '../layout';
import {alpha, fonts, theme} from '../theme';

const Row: React.FC<{label: string; value: string; unit: string}> = ({label, value, unit}) => (
  <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', height: 44}}>
    <span style={{fontFamily: fonts.sans, fontSize: 26, color: theme.textMuted}}>{label}</span>
    <span style={{fontFamily: fonts.mono, fontSize: 34, fontWeight: 700, color: theme.text}}>
      {value}
      <span style={{fontFamily: fonts.sans, fontSize: 24, color: theme.textMuted, marginLeft: 6}}>{unit}</span>
    </span>
  </div>
);

// 计数器显示的是模拟时间，不是画面实际经过的秒数
export const Counter: React.FC<{t: number; x: number; y: number; opacity: number}> = ({t, x, y, opacity}) => {
  if (opacity <= 0) return null;
  const {top, right, width} = ZONE.counter;
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: right - width,
        width,
        opacity,
        padding: '14px 22px 10px',
        borderRadius: 18,
        background: alpha(theme.panel, 0.92),
        border: `2px solid ${theme.panelBorder}`,
        boxSizing: 'border-box',
      }}
    >
      <div style={{fontFamily: fonts.sans, fontSize: 22, color: theme.accent, marginBottom: 4}}>模拟时间 · 慢放</div>
      <Row label="t" value={t.toFixed(2)} unit="秒" />
      <Row label="高度" value={Math.max(0, y).toFixed(1)} unit="米" />
      <Row label="水平距离" value={x.toFixed(1)} unit="米" />
    </div>
  );
};
