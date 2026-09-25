'use client';

import { useEffect, useRef, useState } from 'react';
import { Apparition, type ApparitionHandle } from '@/components/apparition/Apparition';
import { IDLE_MS } from '@/lib/config';
import { getGlobal } from '@/lib/store';
import s from './global.module.css';

const EVENTS = ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel'] as const;

/** PRESENT DAY / PRESENT TIME, after 40s without input. Ambient, so aria-hidden. */
export function IdleOverlay() {
  const [on, setOn] = useState(false);
  const app = useRef<ApparitionHandle>(null);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const g = getGlobal();
        if (g.greedOn || !g.booted) return arm();
        setOn(true);
      }, IDLE_MS);
    };
    const reset = () => {
      setOn(false);
      arm();
    };
    EVENTS.forEach((ev) => addEventListener(ev, reset, { passive: true }));
    arm();
    return () => {
      clearTimeout(t);
      EVENTS.forEach((ev) => removeEventListener(ev, reset));
    };
  }, []);

  // While idle, the image keeps tearing: a glitch burst every 1.2–3.2s.
  useEffect(() => {
    if (!on) return;
    let t: ReturnType<typeof setTimeout>;
    const loop = (delay: number) => {
      t = setTimeout(async () => {
        await app.current?.flicker(2 + ((Math.random() * 3) | 0), 'glitch');
        loop(1200 + Math.random() * 2000);
      }, delay);
    };
    loop(450);
    return () => clearTimeout(t);
  }, [on]);

  return (
    <div className={[s.idle, on ? s.on : ''].join(' ')} aria-hidden="true">
      <div className={s.idleCol}>
        <div className={s.idleArt}>
          <Apparition ref={app} name="idle_apparition.webp" mode="static" note="laughing, tearing in and out while the page is idle" className={s.idleApp} />
        </div>
        <div className={s.pd}>
          <span>PRESENT DAY</span>
          <span>PRESENT TIME</span>
        </div>
      </div>
      <div className={s.hint}>
        <span className={s.hintPointer}>move to return</span>
        <span className={s.hintTouch}>tap to return</span>
      </div>
    </div>
  );
}
