import { prefersReducedMotion } from './useReducedMotion';

/** Ease-in-out sine, the JS twin of cubic-bezier(.45,0,.55,1). */
export const ease = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

const abortError = () => new DOMException('Aborted', 'AbortError');
export const isAbort = (e: unknown) => e instanceof DOMException && e.name === 'AbortError';

/**
 * Eased rAF animation. `cb` receives the eased progress 0→1.
 * Under reduced motion it completes in a single frame.
 * Rejects with an AbortError if `signal` aborts.
 */
export function anim(ms: number, cb: (k: number) => void, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const dur = prefersReducedMotion() ? 1 : ms;
    const t0 = performance.now();
    let raf = 0;
    const onAbort = () => {
      cancelAnimationFrame(raf);
      reject(abortError());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    const frame = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      cb(ease(k));
      if (k < 1) raf = requestAnimationFrame(frame);
      else {
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }
    };
    raf = requestAnimationFrame(frame);
  });
}

/** setTimeout as a promise. Reduced motion → 0ms. Rejects with AbortError on abort. */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return realSleep(prefersReducedMotion() ? 0 : ms, signal);
}

/** Like sleep, but ignores reduced motion (for countdowns and other real-time waits). */
export function realSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const onAbort = () => {
      clearTimeout(t);
      reject(abortError());
    };
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Restart a CSS animation class on an element. */
export function replayClass(el: Element | null, cls: string) {
  if (!el) return;
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
}
