import Link from 'next/link';
import s from './not-found.module.css';

export const metadata = { title: 'no carrier · Into the wired' };

export default function NotFound() {
  return (
    <main className={s.wrap}>
      <div className={s.card}>
        <span className={s.lyr}>Layer:404</span>
        <span className={`${s.word} rgb`}>NO CARRIER</span>
      </div>
      <p className={s.body}>Nothing is connected at this address. Not even on the wired.</p>
      <Link href="/" className={s.back}>
        ← back to present day, present time
      </Link>
    </main>
  );
}
