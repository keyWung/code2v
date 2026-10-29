import episode from '../episodes/ep05-dianchangxian.json';
import {fieldE, Q, type Pt} from './physics';

export const [W, H] = episode.format.size.split('x').map(Number);

// 平台遮挡区：顶部标签栏、右侧点赞评论栏、底部操作栏
export const SAFE = {top: 180, railX: 920, railFromY: 900, bottomY: 1540};

export const ZONE = {
  series: {top: 186},
  header: {top: 222, height: 68, left: 60, width: 840, gap: 30},
  dock: {cy: 338, scale: 0.32, gap: 12},
  chip: {left: 60, right: 1020, top: 398},
  stage: {cx: 480, cy: 700},
  panel: {left: 60, top: 1046, width: 840, height: 262},
  subtitle: {left: 60, top: 1322, width: 840, height: 208},
};

export const pillCx = (i: number) => {
  const {left, width, gap} = ZONE.header;
  const w = (width - 2 * gap) / 3;
  return left + i * (w + gap) + w / 2;
};
export const pillWidth = (ZONE.header.width - 2 * ZONE.header.gap) / 3;

// 镜 1-4：单个正电荷，电场线画到舞台边框为止
// 镜 1-2 下面还没有代码区，舞台一直铺到字幕上方；镜 3 起收到代码区上方
export const STAGE = {left: 60, right: 900, top: 452, bottom: 1032};
export const STAGE_TALL_BOTTOM = 1290;
export const CHARGE_R = 34;
export const HOOK: Pt = {x: 480, y: (STAGE.top + STAGE_TALL_BOTTOM) / 2};
export const CENTER: Pt = {x: 480, y: (STAGE.top + STAGE.bottom) / 2};
// 镜 4 电荷移到左边，向右量距离
export const LEFT: Pt = {x: 200, y: CENTER.y};

// 场强箭头：0.1 米处画 100 像素，其余按 E 等比例
export const E_PX = 100 / fieldE(Q, 0.1);

// 镜 5：2×2 四格，三张典型图 + 读图规则
export const GRID = {left: 60, top: 456, w: 410, h: 404, gapX: 20, gapY: 16};
export const cell = (i: number) => {
  const left = GRID.left + (i % 2) * (GRID.w + GRID.gapX);
  const top = GRID.top + Math.floor(i / 2) * (GRID.h + GRID.gapY);
  return {left, top, right: left + GRID.w, bottom: top + GRID.h};
};
