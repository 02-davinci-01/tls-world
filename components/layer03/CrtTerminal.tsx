'use client';

import { Fragment, useLayoutEffect, useRef, type Ref, type RefObject } from 'react';
import { Apparition, type ApparitionHandle } from '@/components/apparition/Apparition';
import type { LineTag } from '@/lib/chain';
import { CHAIN_HOSTS, type ChainHost } from '@/lib/config';
import s from './Layer03.module.css';

export type TermLine = { id: number; text: string; tag?: LineTag; bad?: boolean; kind?: 'cmd' | 'boot' };

type Props = {
  lines: TermLine[];
  /** What the prompt shows. Read-only: tabs type into it, a click or Enter runs it. */
  prompt: string;
  /** Prompt is being typed or a command is running. */
  busy: boolean;
  onRun: () => void;
  /** Keys pressed while the terminal has focus (hidden commands). */
  onKey: (key: string) => void;
  host: ChainHost;
  onTab: (h: ChainHost) => void;
  status: string | null;
  hl: string | null;
  screenRef: RefObject<HTMLDivElement | null>;
  ghostRef: Ref<ApparitionHandle>;
};

const TAB_NOTE: Record<ChainHost, string> = {
  'github.com': 'good chain',
  'incomplete-chain.badssl.com': 'broken chain',
};

/** navi · copland os. A horizontal CRT with a real prompt. */
export function CrtTerminal({ lines, prompt, busy, onRun, onKey, host, onTab, status, hl, screenRef, ghostRef }: Props) {
  const out = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = out.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  return (
    <div
      className={s.crt}
      onKeyDown={(e) => {
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) onKey(e.key.toLowerCase());
      }}
    >
      <div className={s.screen} ref={screenRef}>
        <div className={s.tbar}>
          <span>
            navi · copland os{status && <span className={s.status}> · {status}</span>}
          </span>
          <div className={s.tabs}>
            {CHAIN_HOSTS.map((h) => (
              <button
                key={h}
                type="button"
                aria-pressed={h === host}
                className={[h === host ? s.on : '', h === 'github.com' ? '' : s.redTab].join(' ')}
                onClick={() => onTab(h)}
              >
                <i aria-hidden="true" />
                <span className={s.tabHost}>{h}</span>
                <span className={s.tabSep}> · </span>
                <span className={s.tabNote}>{TAB_NOTE[h]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className={s.tout} ref={out} role="log" aria-live="polite" aria-label="terminal output">
          {lines.map((l) => (
            <span
              key={l.id}
              data-k={l.tag}
              className={[s.tl, l.bad ? s.bad : '', l.kind ? s[l.kind] : '', l.tag && hl === l.tag ? s.hl : ''].join(' ')}
            >
              {l.text || ' '}
            </span>
          ))}
        </div>
        <button
          type="button"
          className={s.tin}
          onClick={onRun}
          aria-disabled={busy || !prompt || undefined}
          aria-label={prompt ? `Run: ${prompt}` : 'Pick a tab above to load a command'}
        >
          <span className={s.ps1} aria-hidden="true">
            you@navi ~ %
          </span>
          <span className={s.cmdText} aria-hidden="true">
            {prompt.split(' ').map((w, i) => (
              <Fragment key={i}>
                {i > 0 && ' '}
                <span className={s.word}>{w}</span>
              </Fragment>
            ))}
            <span className={s.caret} />
            {!prompt && !busy && <span className={s.hint}> pick a tab above</span>}
          </span>
          {prompt && (
            <span className={[s.enterKey, busy ? s.enterBusy : ''].join(' ')} aria-hidden="true">
              <span className={s.enterPointer}>press enter</span>
              <span className={s.enterTouch}>tap to run</span>
              <kbd>↵</kbd>
            </span>
          )}
        </button>
      </div>
      <Apparition
        ref={ghostRef}
        name="lain_terminal.webp"
        mode="ghost"
        note="flickers 2–3 frames every 7–12s, 3 on a broken chain, 5 on the command 'lain'"
        className={s.ghost}
      />
    </div>
  );
}
