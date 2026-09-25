import { Fragment } from 'react';
import { sorted, type FormulaSpec, type Letter } from './paint';
import s from './Layer02.module.css';

export const Lt = ({ l }: { l: Letter }) => <span className={`${s.lt} ${s[l]}`}>{l}</span>;

export function Sum({ ls }: { ls: readonly Letter[] }) {
  return (
    <>
      {ls.map((l, i) => (
        <Fragment key={i}>
          {i > 0 && ' + '}
          <Lt l={l} />
        </Fragment>
      ))}
    </>
  );
}

/** `Y + B`, or `(Y + G) + B` with `= B + G + Y` highlighted on the next line. */
export function Formula({ f }: { f?: FormulaSpec }) {
  if (!f) return <code className={s.f} />;
  if ('sum' in f)
    return (
      <code className={s.f}>
        <Sum ls={f.sum} />
      </code>
    );
  return (
    <code className={s.f}>
      (<Sum ls={f.recv} />) + <Lt l={f.own} />
      <span className={s.eq}>
        = <span className={s.res}><Sum ls={sorted([...f.recv, f.own])} /></span>
      </span>
    </code>
  );
}
