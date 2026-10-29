// 长章名在逗号处分两行，停靠到顶部时不和相邻章节挤在一起
export const stampLines = (text: string) => {
  const i = text.indexOf('，');
  return text.length > 6 && i > 0 ? [text.slice(0, i + 1), text.slice(i + 1)] : [text];
};

// 盖章原始宽度（字号 62、字距 4、内边距与边框）
export const stampWidth = (text: string) =>
  Math.max(...stampLines(text).map((l) => [...l].reduce((w, ch) => w + (ch === ' ' ? 23 : ch.charCodeAt(0) > 0x2e80 ? 66 : 41), 0))) + 82;
