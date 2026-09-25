import s from './ui.module.css';

/** verum = violet, verified. falsum = red, broken. */
export function Stamp({ kind }: { kind: 'verum' | 'falsum' }) {
  return <span className={[s.stamp, kind === 'falsum' ? s.no : ''].join(' ')}>{kind}</span>;
}
