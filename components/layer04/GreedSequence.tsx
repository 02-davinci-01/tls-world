'use client';

import { useEffect, useRef, useState } from 'react';
import { Apparition } from '@/components/apparition/Apparition';
import { ARTICLE_URL, REDIRECT_SECONDS } from '@/lib/config';
import { isAbort, realSleep, sleep } from '@/lib/motion';
import { setGlobal } from '@/lib/store';
import { prefersReducedMotion } from '@/lib/useReducedMotion';
import s from './Layer04.module.css';

export type Phase = 'off' | 'glitch' | 'quote' | 'payoff';

const QUOTE = 'The greedy bring ruin.';

/**
 * Keystrokes for a person typing the quote: uneven key timing, a hesitation before
 * "ruin", and one typo that gets noticed and backspaced. Each entry: text so far, then wait (ms).
 */
function typingScript(): [string, number][] {
  const out: [string, number][] = [];
  const key = () => 85 + Math.random() * 150 + (Math.random() < 0.12 ? 180 : 0);
  let cur = '';
  const type = (str: string) => {
    for (const ch of str) {
      cur += ch;
      out.push([cur, ch === ' ' ? key() + 90 : key()]);
    }
  };
  const pause = (ms: number) => (out[out.length - 1][1] += ms);
  type('The gree');
  cur += 'f'; // slip
  out.push([cur, 340 + Math.random() * 160]);
  cur = cur.slice(0, -1);
  out.push([cur, 150]);
  type('dy');
  pause(260);
  type(' bring ');
  pause(900); // hesitates before the word
  type('ruin');
  pause(700);
  type('.');
  return out;
}

/** CRT glitch → typed Proverbs 15:27 → bracket → payoff → countdown → redirect. Esc aborts at any point. */
export function GreedSequence({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('off');
  const [typed, setTyped] = useState('');
  const [done, setDone] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const escBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const { signal } = ctrl;
    const body = document.body;
    const restoreFocus = document.activeElement as HTMLElement | null;
    setGlobal({ greedOn: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    (async () => {
      const reduced = prefersReducedMotion();
      setTyped('');
      setDone(false);
      setCount(null);
      if (!reduced) {
        // One CRT glitch: the page tears (jitter + RGB split + scanlines), then the
        // overlay switches on like a tube, a bright line opening to full screen.
        setPhase('glitch');
        body.classList.add('crt-glitch');
        await sleep(360, signal);
        body.classList.remove('crt-glitch');
      }
      setPhase('quote');
      requestAnimationFrame(() => escBtn.current?.focus());
      if (reduced) setTyped(QUOTE);
      else {
        await sleep(520, signal); // the cursor blinks a moment before anyone types
        for (const [text, wait] of typingScript()) {
          setTyped(text);
          await sleep(wait, signal);
        }
      }
      setDone(true);
      await sleep(1600, signal);
      setPhase('payoff');
      for (let n = REDIRECT_SECONDS; n > 0; n--) {
        setCount(n);
        await realSleep(1000, signal);
      }
      setCount(0);
      const u = new URL(ARTICLE_URL, location.href);
      window.location.assign(u.href);
    })().catch((e) => {
      if (!isAbort(e)) throw e;
    });

    return () => {
      ctrl.abort();
      body.classList.remove('crt-glitch');
      window.removeEventListener('keydown', onKey);
      setGlobal({ greedOn: false });
      setPhase('off');
      restoreFocus?.focus?.();
    };
  }, [open, onClose]);

  const showInner = phase === 'quote' || phase === 'payoff';

  return (
    <div
      className={[s.greed, showInner ? s.visible : ''].join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label="Free certificate"
      hidden={!open}
    >
      <button ref={escBtn} className={s.esc} type="button" onClick={onClose}>
        esc
      </button>
      {showInner && (
        <div className={s.inner}>
          <p className="sr-only">{QUOTE}</p>
          <div className={[s.q, done ? s.typed : ''].join(' ')} aria-hidden="true">
            {typed}
          </div>
          <div className={[s.br, done ? s.shown : ''].join(' ')}>
            <b>[ Proverbs 15:27 ]</b>
            <br />
            (you really fell for that :p)
          </div>
          <div className={[s.gif, phase === 'payoff' ? s.shown : ''].join(' ')}>
            <Apparition name="payoff_laugh.webp" mode="static" color note="the payoff: Lain laughing at you, in colour" className={s.gifApp} />
          </div>
          <div className={[s.redir, phase === 'payoff' ? s.shown : ''].join(' ')} aria-live="polite">
            {count !== null && (
              <>
                redirecting you to the article in {count}… <a href={ARTICLE_URL}>go now</a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
