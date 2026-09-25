'use client';

import { useCallback, useRef } from 'react';
import { anim } from '@/lib/motion';
import { color, type Letter } from './paint';
import s from './Layer02.module.css';

const ARC = 26;
const DURATION = 1300;

/**
 * Flies a paint blob between two elements inside a stage. Render `<div ref={layer} className=…/>`
 * (absolutely positioned over the stage, never given React children) to host the flyers.
 */
export function useFlight() {
  const layer = useRef<HTMLDivElement>(null);
  const fly = useCallback(async (from: Element | null, to: Element | null, letters: Letter[], signal: AbortSignal) => {
    const host = layer.current;
    if (!host || !from || !to) return;
    const r0 = host.getBoundingClientRect();
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const x0 = a.left + a.width / 2 - r0.left;
    const y0 = a.top + a.height / 2 - r0.top;
    const x1 = b.left + b.width / 2 - r0.left;
    const y1 = b.top + b.height / 2 - r0.top;
    const f = document.createElement('div');
    f.className = s.flyer;
    f.style.background = color(letters);
    f.textContent = letters.join('');
    host.appendChild(f);
    try {
      await anim(
        DURATION,
        (k) => {
          f.style.left = x0 + (x1 - x0) * k + 'px';
          f.style.top = y0 + (y1 - y0) * k - Math.sin(Math.PI * k) * ARC + 'px';
        },
        signal,
      );
    } finally {
      f.remove();
    }
  }, []);
  return { layer, fly };
}
