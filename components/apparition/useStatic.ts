'use client';

import { useEffect, type RefObject } from 'react';

/** Paint one frame of TV static. `tint` adds ~1.5% blood-red pixels (apparition slots). */
export function paintNoise(ctx: CanvasRenderingContext2D, w: number, h: number, tint = true) {
  const d = ctx.createImageData(w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = tint ? (Math.random() * 255) | 0 : (110 + Math.random() * 90) | 0;
    const red = tint && Math.random() > 0.985;
    d.data[i] = red ? 192 : v;
    d.data[i + 1] = red ? 16 : v;
    d.data[i + 2] = red ? 28 : v;
    d.data[i + 3] = 255;
  }
  ctx.putImageData(d, 0, 0);
}

/**
 * Animated static on a small canvas at ~11fps. Runs only while the canvas is
 * on screen and the document is visible.
 */
export function useStatic(ref: RefObject<HTMLCanvasElement | null>, enabled: boolean, fps = 11, tint = true) {
  useEffect(() => {
    const c = ref.current;
    if (!c || !enabled) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    paintNoise(ctx, c.width, c.height, tint);
    let visible = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      const should = visible && !document.hidden;
      if (should && !timer) timer = setInterval(() => paintNoise(ctx, c.width, c.height, tint), 1000 / fps);
      if (!should && timer) {
        clearInterval(timer);
        timer = undefined;
      }
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(c);
    document.addEventListener('visibilitychange', sync);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      if (timer) clearInterval(timer);
    };
  }, [ref, enabled, fps, tint]);
}
