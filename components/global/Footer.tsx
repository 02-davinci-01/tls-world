import s from './global.module.css';

export function Footer() {
  return (
    <footer className={s.footer}>
      <div className={`${s.close} rgb`}>Close the world, open the nExt.</div>
      HAProxy → Node lab, :443, self-signed
    </footer>
  );
}
