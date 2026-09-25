'use client';

import s from './ui.module.css';

type Props<T extends string> = {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
};

export function Segmented<T extends string>({ label, options, value, onChange, disabled }: Props<T>) {
  return (
    <div className={s.seg} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          className={o.value === value ? s.on : undefined}
          onClick={() => !disabled && onChange(o.value)}
          aria-disabled={disabled || undefined}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
