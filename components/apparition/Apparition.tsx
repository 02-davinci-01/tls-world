'use client';

import { useCallback, useImperativeHandle, useRef, useState, type CSSProperties, type Ref } from 'react';
import { prefersReducedMotion } from '@/lib/useReducedMotion';
import { useAssets } from './assets';
import { useStatic } from './useStatic';
import s from './Apparition.module.css';

/**
 * `blink` shows the slot for each frame (ghost slots appear, others jitter).
 * `glitch` keeps it visible and tears it: RGB split, jitter and a shifting slice per frame.
 */
export type FlickerStyle = 'blink' | 'glitch';
export type ApparitionHandle = { flicker: (frames?: number, style?: FlickerStyle) => Promise<void> };

type Props = {
  /** Debug label and default src basename. */
  name: string;
  /** Explicit src. Defaults to /lain/<name>. */
  src?: string;
  mode?: 'ghost' | 'faint' | 'static';
  /** Debug-only description. */
  note?: string;
  /** true = no greyscale treatment. */
  color?: boolean;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<ApparitionHandle>;
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Apparition({ name, src, mode = 'static', note, color = false, className, style, ref }: Props) {
  const assets = useAssets();
  const [broken, setBroken] = useState(false);
  const hasImg = !broken && (src !== undefined || assets.has(name));
  const url = src ?? `/lain/${name}`;

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flickering = useRef(false);
  useStatic(canvasRef, !hasImg);

  const flicker = useCallback(async (frames = 3, style: FlickerStyle = 'blink') => {
    const el = rootRef.current;
    if (!el || flickering.current || prefersReducedMotion()) return;
    flickering.current = true;
    const cls = style === 'glitch' ? s.glitch : s.on;
    for (let i = 0; i < frames; i++) {
      if (style === 'glitch') {
        const top = Math.random() * 70;
        el.style.setProperty('--slice-top', `${top}%`);
        el.style.setProperty('--slice-bottom', `${Math.max(0, 100 - top - 8 - Math.random() * 22)}%`);
        el.style.setProperty('--slice-x', `${(Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 10)}px`);
      }
      el.classList.add(cls);
      await wait(50 + Math.random() * 70);
      el.classList.remove(cls);
      await wait(40 + Math.random() * 90);
    }
    flickering.current = false;
  }, []);
  useImperativeHandle(ref, () => ({ flicker }), [flicker]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-slot={name}
      data-has-img={hasImg ? '' : undefined}
      className={[s.app, s[mode], color ? s.color : '', className ?? ''].join(' ')}
      style={style}
    >
      {hasImg ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" onError={() => setBroken(true)} />
          {/* torn slice, only visible during a glitch frame */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className={s.slice} />
        </>
      ) : (
        <canvas ref={canvasRef} width={64} height={80} />
      )}
      <div className={s.tag}>
        slot · {name}
        {note ? (
          <>
            <br />
            {note}
          </>
        ) : null}
      </div>
    </div>
  );
}
