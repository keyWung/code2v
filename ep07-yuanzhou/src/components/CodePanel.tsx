import React from 'react';
import {CODE} from '../physics';
import {ZONE} from '../layout';
import {alpha, fonts, theme} from '../theme';

// JSON 里的两行核心代码，画面上的角速度、箭头长度都是它算出来的
export const CODE_CHARS = CODE.reduce((n, l) => n + l.length, 0);

const TOKEN = /(\/\/.*$)|\b(const)\b|\b(Math)\b|\b(PI)\b|(\d+(?:\.\d+)?)|([A-Za-z_]\w*)|(\s+)|(.)/g;

const Highlighted: React.FC<{code: string}> = ({code}) => {
  const out: React.ReactNode[] = [];
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(code))) {
    const [s, comment, kw, math, fn, num, id, ws] = m;
    const color = comment
      ? theme.textMuted
      : kw
        ? theme.traj30
        : math || fn
          ? theme.traj45
          : num
            ? theme.traj60
            : id
              ? theme.text
              : ws
                ? undefined
                : theme.textMuted;
    out.push(
      <span key={m.index} style={{color, fontStyle: comment ? 'italic' : undefined}}>
        {s}
      </span>,
    );
  }
  return <>{out}</>;
};

const LINE_H = 42;

const CodeRow: React.FC<{
  code: string;
  band?: string;
  bandOpacity?: number;
  note?: string;
  noteColor?: string;
  cursor?: boolean;
}> = ({code, band, bandOpacity = 0, note, noteColor, cursor}) => (
  <div style={{position: 'relative', height: LINE_H, display: 'flex', alignItems: 'center', whiteSpace: 'pre'}}>
    {band && bandOpacity > 0 && (
      <div
        style={{
          position: 'absolute',
          inset: '2px -28px',
          background: alpha(band, 0.13 * bandOpacity),
          borderLeft: `6px solid ${alpha(band, bandOpacity)}`,
        }}
      />
    )}
    <span style={{position: 'relative'}}>
      <Highlighted code={code} />
      {cursor && <span style={{background: theme.accent, width: 13, height: 28, display: 'inline-block', verticalAlign: -5}} />}
    </span>
    {note && bandOpacity > 0 && (
      <span
        style={{
          position: 'absolute',
          right: 0,
          fontFamily: fonts.sans,
          fontSize: 26,
          fontWeight: 700,
          color: noteColor,
          opacity: bandOpacity,
        }}
      >
        {note}
      </span>
    )}
  </div>
);

export const Tab: React.FC<{label: string; active: boolean}> = ({label, active}) => (
  <div
    style={{
      fontFamily: fonts.sans,
      fontSize: 22,
      padding: '0 18px',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      color: active ? theme.text : theme.textMuted,
      borderBottom: `3px solid ${active ? theme.accent : 'transparent'}`,
    }}
  >
    {label}
  </div>
);

export const PanelFrame: React.FC<{opacity: number; tabs: React.ReactNode; children: React.ReactNode}> = ({
  opacity,
  tabs,
  children,
}) => {
  const {left, top, width, height} = ZONE.panel;
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        opacity,
        borderRadius: 22,
        background: theme.panel,
        border: `2px solid ${theme.panelBorder}`,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          height: 52,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 18px',
          borderBottom: `2px solid ${theme.panelBorder}`,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div key={i} style={{width: 14, height: 14, borderRadius: 7, background: alpha(theme.textMuted, 0.35)}} />
        ))}
        <div style={{width: 18}} />
        {tabs}
      </div>
      <div style={{position: 'relative', height: height - 56}}>{children}</div>
    </div>
  );
};

export type Output = {text: string; opacity: number; color?: string};

// 第一行注释写清条件，下面是 JSON 里的两行代码逐字打出（hl 是每行的高亮程度），最后是运行输出
export const CodePanel: React.FC<{
  opacity: number;
  tab: string;
  comment: string;
  typed: number;
  cursor: boolean;
  hl: number[];
  outputs: Output[];
}> = ({opacity, tab, comment, typed, cursor, hl, outputs}) => {
  if (opacity <= 0) return null;
  let left = typed;
  const shown = CODE.map((line) => {
    const part = line.slice(0, Math.max(0, left));
    left -= line.length;
    return part;
  });
  const typing = shown.findIndex((l, i) => l.length < CODE[i].length);
  const at = typing < 0 ? CODE.length - 1 : typing;
  return (
    <PanelFrame opacity={opacity} tabs={<Tab label={tab} active />}>
      <div style={{position: 'absolute', inset: 0, padding: '12px 28px', fontFamily: fonts.mono, fontSize: 24}}>
        <CodeRow code={comment} />
        {shown.map((l, i) => (
          <CodeRow key={`code-${i}`} code={l} band={theme.accent} bandOpacity={hl[i] ?? 0} cursor={cursor && i === at} />
        ))}
        {outputs.map((o, i) => (
          <div
            key={`out-${i}`}
            style={{height: LINE_H, display: 'flex', alignItems: 'center', opacity: o.opacity, color: o.color ?? theme.accent, whiteSpace: 'pre'}}
          >
            {o.text}
          </div>
        ))}
      </div>
    </PanelFrame>
  );
};
