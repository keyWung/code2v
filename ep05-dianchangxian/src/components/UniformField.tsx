import React from 'react';
import {GRID} from '../layout';
import {alpha, fonts, roles} from '../theme';
import {FieldLine} from './FieldLine';
import {TITLE_H} from './Dipole';

// 两块异种电荷平行板：板间的线平行、等距、从正板指向负板（忽略边缘效应）
const PLATE = {left: 60, right: 350, top: TITLE_H + 46, bottom: GRID.h - 88, t: 12};
export const UNIFORM_X = Array.from({length: 7}, (_, i) => PLATE.left + 25 + (i * (PLATE.right - PLATE.left - 50)) / 6);
export const UNIFORM_PLATE = PLATE;

const Plate: React.FC<{y: number; q: number; opacity: number}> = ({y, q, opacity}) => {
  const color = q > 0 ? roles.plus : roles.minus;
  return (
    <g opacity={opacity}>
      <rect x={PLATE.left} y={y - PLATE.t / 2} width={PLATE.right - PLATE.left} height={PLATE.t} rx={4} fill={color} />
      {UNIFORM_X.map((x, i) => (
        <text
          key={`s-${i}`}
          x={x}
          y={q > 0 ? y - 18 : y + 40}
          textAnchor="middle"
          style={{fontFamily: fonts.sans, fontWeight: 900, fontSize: 30, fill: color}}
        >
          {q > 0 ? '+' : '−'}
        </text>
      ))}
    </g>
  );
};

export const UniformField: React.FC<{plates: number; lines: number; lineOpacity?: number}> = ({plates, lines, lineOpacity = 1}) => (
  <g>
    {UNIFORM_X.map((x, i) => (
      <FieldLine
        key={`u-${i}`}
        pts={[
          {x, y: PLATE.top + PLATE.t / 2},
          {x, y: PLATE.bottom - PLATE.t / 2},
        ]}
        progress={lines}
        width={2.6}
        opacity={lineOpacity}
        color={alpha(roles.line, 0.78)}
      />
    ))}
    <Plate y={PLATE.top} q={1} opacity={plates} />
    <Plate y={PLATE.bottom} q={-1} opacity={plates} />
  </g>
);
