import React from 'react';
import {CORE_CODE} from '../physics';
import {ZONE} from '../layout';
import {alpha, fonts, theme} from '../theme';

// 复用 EP01 的 x(t)、y(t) 两行代码
const [LINE_X, LINE_Y] = CORE_CODE;
const CUT = LINE_Y.indexOf(' - ');
export const CODE_CHARS = LINE_X.length + LINE_Y.length;

const TOKEN = /(\/\/.*$)|\b(const)\b|\b(Math)\b|\b(cos|sin)\b|(\d+(?:\.\d+)?)|([A-Za-z_]\w*)|(\s+)|(.)/g;

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
  strike?: number;
}> = ({code, band, bandOpacity = 0, note, noteColor, cursor, strike = 0}) => (
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
    <span style={{position: 'relative', opacity: 1 - 0.55 * strike}}>
      <Highlighted code={code} />
      {cursor && <span style={{background: theme.accent, width: 16, height: 32, display: 'inline-block', verticalAlign: -6}} />}
      {strike > 0 && code.trim() && (
        <span
          style={{
            position: 'absolute',
            left: code.length - code.trimStart().length + 'ch',
            right: 0,
            top: '52%',
            height: 3,
            background: alpha(theme.textMuted, strike),
          }}
        />
      )}
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

export type CodeNote = {text: string; color: string; opacity: number};

export const CodePanel: React.FC<{
  opacity: number;
  typed: number;
  cursor: boolean;
  comment: string;
  xNote?: CodeNote;
  yNote?: CodeNote;
  strike?: number;
}> = ({opacity, typed, cursor, comment, xNote, yNote, strike = 0}) => {
  if (opacity <= 0) return null;
  const nx = Math.min(LINE_X.length, typed);
  const ny = Math.max(0, Math.min(LINE_Y.length, typed - LINE_X.length));
  const y1 = LINE_Y.slice(0, Math.min(ny, CUT));
  const y2 = ny > CUT + 1 ? ' '.repeat(8) + LINE_Y.slice(CUT + 1, ny) : '';
  const cursorRow = ny === 0 ? 0 : ny <= CUT ? 1 : 2;

  return (
    <PanelFrame
      opacity={opacity}
      tabs={
        <>
          <Tab label="parabola.ts" active />
          <div style={{fontFamily: fonts.sans, fontSize: 20, color: theme.textMuted, marginLeft: 8}}>from EP01</div>
        </>
      }
    >
      <div style={{position: 'absolute', inset: 0, padding: '12px 28px', fontFamily: fonts.mono, fontSize: 30}}>
        <CodeRow code={comment} />
        <CodeRow
          code={LINE_X.slice(0, nx)}
          band={xNote?.color}
          bandOpacity={xNote?.opacity}
          note={xNote?.text}
          noteColor={xNote?.color}
          cursor={cursor && cursorRow === 0}
        />
        <CodeRow code={y1} band={yNote?.color} bandOpacity={yNote?.opacity} cursor={cursor && cursorRow === 1} strike={strike} />
        <CodeRow
          code={y2}
          band={yNote?.color}
          bandOpacity={yNote?.opacity}
          note={yNote?.text}
          noteColor={yNote?.color}
          cursor={cursor && cursorRow === 2}
          strike={strike}
        />
      </div>
    </PanelFrame>
  );
};
