import React from 'react';
import {alpha, roles} from '../theme';

// 摆线：画到 progress 为止，用于镜 2 先画线、再挂球
export const StringLine: React.FC<{x1: number; y1: number; x2: number; y2: number; progress?: number; opacity?: number}> = ({
  x1,
  y1,
  x2,
  y2,
  progress = 1,
  opacity = 1,
}) =>
  progress <= 0 || opacity <= 0 ? null : (
    <line
      x1={x1}
      y1={y1}
      x2={x1 + (x2 - x1) * progress}
      y2={y1 + (y2 - y1) * progress}
      stroke={alpha(roles.string, 0.9)}
      strokeWidth={3}
      strokeLinecap="round"
      opacity={opacity}
    />
  );
