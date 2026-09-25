'use client';

import { useEffect, useRef, useState } from 'react';
import { Apparition, type ApparitionHandle } from '@/components/apparition/Apparition';
import { isAbort, realSleep } from '@/lib/motion';
import { setGlobal } from '@/lib/store';
import { prefersReducedMotion } from '@/lib/useReducedMotion';
import s from './BootScreen.module.css';

const LINES: { text: string; red?: boolean }[] = [
  { text: 'copland os · navi' },
  { text: 'memory check ............ ok' },
  { text: 'layer:01 termination .... mounted' },
  { text: 'layer:02 exchange ....... mounted' },
  { text: 'layer:03 identity ....... mounted' },
  { text: 'connecting to the wired … ok' },
  { text: 'present day, present time.', red: true },
];
const LINE_MS = 230;
const HOLD_MS = 650;
const OUT_MS = 600;

/**
 * Shown on every load. Server-rendered visible (html.booting pauses the sky's draw-in behind it),
 * then prints the boot log, flickers the reload art in, and hands over. Any input skips it.
 */
export function BootScreen() {
  const [shown, setShown] = useState(0);
  const [art, setArt] = useState(false);
  const [phase, setPhase] = useState<'on' | 'out' | 'gone'>('on');
  const app = useRef<ApparitionHandle>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const { signal } = ctrl;
    let finished = false;
    const finish = async () => {
      if (finished) return;
      finished = true;
      ctrl.abort();
      setShown(LINES.length);
      setPhase('out');
      document.documentElement.classList.remove('booting');
      setGlobal({ booted: true });
      await new Promise((r) => setTimeout(r, prefersReducedMotion() ? 0 : OUT_MS));
      setPhase('gone');
    };
    const skip = () => void finish();
    const opts = { passive: true } as const;
    addEventListener('pointerdown', skip, opts);
    addEventListener('keydown', skip, opts);
    addEventListener('wheel', skip, opts);
    addEventListener('touchstart', skip, opts);

    (async () => {
      if (prefersReducedMotion()) {
        setShown(LINES.length);
        setArt(true);
        await realSleep(900, signal);
        return finish();
      }
      for (let i = 1; i <= LINES.length; i++) {
        setShown(i);
        if (i === 2) {
          await app.current?.flicker(2);
          setArt(true);
        }
        if (i === 5) void app.current?.flicker(2, 'glitch');
        await realSleep(LINE_MS, signal);
      }
      void app.current?.flicker(3, 'glitch');
      await realSleep(HOLD_MS, signal);
      await finish();
    })().catch((e) => {
      if (!isAbort(e)) throw e;
    });

    return () => {
      ctrl.abort();
      removeEventListener('pointerdown', skip);
      removeEventListener('keydown', skip);
      removeEventListener('wheel', skip);
      removeEventListener('touchstart', skip);
    };
  }, []);

  if (phase === 'gone') return null;
  return (
    <div className={[s.boot, phase === 'out' ? s.out : ''].join(' ')} aria-hidden="true" data-boot="">
      <div className={s.col}>
        <div className={[s.art, art ? s.artOn : ''].join(' ')}>
          <Apparition ref={app} name="reload_art.webp" mode="ghost" color note="boot screen art, flickers in on every load" className={s.artApp} />
        </div>
        <div className={s.log}>
          {LINES.slice(0, shown).map((l) => (
            <span key={l.text} className={l.red ? s.red : undefined}>
              {l.text}
            </span>
          ))}
          <span className={s.caret} />
        </div>
      </div>
      <div className={s.skip}>click or press any key to skip</div>
    </div>
  );
}
