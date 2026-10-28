import React from 'react';
import {EP01} from '../physics';
import {toScreen} from '../layout';
import {fonts, theme} from '../theme';

const range = (lo: number, hi: number, step: number) => {
  const out: number[] = [];
  for (let v = lo; v <= hi + 1e-9; v += step) out.push(v);
  return out;
};

// EP01 的坐标网格；本期不标刻度数字
export const GridAxes: React.FC<{opacity?: number}> = ({opacity = 1}) => {
  if (opacity <= 0) return null;
  const {x: x1, y: y1, step} = EP01.axes;
  const o = toScreen(0, 0);
  const xEnd = toScreen(x1, 0);
  const yEnd = toScreen(0, y1);
  const label = {fontFamily: fonts.math, fontStyle: 'italic', fontSize: 30, fill: theme.textMuted};

  return (
    <g opacity={opacity}>
      {range(0, x1, step).map((x) => {
        const a = toScreen(x, 0);
        const b = toScreen(x, y1);
        return <line key={`gx${x}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke={theme.grid} strokeWidth={2} />;
      })}
      {range(0, y1, step).map((y) => {
        const a = toScreen(0, y);
        const b = toScreen(x1, y);
        return <line key={`gy${y}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke={theme.grid} strokeWidth={2} />;
      })}
      <line x1={o.sx} y1={o.sy} x2={xEnd.sx + 6} y2={o.sy} stroke={theme.axis} strokeWidth={3} />
      <path d={`M ${xEnd.sx + 18} ${o.sy} l -14 -8 v 16 z`} fill={theme.axis} />
      <line x1={o.sx} y1={o.sy} x2={o.sx} y2={yEnd.sy - 6} stroke={theme.axis} strokeWidth={3} />
      <path d={`M ${o.sx} ${yEnd.sy - 18} l -8 14 h 16 z`} fill={theme.axis} />
      <text x={xEnd.sx + 6} y={o.sy + 34} textAnchor="middle" style={label}>
        x
      </text>
      <text x={o.sx + 14} y={yEnd.sy - 4} style={label}>
        y
      </text>
    </g>
  );
};
