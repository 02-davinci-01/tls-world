'use client';

import { useCallback, useState } from 'react';
import { GreedSequence } from './GreedSequence';
import s from './Layer04.module.css';

const TAPE =
  '★ LIMITED TIME OFFER ★ TRUSTED BY 99.9% OF BROWSERS* ★ NO CSR REQUIRED ★ WILDCARD ★ VALID FOR 100 YEARS ★ ROOT-SIGNED ★ ACT NOW ★ ONLY 3 LEFT ★';

/** Layer:04 · sponsored. Deliberately off-system: a 2004 banner ad in a technical drawing. */
export function FreeCertAd() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <section className={s.adwrap} id="l4" aria-label="Layer:04, sponsored">
      <div className={s.adlabel}>Layer:04 · sponsored</div>
      <div className={s.ad}>
        <div className={s.tape} aria-hidden="true">
          <span>{TAPE}</span>
        </div>
        <div className={s.adclose} aria-hidden="true">
          ×
        </div>
        <div className={s.adbody}>
          <div className={s.burst} aria-hidden="true">
            FREE!!
          </div>
          <div>
            <h3>
              Click here for a <span className={s.blink}>FREE</span> CA certificate!!
            </h3>
            <p className={s.pitch}>
              Root-signed. Wildcard. Works everywhere. <s>$499.99</s> <b>$0.00</b>
            </p>
            <button className={s.adbtn} type="button" onClick={() => setOpen(true)}>
              CLAIM MY CERTIFICATE ▸
            </button>
            <div className={s.adfine}>
              *browsers that trust everything. <u>3,142 people</u> claimed theirs today. Offer void where trust is
              required.
            </div>
          </div>
        </div>
      </div>
      <GreedSequence open={open} onClose={close} />
    </section>
  );
}
