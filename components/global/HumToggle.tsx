'use client';

import { useEffect, useRef, useState } from 'react';
import { setGlobal, useGlobal } from '@/lib/store';
import s from './global.module.css';

const LEVEL = 0.35;
/** Events that count as a user gesture, so an AudioContext may start. */
const GESTURES = ['pointerdown', 'keydown', 'touchend'] as const;

/**
 * The hum of the wires: 100Hz sawtooth + harmonics through a 900Hz low-pass.
 * On by default. Browsers only allow audio after a gesture, so it becomes audible on the
 * first click, tap or key press anywhere (skipping the boot screen counts).
 */
export function HumToggle() {
  const [armed, setArmed] = useState(true);
  const music = useGlobal((g) => g.musicOn);
  const audio = useRef<{ ctx: AudioContext; gain: GainNode } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const armedRef = useRef(armed);
  const musicRef = useRef(music);

  const build = () => {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    lp.connect(gain);
    gain.connect(ctx.destination);
    (
      [
        [100, 0.5],
        [200, 0.22],
        [300, 0.12],
        [400, 0.05],
      ] as const
    ).forEach(([f, g]) => {
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = f === 100 ? 'sawtooth' : 'sine';
      o.frequency.value = f;
      og.gain.value = g * 0.18;
      o.connect(og);
      og.connect(lp);
      o.start();
    });
    return { ctx, gain };
  };

  // Level follows: armed, not drowned out by the song, and audio allowed.
  const apply = (on: boolean) => {
    const a = audio.current;
    if (!a) return;
    if (on && a.ctx.state === 'suspended') void a.ctx.resume();
    a.gain.gain.setTargetAtTime(on ? LEVEL : 0, a.ctx.currentTime, 0.3);
    setGlobal({ humOn: on });
  };

  // First gesture anywhere starts the (armed) hum. The hum button handles its own click.
  useEffect(() => {
    if (audio.current) return;
    const start = (e: Event) => {
      if (btn.current && e.target instanceof Node && btn.current.contains(e.target)) return;
      GESTURES.forEach((ev) => removeEventListener(ev, start, true));
      audio.current ??= build();
      apply(armedRef.current && !musicRef.current);
    };
    GESTURES.forEach((ev) => addEventListener(ev, start, true));
    return () => GESTURES.forEach((ev) => removeEventListener(ev, start, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    armedRef.current = armed;
    musicRef.current = music;
    apply(armed && !music);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armed, music]);

  const toggle = () => {
    const next = !armed;
    if (next) audio.current ??= build();
    setArmed(next);
  };

  useEffect(
    () => () => {
      void audio.current?.ctx.close();
      setGlobal({ humOn: false });
    },
    [],
  );

  return (
    <button ref={btn} type="button" className={armed ? s.on : undefined} aria-pressed={armed} onClick={toggle}>
      hum: {armed ? (music ? 'paused' : 'on') : 'off'}
    </button>
  );
}
