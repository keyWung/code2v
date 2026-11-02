import episode from '../episodes/ep07-yuanzhou.json';
import type {Pt} from './physics';

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

// 镜 1-2 下面还没有代码区，舞台一直铺到字幕上方；镜 3 起收到代码区上方
export const STAGE = {left: 60, right: 900, top: 452, bottom: 1032};
export const STAGE_TALL_BOTTOM = 1290;
export const BALL_R = 16;

// 两个圆心：镜 1 弯道、镜 2 居中、镜 3 上移、镜 4 左右对比
export const BIG_AT: Record<'hook' | 'solo' | 'formula' | 'compare', Pt> = {
  hook: {x: 340, y: 920},
  solo: {x: 480, y: 900},
  formula: {x: 480, y: 742},
  compare: {x: 340, y: 742},
};
export const SMALL_AT: Record<'hook' | 'compare', Pt> = {
  hook: {x: 750, y: 660},
  compare: {x: 760, y: 650},
};
export const ROAD_W = 34;

// 镜 2 顶部三张量卡
export const CARDS = {top: 470, height: 112, gap: 20};
export const cardBox = (i: number) => {
  const w = (STAGE.right - STAGE.left - 2 * CARDS.gap) / 3;
  const left = STAGE.left + i * (w + CARDS.gap);
  return {left, top: CARDS.top, width: w, height: CARDS.height};
};

// 镜 5：2×2 四格
export const GRID = {left: 60, top: 456, w: 410, h: 404, gapX: 20, gapY: 16};
export const TITLE_H = 64;
export const cell = (i: number) => {
  const left = GRID.left + (i % 2) * (GRID.w + GRID.gapX);
  const top = GRID.top + Math.floor(i / 2) * (GRID.h + GRID.gapY);
  return {left, top, right: left + GRID.w, bottom: top + GRID.h};
};
