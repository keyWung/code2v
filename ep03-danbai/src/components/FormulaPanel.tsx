import React from 'react';
import {interpolateColors} from 'remotion';
import {SMALL_ANGLE_DEG} from '../physics';
import {alpha, fonts, theme} from '../theme';
import {PanelFrame} from './CodePanel';

const I: React.FC<{color?: string; children: React.ReactNode}> = ({color, children}) => (
  <i style={{fontStyle: 'italic', color}}>{children}</i>
);

// T = 2π√(L/g)：只有摆长和重力
export const Formula: React.FC<{hl: number; size?: number}> = ({hl, size = 70}) => {
  const c = interpolateColors(hl, [0, 1], [theme.text, theme.accent]);
  return (
    <div style={{display: 'flex', alignItems: 'center', fontFamily: fonts.math, fontSize: size, color: theme.text, whiteSpace: 'nowrap'}}>
      <I>T</I>
      <span style={{margin: '0 0.26em'}}>=</span>
      <span>2π</span>
      <span style={{fontSize: '1.37em', lineHeight: 1, marginLeft: '0.1em', transform: 'translateY(-0.06em)'}}>√</span>
      <span
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderTop: `${Math.round(size / 17)}px solid ${theme.text}`,
          padding: '0.08em 0.2em 0',
          fontSize: '0.77em',
          lineHeight: 1.05,
          marginTop: '0.12em',
        }}
      >
        <I color={c}>L</I>
        <span style={{alignSelf: 'stretch', height: Math.max(2, Math.round(size / 24)), background: theme.text, margin: '0.06em 0'}} />
        <I color={c}>g</I>
      </span>
    </div>
  );
};

export const FormulaPanel: React.FC<{opacity: number; hl: number; note: number}> = ({opacity, hl, note}) => {
  if (opacity <= 0) return null;
  return (
    <PanelFrame opacity={opacity} tabs={<div style={{fontFamily: fonts.sans, fontSize: 22, color: theme.text}}>周期公式（摆角 &lt; {SMALL_ANGLE_DEG}°）</div>}>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 40px', gap: 40}}>
        <Formula hl={hl} />
        <div style={{fontFamily: fonts.sans, fontSize: 28, fontWeight: 700, lineHeight: 1.55, color: theme.text, opacity: note}}>
          <div>
            只有 <span style={{color: theme.accent}}>摆长 L</span>、<span style={{color: theme.accent}}>重力 g</span>
          </div>
          <div style={{color: alpha(theme.textMuted, 0.95)}}>没有质量，没有振幅</div>
        </div>
      </div>
    </PanelFrame>
  );
};
