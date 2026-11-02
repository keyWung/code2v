import type {SubtitleLine} from './components/Subtitle';
import {ZONE} from './layout';
import type {Shot} from './timeline';
import {theme} from './theme';

const KEYWORDS: Record<number, string[][]> = {
  1: [['看半径']],
  2: [['大小不变', '方向时刻在变']],
  3: [['a = v² / r', '指向圆心']],
  4: [['半径越小', '加速度越大']],
  5: [['合力的效果']],
  6: [['a = v² / r', '指向圆心'], ['电磁感应']],
};

// 条件和“必须讲清”的边界写在字幕小注里
const NOTES: Record<number, string> = {
  2: '注：“匀速”只是速度大小不变，速度方向一直在变',
  3: '注：a 与 v 垂直，只改变速度方向，不改变速度大小',
  4: '注：两个圆 v 都是 4 m/s；r 减半，a 翻倍',
  5: '注：受力分析只画真实的力，向心力是它们的合力，不另加一个',
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
  // 公式 a = v² / r 里也有“ / ”，只在句号后的 / 处分行
  const parts = shot.字幕.split(/(?<=。)\s*\/\s*/);
  if (parts.length > 1) {
    return parts.map((text, i) => ({
      text,
      keywords: KEYWORDS[shot.shot]?.[i] ?? [],
      size: i === 0 ? 54 : 40,
      color: i > 0 ? theme.textMuted : undefined,
    }));
  }
  const lines = textWidth(parts[0], 56) > ZONE.subtitle.width ? breakAtPunct(parts[0]) : parts;
  // 两行加小注时略缩字号，整块放得进字幕区
  const size = lines.length > 1 && NOTES[shot.shot] ? 50 : 56;
  return lines.map((text) => ({text, keywords: KEYWORDS[shot.shot]?.[0] ?? [], size}));
};

export const subtitleNote = (shot: Shot): SubtitleLine | null =>
  NOTES[shot.shot] ? {text: NOTES[shot.shot], keywords: [], size: 28, color: theme.textMuted} : null;
