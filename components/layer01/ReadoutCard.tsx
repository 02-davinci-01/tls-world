import type { ReactNode } from 'react';
import s from './Layer01.module.css';

export const Dim = ({ children }: { children: ReactNode }) => <span className={s.dim}>{children}</span>;
export const Red = ({ children }: { children: ReactNode }) => <span className={s.red}>{children}</span>;
export const Hi = ({ children }: { children: ReactNode }) => <b>{children}</b>;

export type CardState = { content: ReactNode | null; leak: boolean; n: number };

export function ReadoutCard({ title, card }: { title: string; card: CardState }) {
  return (
    <div className={[s.rc, card.leak ? s.leak : ''].join(' ')}>
      <h4>{title}</h4>
      <pre key={card.n} className={card.content ? 'fade' : undefined}>
        {card.content ?? <Dim>send a request</Dim>}
      </pre>
    </div>
  );
}
