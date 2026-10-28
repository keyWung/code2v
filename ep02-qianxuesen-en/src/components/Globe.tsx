import React from 'react';
import {GLOBE, GLOBE_FADE, H, W} from '../layout';
import {limb, projectXYZ} from '../globe';
import {alpha, theme} from '../theme';

export const GLOBE_MASK = 'url(#globe-fade)';

// 地球只在舞台里显示：左右和下沿渐隐，不压右侧互动区和下方面板
export const GlobeDefs: React.FC = () => {
  const {left, right, bottom} = GLOBE_FADE;
  const stop = (at: number, total: number, a: number) => (
    <stop key={at} offset={at / total} stopColor={theme.text} stopOpacity={a} />
  );
  return (
    <defs>
      <linearGradient id="globe-fade-x" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={W} y2={0}>
        {stop(left[0], W, 0)}
        {stop(left[1], W, 1)}
        {stop(right[0], W, 1)}
        {stop(right[1], W, 0)}
      </linearGradient>
      <linearGradient id="globe-fade-y" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={H}>
        {stop(bottom[0], H, 1)}
        {stop(bottom[1], H, 0)}
      </linearGradient>
      <mask id="globe-fade-y-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
        <rect x={0} y={0} width={W} height={H} fill="url(#globe-fade-y)" />
      </mask>
      <mask id="globe-fade" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
        <g mask="url(#globe-fade-y-mask)">
          <rect x={0} y={0} width={W} height={H} fill="url(#globe-fade-x)" />
        </g>
      </mask>
      <linearGradient id="globe-fill" x1={0} y1={0} x2={0} y2={1}>
        <stop offset={0} stopColor={theme.grid} />
        <stop offset={0.25} stopColor={theme.panel} />
      </linearGradient>
    </defs>
  );
};

const deg = Math.PI / 180;

// 经线：过 X 轴的大圆，正面那一半可见
const meridian = (lam: number, tilt: number) => {
  if (Math.sin(lam + tilt) <= 0.02) return null;
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const a = (Math.PI * i) / 120;
    const {x, y} = projectXYZ(GLOBE.R * Math.cos(a), GLOBE.R * Math.sin(a) * Math.cos(lam), GLOBE.R * Math.sin(a) * Math.sin(lam), tilt);
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(' ');
};

export const Globe: React.FC<{tilt: number; opacity?: number}> = ({tilt, opacity = 1}) => {
  if (opacity <= 0) return null;
  const c = limb(tilt);
  // key 用经度：各条经线起点相同，用路径前缀当 key 会撞车，React 会留下上一帧的旧线
  const meridians: {lam: number; d: string}[] = [];
  for (let lam = -80; lam <= 170; lam += 10) {
    const d = meridian(lam * deg, tilt);
    if (d) meridians.push({lam, d});
  }
  return (
    <g opacity={opacity} mask={GLOBE_MASK}>
      {[34, 22, 12, 5].map((dr, i) => (
        <circle key={dr} cx={c.cx} cy={c.cy} r={c.r + dr} fill="none" stroke={alpha(theme.traj45, 0.05 + i * 0.05)} strokeWidth={10} />
      ))}
      <circle cx={c.cx} cy={c.cy} r={c.r} fill="url(#globe-fill)" />
      <g stroke={alpha(theme.traj45, 0.16)} strokeWidth={2} fill="none">
        {meridians.map(({lam, d}) => (
          <path key={lam} d={d} />
        ))}
        {[30, 45, 60, 75, 90, 105, 120, 135, 150].map((a) => {
          const x = c.cx + c.r * Math.cos(a * deg);
          const half = c.r * Math.sin(a * deg);
          return <line key={a} x1={x} y1={c.cy - half} x2={x} y2={c.cy + half} />;
        })}
      </g>
      <circle cx={c.cx} cy={c.cy} r={c.r} fill="none" stroke={alpha(theme.traj45, 0.7)} strokeWidth={3} />
    </g>
  );
};
