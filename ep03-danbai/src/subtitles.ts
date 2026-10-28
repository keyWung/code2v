import type {SubtitleLine} from './components/Subtitle';
import {ZONE} from './layout';
import {SMALL_ANGLE_DEG} from './physics';
import type {Shot} from './timeline';
import {theme} from './theme';

const KEYWORDS: Record<number, string[][]> = {
  1: [['不在摆锤多重']],
  2: [['小角度']],
  3: [['摆长越长', '越慢']],
  4: [['基本不变']],
  5: [['摆长和重力']],
  6: [['摆长和重力'], ['光的折射']],
};

// 小角度条件写在字幕小注里，不能省
const NOTES: Record<number, string> = {
  2: `注：摆角一般小于 ${SMALL_ANGLE_DEG}° 才近似简谐运动，大角度不适用`,
  4: `注：只在摆角很小（< ${SMALL_ANGLE_DEG}°）时成立，大角度不适用`,
  5: `注：g 取 10（实际约 9.8）；摆角 < ${SMALL_ANGLE_DEG}°`,
};

const textWidth = (s: string, size: number) =>
  [...s].reduce((w, ch) => w + (ch === ' ' ? 0.3 : ch.charCodeAt(0) > 0x2e80 ? 1 : 0.6) * size, 0);

// 太长时在最靠中间的标点后断行，避免把关键词拆开
export const breakAtPunct = (s: string) => {
  const cuts = [...s.matchAll(/[，？：]/g)].map((m) => m.index! + 1).filter((i) => i < s.length);
  if (!cuts.length) return [s];
  const mid = s.length / 2;
  const cut = cuts.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
  return [s.slice(0, cut), s.slice(cut)];
};

export const subtitleLines = (shot: Shot): SubtitleLine[] => {
  const parts = shot.字幕.split(/(?<=。)\s*\/\s*|\s+\/\s+/);
  if (parts.length > 1) {
    return parts.map((text, i) => ({
      text,
      keywords: KEYWORDS[shot.shot]?.[i] ?? [],
      size: i === 0 ? 54 : 40,
      color: i > 0 ? theme.textMuted : undefined,
    }));
  }
  const size = 56;
  const lines = textWidth(parts[0], size) > ZONE.subtitle.width ? breakAtPunct(parts[0]) : parts;
  return lines.map((text) => ({text, keywords: KEYWORDS[shot.shot]?.[0] ?? [], size}));
};

export const subtitleNote = (shot: Shot): SubtitleLine | null =>
  NOTES[shot.shot] ? {text: NOTES[shot.shot], keywords: [], size: 28, color: theme.textMuted} : null;
