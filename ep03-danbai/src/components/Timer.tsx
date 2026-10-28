import React from 'react';
import {alpha, fonts, theme} from '../theme';

// 计时器：字号固定，只换数字
export const Timer: React.FC<{
  opacity: number;
  top: number;
  left?: number;
  right?: number;
  label: string;
  value: string;
  unit: string;
  color?: string;
}> = ({opacity, top, left, right, label, value, unit, color = theme.text}) =>
  opacity <= 0 ? null : (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        right,
        opacity,
        padding: '10px 20px',
        borderRadius: 18,
        background: alpha(theme.panel, 0.92),
        border: `2px solid ${theme.panelBorder}`,
        display: 'flex',
        alignItems: 'baseline',
        gap: 12,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{fontFamily: fonts.sans, fontSize: 24, color: theme.textMuted}}>{label}</span>
      <span style={{fontFamily: fonts.mono, fontSize: 40, fontWeight: 700, color}}>{value}</span>
      <span style={{fontFamily: fonts.sans, fontSize: 24, color: theme.textMuted}}>{unit}</span>
    </div>
  );
