// 唯一配色来源：所有组件只从这里取色；色值沿用 EP01，不另起新颜色
export const theme = {
  bg: '#0F172A',
  grid: '#1E293B',
  axis: '#E2E8F0',
  traj45: '#38BDF8',
  traj30: '#A78BFA',
  traj60: '#34D399',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  accent: '#FACC15',
  panel: '#0A1122',
  panelBorder: '#1E293B',
} as const;

// EP04 语义色：只引用上面的色值
export const roles = {
  ray: theme.accent,
  water: theme.traj45,
  glass: theme.traj30,
  ok: theme.traj60,
  stick: theme.axis,
  normal: theme.textMuted,
} as const;

// 给 #RRGGBB 加透明度
export const alpha = (hex: string, a: number): string =>
  hex +
  Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, '0');

export const fonts = {
  sans: '"PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif',
  mono: 'Menlo, "SF Mono", Monaco, monospace',
  math: '"Times New Roman", "STIXGeneral", serif',
};
