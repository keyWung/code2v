import React from 'react';
import {alpha, fonts, roles, theme} from '../theme';
import {PanelFrame} from './CodePanel';

const BAR_W = 340;

const Row: React.FC<{name: string; color: string; frac: number; note: string; noteOpacity: number}> = ({
  name,
  color,
  frac,
  note,
  noteOpacity,
}) => (
  <div style={{display: 'flex', alignItems: 'center', height: 78, gap: 20}}>
    <div style={{width: 150, fontFamily: fonts.sans, fontSize: 30, fontWeight: 800, color}}>{name}</div>
    <div style={{position: 'relative', width: BAR_W, height: 30, borderRadius: 15, background: alpha(theme.textMuted, 0.14)}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: BAR_W * frac,
          borderRadius: 15,
          background: color,
          boxShadow: `0 0 16px ${alpha(color, 0.6)}`,
        }}
      />
    </div>
    <div style={{fontFamily: fonts.sans, fontSize: 26, fontWeight: 700, color: theme.text, opacity: noteOpacity}}>{note}</div>
  </div>
);

// 从被雷达发现到到达之间留给反应的时间；只比长短，不标数字
export const ReactionPanel: React.FC<{
  opacity: number;
  f: number;
  seen: {ballistic: number; glide: number};
  arrive: number;
}> = ({opacity, f, seen, arrive}) => {
  if (opacity <= 0) return null;
  const longest = arrive - Math.min(seen.ballistic, seen.glide);
  const frac = (from: number) => Math.max(0, Math.min(f, arrive) - from) / longest;
  const done = Math.max(0, Math.min(1, (f - arrive) / 10));
  return (
    <PanelFrame
      opacity={opacity}
      tabs={<div style={{fontFamily: fonts.sans, fontSize: 22, color: theme.text}}>From detection to arrival: time to react (schematic)</div>}
    >
      <div style={{position: 'absolute', inset: 0, padding: '20px 28px'}}>
        <Row name="High arc" color={roles.ballistic} frac={frac(seen.ballistic)} note="Seen early · long" noteOpacity={done} />
        <Row name="Low glide" color={roles.glide} frac={frac(seen.glide)} note="Seen late · short" noteOpacity={done} />
      </div>
    </PanelFrame>
  );
};
