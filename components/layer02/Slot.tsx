import type { ReactNode } from 'react';
import { Blob } from './Blob';
import { Formula } from './Formula';
import type { FormulaSpec, Letter } from './paint';
import s from './Layer02.module.css';

export type SlotState = { letters: Letter[]; f?: FormulaSpec; on: boolean };
export const OFF: SlotState = { letters: [], on: false };
export const secret = (l: Letter): SlotState => ({ letters: [l], on: true });

type Props = { id: string; state: SlotState; label: ReactNode; isKey?: boolean; noFormula?: boolean };

/** A party-card row: blob + label + formula. Inks in when filled. */
export function Slot({ id, state, label, isKey, noFormula }: Props) {
  return (
    <div data-slot={id} className={[s.slot, state.on ? s.on : ''].join(' ')}>
      <Blob letters={state.letters} size={isKey ? 'key' : 'md'} />
      <span>
        {label}
        {!noFormula && (
          <>
            <br />
            <Formula f={state.f} />
          </>
        )}
      </span>
    </div>
  );
}
