import React from 'react';
import {theme} from '../theme';

// 两种介质的分界面
export const Interface: React.FC<{x1: number; x2: number; y: number; opacity?: number}> = ({x1, x2, y, opacity = 1}) =>
  opacity <= 0 ? null : <line x1={x1} y1={y} x2={x2} y2={y} stroke={theme.axis} strokeWidth={3} opacity={opacity} />;
