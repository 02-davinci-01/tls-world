import type { ReactNode } from 'react';
import { Stamp } from './Stamp';
import s from './ui.module.css';

type Props = { kind: 'verum' | 'falsum'; children: ReactNode; className?: string; 'data-k'?: string };

export function Verdict({ kind, children, className, ...rest }: Props) {
  return (
    <div className={[s.verdict, 'fade', className ?? ''].join(' ')} {...rest}>
      <Stamp kind={kind} />
      <span>{children}</span>
    </div>
  );
}
