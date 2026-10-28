import React from 'react';
import {alpha, roles, theme} from '../theme';
import {LightRay} from './LightRay';

// 光纤示意：一根细长的玻璃丝，光贴着内壁一次次全反射往前走（只做示意，不画内部结构）
const X0 = 40;
const X1 = 780;
const CY = 74;
const HALF = 30;
const SLOPE = Math.tan((18 * Math.PI) / 180);

const zigzag = () => {
  const pts = [{x: X0, y: CY}];
  let x = X0 + HALF / SLOPE;
  let up = true;
  while (x < X1) {
    pts.push({x, y: CY + (up ? -HALF : HALF)});
    x += (2 * HALF) / SLOPE;
    up = !up;
  }
  const last = pts[pts.length - 1];
  pts.push({x: X1, y: last.y + (up ? -1 : 1) * (X1 - last.x) * SLOPE});
  return pts;
};
const PATH = zigzag();
const SEG = PATH.slice(1).map((p, i) => Math.hypot(p.x - PATH[i].x, p.y - PATH[i].y));
const TOTAL = SEG.reduce((a, b) => a + b, 0);

export const Fiber: React.FC<{progress: number; pulse: number}> = ({progress, pulse}) => {
  let left = progress * TOTAL;
  const pulseAt = (pulse % 1) * TOTAL;
  let acc = 0;
  let dot = PATH[0];
  SEG.forEach((s, i) => {
    if (pulseAt >= acc && pulseAt <= acc + s) {
      const k = (pulseAt - acc) / s;
      dot = {x: PATH[i].x + (PATH[i + 1].x - PATH[i].x) * k, y: PATH[i].y + (PATH[i + 1].y - PATH[i].y) * k};
    }
    acc += s;
  });
  return (
    <svg width={840} height={150} style={{position: 'absolute', left: 0, top: 0}}>
      <rect x={X0} y={CY - HALF - 6} width={X1 - X0} height={2 * HALF + 12} rx={HALF + 6} fill={alpha(roles.water, 0.14)} stroke={alpha(roles.water, 0.7)} strokeWidth={3} />
      {PATH.slice(1).map((p, i) => {
        const k = Math.max(0, Math.min(1, left / SEG[i]));
        left -= SEG[i];
        return <LightRay key={`seg-${i}`} a={PATH[i]} b={p} progress={k} width={4} arrow={i % 2 === 0} />;
      })}
      {progress >= 1 && <circle cx={dot.x} cy={dot.y} r={9} fill={theme.accent} />}
    </svg>
  );
};
