import type { CSSProperties } from 'react';
import { color, type Letter } from './paint';
import s from './Layer02.module.css';

type Props = { letters: readonly Letter[]; size?: 'md' | 'key' | 'wire' | 'legend' };

/** A paint swatch. Single-letter blobs show their letter; Y uses dark text. */
export function Blob({ letters, size = 'md' }: Props) {
  const single = letters.length === 1 ? letters[0] : null;
  const style: CSSProperties = letters.length ? { background: color(letters) } : {};
  return (
    <i data-blob="" className={[s.blob, s[size], single === 'Y' ? s.dk : ''].join(' ')} style={style} aria-hidden="true">
      {single}
    </i>
  );
}
