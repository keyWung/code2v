import React from 'react';
import {GRID} from '../layout';
import {linesFrom, linesInto, pathLength, Q, releaseFrom, type Charge as ChargeT, type Pt} from '../physics';
import {Charge} from './Charge';
import {FieldLine} from './FieldLine';

// 镜 5 一格里的两个等量点电荷（格子内坐标），电场线按 fieldAt 叠加后一步步描出来
export const PAIR_R = 22;
export const TITLE_H = 64;
const A: Pt = {x: 105, y: 236};
const B: Pt = {x: 305, y: 236};
export const MID: Pt = {x: (A.x + B.x) / 2, y: A.y};
const BOX = {left: 0, top: TITLE_H, right: GRID.w, bottom: GRID.h};

export const pairCharges = (like: boolean): ChargeT[] => [
  {...A, q: Q},
  {...B, q: like ? Q : -Q},
];

// 等量异种：从正电荷等角度出发 14 条，走到负电荷为止；再补上从画面外绕回来、止于负电荷的线
// 等量同种：每个 12 条，避开连线方向（中点场强为零，线走不过去）
export const OPPOSITE_LINES = [...linesFrom(pairCharges(false), 14, 0, PAIR_R, BOX), ...linesInto(pairCharges(false), 14, 0, PAIR_R, BOX)];
export const LIKE_LINES = linesFrom(pairCharges(true), 12, 15, PAIR_R, BOX);

// 演示“线不是轨迹”用的那条：从正电荷上方拱到负电荷、拱得最高的一条
export const ARC_INDEX = 11;
const ARC = OPPOSITE_LINES[ARC_INDEX];
export const ARC_TOP = ARC.reduce((m, p) => (p.y < m.y ? p : m), ARC[0]);
// 带正电的粒子在拱顶从静止释放；取前一段，够看出它冲过了负电荷而不是顺着线拐进去
const PATH_LEN = 236;
export const PARTICLE_PATH: Pt[] = (() => {
  const all = releaseFrom(pairCharges(false), ARC_TOP, BOX, PAIR_R);
  const out = [all[0]];
  for (let i = 1; i < all.length && pathLength(out) < PATH_LEN; i++) out.push(all[i]);
  return out;
})();

export const Dipole: React.FC<{
  like?: boolean;
  charges: number;
  lines: number;
  lineOpacity?: number;
  highlight?: number;
}> = ({like = false, charges, lines, lineOpacity = 1, highlight = 0}) => {
  const set = like ? LIKE_LINES : OPPOSITE_LINES;
  const pop = Math.min(1, charges);
  return (
    <g>
      {set.map((pts, i) => (
        <FieldLine key={`l-${i}`} pts={pts} progress={lines} width={2.6} opacity={lineOpacity * (highlight > 0 && !like && i === ARC_INDEX ? 1 - highlight : 1)} />
      ))}
      {pairCharges(like).map((c, i) => (
        <Charge key={`c-${i}`} x={c.x} y={c.y} q={c.q} r={PAIR_R} scale={charges} opacity={pop} />
      ))}
    </g>
  );
};
