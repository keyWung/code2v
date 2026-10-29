import React from 'react';
import {pathLength, pointAlong, type Pt} from '../physics';
import {alpha, roles} from '../theme';

// 一条电场线：从起点画向终点，progress 控制画到哪里；画过 arrowAt 后在那里标出方向
export const FieldLine: React.FC<{
  pts: Pt[];
  progress?: number;
  opacity?: number;
  color?: string;
  width?: number;
  arrowAt?: number;
  dashed?: boolean;
}> = ({pts, progress = 1, opacity = 1, color = alpha(roles.line, 0.78), width = 3, arrowAt = 0.5, dashed = false}) => {
  if (progress <= 0 || opacity <= 0 || pts.length < 2) return null;
  const len = pathLength(pts);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const {p, dir} = pointAlong(pts, arrowAt);
  const s = 9 + width * 1.5;
  const head = `M ${p.x + dir.x * s} ${p.y + dir.y * s} L ${p.x - dir.x * s * 0.7 - dir.y * s * 0.75} ${p.y - dir.y * s * 0.7 + dir.x * s * 0.75} L ${p.x - dir.x * s * 0.7 + dir.y * s * 0.75} ${p.y - dir.y * s * 0.7 - dir.x * s * 0.75} Z`;
  return (
    <g opacity={opacity}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashed ? '12 10' : progress < 1 ? `${len * progress} ${len}` : undefined}
      />
      {arrowAt > 0 && progress >= arrowAt + 0.04 && <path d={head} fill={color} />}
    </g>
  );
};
