'use client';

import { useState } from 'react';
import s from './global.module.css';

/** Outlines every asset slot. Rendered only when NEXT_PUBLIC_SHOW_SLOTS=1. */
export function SlotDebugToggle() {
  const [on, setOn] = useState(false);
  if (process.env.NEXT_PUBLIC_SHOW_SLOTS !== '1') return null;
  return (
    <button
      type="button"
      className={on ? s.on : undefined}
      aria-pressed={on}
      onClick={() => {
        document.body.classList.toggle('slots', !on);
        setOn(!on);
      }}
    >
      <span className={s.dot} aria-hidden="true" />
      asset slots
    </button>
  );
}
