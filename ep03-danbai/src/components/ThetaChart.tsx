import React from 'react';
import {theta} from '../physics';
import {alpha, fonts, theme} from '../theme';

// θ(t) 曲线：和单摆同一个时钟，逐点由 θ0·cos(ωt) 算出
export const ThetaChart: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  t: number;
  tMax: number;
  L: number;
  theta0: number;
  color: string;
  opacity: number;
}> = ({x, y, w, h, t, tMax, L, theta0, color, opacity}) => {
  if (opacity <= 0) return null;
  const mid = y + h / 2;
  const amp = h / 2 - 14;
  const tt = Math.min(t, tMax);
  const n = Math.max(2, Math.round((tt / tMax) * 240));
  const d = Array.from({length: n + 1}, (_, i) => {
    const ti = (tt * i) / n;
    return `${i === 0 ? 'M' : 'L'} ${(x + (ti / tMax) * w).toFixed(2)} ${(mid - (theta(theta0, L, ti) / theta0) * amp).toFixed(2)}`;
  }).join(' ');
  const label = {fontFamily: fonts.mono, fontSize: 22, fill: theme.textMuted};
  return (
    <g opacity={opacity}>
      <line x1={x} y1={y} x2={x} y2={y + h} stroke={theme.axis} strokeWidth={3} />
      <line x1={x} y1={mid} x2={x + w + 10} y2={mid} stroke={theme.axis} strokeWidth={3} />
      <path d={`M ${x + w + 22} ${mid} l -14 -8 v 16 z`} fill={theme.axis} />
      {[1, -1].map((s) => (
        <g key={s}>
          <line x1={x} y1={mid - s * amp} x2={x + w} y2={mid - s * amp} stroke={alpha(theme.textMuted, 0.4)} strokeWidth={2} strokeDasharray="6 8" />
          <text x={x - 10} y={mid - s * amp + 8} textAnchor="end" style={label}>
            {s > 0 ? `+${theta0}°` : `−${theta0}°`}
          </text>
        </g>
      ))}
      <text x={x + w + 12} y={mid + 34} textAnchor="middle" style={{...label, fontFamily: fonts.math, fontStyle: 'italic', fontSize: 28}}>
        t
      </text>
      <text x={x + 10} y={y - 14} style={{...label, fontFamily: fonts.math, fontStyle: 'italic', fontSize: 28}}>
        θ
      </text>
      {t > 0 && <path d={d} fill="none" stroke={color} strokeWidth={5} strokeLinejoin="round" style={{filter: `drop-shadow(0 0 6px ${color})`}} />}
      <text x={x + w / 2} y={y + h + 44} textAnchor="middle" style={{fontFamily: fonts.math, fontSize: 30, fill: theme.text}}>
        θ(t) = θ₀ · cos(ωt)
      </text>
    </g>
  );
};
