import React from 'react';
import {alpha, fonts, theme} from '../theme';

// 左上 / 右上的小标签
export const Chip: React.FC<{
  opacity: number;
  left?: number;
  right?: number;
  top: number;
  color?: string;
  children: React.ReactNode;
}> = ({opacity, left, right, top, color = theme.textMuted, children}) =>
  opacity <= 0 ? null : (
    <div
      style={{
        position: 'absolute',
        left,
        right,
        top,
        opacity,
        padding: '6px 16px',
        borderRadius: 999,
        border: `2px solid ${alpha(color, 0.5)}`,
        background: alpha(theme.panel, 0.85),
        fontFamily: fonts.sans,
        fontSize: 24,
        fontWeight: 700,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );
