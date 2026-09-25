import type { ButtonHTMLAttributes } from 'react';
import s from './ui.module.css';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'go' | 'ghost' };

/** `go` = solid ink primary; `ghost` = 1px outline. */
export function Button({ variant = 'go', className, type = 'button', ...rest }: Props) {
  return <button type={type} className={[s[variant], className ?? ''].join(' ')} {...rest} />;
}
