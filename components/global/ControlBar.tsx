import type { ReactNode } from 'react';
import s from './global.module.css';

/** Two quiet corner controls: the player launcher bottom-left, the hum (and debug) bottom-right. */
export function ControlBar({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <>
      <div className={`${s.bar} ${s.barLeft}`}>{left}</div>
      <div className={`${s.bar} ${s.barRight}`}>{right}</div>
    </>
  );
}
