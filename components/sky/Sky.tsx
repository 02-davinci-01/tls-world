'use client';

import { useEffect, useRef } from 'react';
import { Apparition } from '@/components/apparition/Apparition';
import { useGlobal } from '@/lib/store';
import { prefersReducedMotion } from '@/lib/useReducedMotion';
import s from './Sky.module.css';

const HUM_PERIOD = 9000;
const HUM_DELAY = 3000;

/** Power lines against a white sky. Draws itself once on load; a violet dot hums along the top cable. */
export function Sky() {
  const lit = useGlobal((g) => g.humOn || g.musicOn);
  const booted = useGlobal((g) => g.booted);
  const wrap = useRef<HTMLDivElement>(null);
  const wire = useRef<SVGPathElement>(null);
  const dot = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!booted) return;
    const p = wire.current;
    const d = dot.current;
    const w = wrap.current;
    if (!p || !d || !w) return;
    const L = p.getTotalLength();
    const place = (k: number) => {
      const q = p.getPointAtLength(k * L);
      d.setAttribute('cx', String(q.x));
      d.setAttribute('cy', String(q.y));
    };
    if (prefersReducedMotion()) {
      place(0.42);
      return;
    }
    const t0 = performance.now() + HUM_DELAY;
    let raf = 0;
    let visible = true;
    const frame = (now: number) => {
      const k = ((now - t0) / HUM_PERIOD) % 1;
      if (k >= 0) place(k);
      raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      cancelAnimationFrame(raf);
      if (visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(w);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [booted]);

  return (
    <div className={s.sky} ref={wrap}>
      <svg viewBox="0 0 1180 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <pattern id="rd" width="46" height="30" patternUnits="userSpaceOnUse">
            <rect width="46" height="30" fill="#121216" />
            <circle cx="7" cy="6" r="3.2" fill="#c0101c" />
            <circle cx="26" cy="14" r="2.1" fill="#c0101c" />
            <circle cx="39" cy="4" r="1.6" fill="#c0101c" />
            <circle cx="15" cy="23" r="2.6" fill="#c0101c" />
            <circle cx="36" cy="25" r="3" fill="#c0101c" />
            <circle cx="2" cy="17" r="1.3" fill="#c0101c" />
          </pattern>
        </defs>
        <line className={`${s.ground} ${s.drawIn}`} x1="0" y1="268" x2="1180" y2="268" />
        <polygon className={s.shadow} points="176,268 184,268 400,292 380,299" />
        <polygon className={s.shadow} points="616,268 624,268 860,290 842,298" />
        <polygon className={s.shadow} points="1036,268 1044,268 1200,284 1200,292" />
        <line className={`${s.pole} ${s.drawIn}`} x1="180" y1="30" x2="180" y2="268" />
        <line className={`${s.arm} ${s.drawIn}`} x1="146" y1="48" x2="214" y2="48" />
        <line className={`${s.arm} ${s.drawIn}`} x1="156" y1="70" x2="204" y2="70" />
        <line className={`${s.pole} ${s.drawIn}`} x1="620" y1="18" x2="620" y2="268" />
        <line className={`${s.arm} ${s.drawIn}`} x1="586" y1="36" x2="654" y2="36" />
        <line className={`${s.arm} ${s.drawIn}`} x1="596" y1="58" x2="644" y2="58" />
        <line className={`${s.pole} ${s.drawIn}`} x1="1040" y1="30" x2="1040" y2="268" />
        <line className={`${s.arm} ${s.drawIn}`} x1="1006" y1="48" x2="1074" y2="48" />
        <line className={`${s.arm} ${s.drawIn}`} x1="1016" y1="70" x2="1064" y2="70" />
        <path ref={wire} id="hw" className={`${s.cab} ${s.drawIn}`} d="M-20 62 Q70 96 150 46 Q385 118 590 34 Q830 118 1010 46 Q1110 90 1200 58" />
        <path className={`${s.cab} ${s.drawIn}`} d="M-20 68 Q80 102 180 46 Q400 124 620 34 Q840 124 1040 46 Q1120 96 1200 64" />
        <path className={`${s.cab} ${s.drawIn}`} d="M-20 74 Q90 108 210 46 Q415 130 650 34 Q850 130 1070 46 Q1130 102 1200 70" />
        <path className={`${s.cab} ${s.drawIn}`} d="M-20 92 Q80 118 162 68 Q390 140 600 56 Q835 140 1020 68 Q1115 110 1200 86" />
        <path className={`${s.cab} ${s.drawIn}`} d="M-20 98 Q90 124 198 68 Q410 146 640 56 Q845 146 1058 68 Q1125 116 1200 92" />
        <text className={s.lbl} x="188" y="262">pole 01</text>
        <text className={s.lbl} x="628" y="262">pole 02</text>
        <text className={s.lbl} x="1048" y="262">pole 03</text>
        <circle ref={dot} className={s.hum} r="2.6" cx="-10" cy="62" />
      </svg>
      <Apparition
        name="hero_figure.webp"
        mode="faint"
        note="a still figure under pole 02. Faint, sharpens while the hum or the music is on"
        className={s.figure}
        style={lit ? { opacity: 0.6 } : undefined}
      />
    </div>
  );
}
