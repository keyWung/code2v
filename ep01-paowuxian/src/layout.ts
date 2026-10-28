import episode from '../episodes/ep01-paowuxian.json';

export const [W, H] = episode.format.size.split('x').map(Number);

// 平台遮挡区：顶部标签栏、右侧点赞评论栏、底部操作栏
export const SAFE = {top: 180, railX: 920, railFromY: 900, bottomY: 1540};

// 坐标区等比例：1 米 = PX 像素，45° 在画面上就是 45°
export const PX = 18.6;
export const PLOT = {left: 80, bottom: 870};
export const toScreen = (x: number, y: number) => ({
  sx: PLOT.left + x * PX,
  sy: PLOT.bottom - y * PX,
});

export const ZONE = {
  series: {top: 186},
  header: {top: 222, height: 68, left: 60, width: 840, gap: 30},
  dock: {cy: 336},
  chip: {left: 80, top: 418},
  counter: {top: 404, right: 1000, width: 310},
  landingLabelY: 948,
  stage: {cx: 480, cy: 700},
  panel: {left: 60, top: 1030, width: 840, height: 300},
  subtitle: {left: 60, top: 1352, width: 840, height: 180},
};

export const pillCx = (i: number) => {
  const {left, width, gap} = ZONE.header;
  const w = (width - 2 * gap) / 3;
  return left + i * (w + gap) + w / 2;
};
export const pillWidth = (ZONE.header.width - 2 * ZONE.header.gap) / 3;
