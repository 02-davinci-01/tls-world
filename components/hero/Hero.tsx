import { Rail } from '@/components/frame/Rail';
import s from './Hero.module.css';

export function Hero() {
  return (
    <header className={s.hero}>
      <div>
        <h1>
          Into <span className={`${s.u} rgb wiredword`}>the wired</span>
        </h1>
        <p className={s.lede}>how do you resolve an identity crisis in the virtual world?</p>
        <dl className={s.meta}>
          <dt>host</dt>
          <dd>github.com:443</dd>
          <dt>stack</dt>
          <dd>HAProxy → Node, self-signed lab cert</dd>
          <dt>drawn by</dt>
          <dd>02-davinci-01</dd>
        </dl>
      </div>
      <Rail className={s.rail}>present day, present time</Rail>
    </header>
  );
}
