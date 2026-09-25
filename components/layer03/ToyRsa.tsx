'use client';

import { useCallback, useState } from 'react';
import { Stepper, type Step } from '@/components/ui/Stepper';
import s from './Layer03.module.css';

type Box = 'pub' | 'priv' | 'h' | 'sig' | 'chk' | 'forge';
const START: Box[] = ['pub', 'priv'];

/**
 * Textbook RSA without padding, on purpose: p = 61, q = 53, n = 3233, e = 17, d = 2753.
 * 65^2753 mod 3233 = 588 · 588^17 mod 3233 = 65 · 1234^17 mod 3233 = 2183.
 */
export function ToyRsa() {
  const [on, setOn] = useState<Set<Box>>(() => new Set(START));
  const add = (...ks: Box[]) => setOn((cur) => new Set([...cur, ...ks]));
  const onReset = useCallback(() => setOn(new Set(START)), []);

  const steps: Step[] = [
    { caption: 'github.com holds a key pair. The public half is printed in its certificate for anyone to read. The private half never leaves the server.' },
    { caption: 'It hashes everything said in the handshake, both paint mixes included, and seals that hash with its private key.', run: async () => add('h', 'sig') },
    { caption: 'You open the seal with the public key from the certificate. You get back 65, the same hash you computed yourself, so the seal is genuine.', run: async () => add('chk') },
    { caption: 'Mallory can replay github.com’s certificate, because it’s public. What she can’t do is make the seal. Without d, her best guess opens to garbage.', run: async () => add('forge') },
  ];

  const box = (k: Box, extra = '') => [s.rbox, extra, on.has(k) ? s.on : ''].join(' ');

  return (
    <Stepper title="Why the last seal can't be faked" steps={steps} onReset={onReset} className={s.rsaPart}>
      <div className={s.rsa}>
        <div className={box('pub')}>
          <span>public key, printed in the certificate</span>
          <code>n = 3233, e = 17</code>
        </div>
        <div className={box('priv', s.priv)}>
          <span>private key, never leaves github.com</span>
          <code>d = 2753</code>
        </div>
        <div className={box('h')}>
          <span>hash of this handshake, both mixes included</span>
          <code>h = 65</code>
        </div>
        <div className={box('sig')}>
          <span>github.com seals it with the private key</span>
          <code>
            s = 65<sup>2753</sup> mod 3233 = 588
          </code>
        </div>
        <div className={box('chk')}>
          <span>you open the seal with the public key</span>
          <code>
            588<sup>17</sup> mod 3233 = 65 <b className={s.okm}>= h ✓</b>
          </code>
        </div>
        <div className={box('forge', s.mal)}>
          <span>Mallory has the certificate, but not d</span>
          <code>
            1234<sup>17</sup> mod 3233 = 2183 <b className={s.badm}>≠ h ✕</b>
          </code>
        </div>
      </div>
    </Stepper>
  );
}
