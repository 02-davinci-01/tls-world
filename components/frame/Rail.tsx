import s from './frame.module.css';

export function Rail({ children, className }: { children: string; className?: string }) {
  return <div className={[s.rail, className ?? ''].join(' ')}>{children}</div>;
}
