import episode from '../episodes/ep03-danbai.json';

export const [W, H] = episode.format.size.split('x').map(Number);

// 平台遮挡区：顶部标签栏、右侧点赞评论栏、底部操作栏
export const SAFE = {top: 180, railX: 920, railFromY: 900, bottomY: 1540};

// 单摆画面：1 米 = PX_PER_M 像素，摆长按比例画
export const PX_PER_M = 470;
export const PIVOT_Y = 478;

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
