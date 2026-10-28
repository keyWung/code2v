import React from 'react';
import {CODE, g, SMALL_ANGLE_DEG} from '../physics';
import {ZONE} from '../layout';
import {alpha, fonts, theme} from '../theme';

// JSON 里的两行核心代码，摆动就是它算出来的
const [LINE_W, LINE_T] = CODE;
export const CODE_CHARS = LINE_W.length + LINE_T.length;
const COMMENT = `// g = ${g} · 摆角 < ${SMALL_ANGLE_DEG}° · 忽略空气阻力`;

const TOKEN = /(\/\/.*$)|\b(const)\b|\b(Math)\b|\b(cos|sin|sqrt)\b|(\d+(?:\.\d+)?)|([A-Za-z_]\w*)|(\s+)|(.)/g;

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

const LINE_H = 44;

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
      {cursor && <span style={{background: theme.accent, width: 16, height: 32, display: 'inline-block', verticalAlign: -6}} />}
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

const Tab: React.FC<{label: string; active: boolean}> = ({label, active}) => (
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

export const CodePanel: React.FC<{
  opacity: number;
  typed: number;
  cursor: boolean;
  output: string;
  outputOpacity: number;
  hl: number;
}> = ({opacity, typed, cursor, output, outputOpacity, hl}) => {
  if (opacity <= 0) return null;
  const nw = Math.min(LINE_W.length, typed);
  const nt = Math.max(0, Math.min(LINE_T.length, typed - LINE_W.length));
  return (
    <PanelFrame opacity={opacity} tabs={<Tab label="单摆.ts" active />}>
      <div style={{position: 'absolute', inset: 0, padding: '12px 28px', fontFamily: fonts.mono, fontSize: 28}}>
        <CodeRow code={COMMENT} />
        <CodeRow code={LINE_W.slice(0, nw)} band={theme.accent} bandOpacity={hl} cursor={cursor && nt === 0} />
        <CodeRow code={LINE_T.slice(0, nt)} band={theme.accent} bandOpacity={hl} cursor={cursor && nt > 0} />
        <div style={{height: 44, display: 'flex', alignItems: 'center', opacity: outputOpacity, color: theme.accent, whiteSpace: 'pre'}}>
          {output}
        </div>
      </div>
    </PanelFrame>
  );
};
