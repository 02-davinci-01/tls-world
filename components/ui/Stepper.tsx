'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { isAbort } from '@/lib/motion';
import { Button } from './Button';
import s from './ui.module.css';

export type Step = { caption: ReactNode; run?: (signal: AbortSignal) => Promise<void> };

/** Progress dots plus a caption that re-fades on every change. Polite live region. */
export function Caption({
  steps,
  index,
  red,
  controls,
  sticky,
  children,
}: {
  steps: number;
  index: number;
  red?: boolean;
  /** Optional buttons shown after the caption. */
  controls?: ReactNode;
  /** On phones, pin the caption to the bottom of the viewport while its parent is on screen. */
  sticky?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={[s.cap, controls ? s.capWithControls : '', sticky ? s.stickyCap : ''].join(' ')}>
      <div className={[s.dots, red ? s.redDots : ''].join(' ')} aria-hidden="true">
        {Array.from({ length: steps }, (_, j) => (
          <i key={j} className={j <= index ? s.on : undefined} />
        ))}
      </div>
      <p aria-live="polite">
        <span key={index + ':' + steps} className="fade" style={{ display: 'block' }}>
          {children}
        </span>
      </p>
      {controls}
    </div>
  );
}

type Props = {
  title: string;
  steps: Step[];
  /** Restore the stage to step 0. */
  onReset: () => void;
  red?: boolean;
  /** The stage, between header and caption. */
  children: ReactNode;
  /** Rendered after the caption (e.g. a verdict). */
  footer?: ReactNode;
  className?: string;
  id?: string;
};

export function Stepper({ title, steps, onReset, red, children, footer, className, id }: Props) {
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => () => ctrl.current?.abort(), []);

  const next = useCallback(async () => {
    if (busy || i >= steps.length - 1) return;
    const n = i + 1;
    setBusy(true);
    setI(n);
    const c = new AbortController();
    ctrl.current = c;
    try {
      await steps[n].run?.(c.signal);
    } catch (e) {
      if (!isAbort(e)) throw e;
      return;
    }
    setBusy(false);
  }, [busy, i, steps]);

  const reset = useCallback(() => {
    if (busy) return;
    setI(0);
    onReset();
  }, [busy, onReset]);

  return (
    <div className={[s.part, className ?? ''].join(' ')} id={id}>
      <div className={`${s.ph} ${s.stickyHead}`}>
        <h3>{title}</h3>
        <div className={s.btns}>
          <Button variant="ghost" onClick={reset} disabled={busy}>
            Replay
          </Button>
          <Button onClick={next} disabled={busy || i >= steps.length - 1}>
            Next step
          </Button>
        </div>
      </div>
      {children}
      <Caption steps={steps.length} index={i} red={red} sticky>
        {steps[i].caption}
      </Caption>
      {footer}
    </div>
  );
}
