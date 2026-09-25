'use client';

import { useCallback, useRef, useState } from 'react';
import { sleep } from '@/lib/motion';
import { Stepper, type Step } from '@/components/ui/Stepper';
import { Verdict } from '@/components/ui/Verdict';
import { formula, sum } from './paint';
import { OFF, secret, Slot, type SlotState } from './Slot';
import { useFlight } from './useFlight';
import s from './Layer02.module.css';

type Key =
  | 'you.sec' | 'you.mix' | 'you.rcv' | 'you.key'
  | 'mal.sec' | 'mal.mix' | 'mal.k1' | 'mal.k2'
  | 'srv.sec' | 'srv.mix' | 'srv.rcv' | 'srv.key';

const initialSlots = (): Record<Key, SlotState> => ({
  'you.sec': secret('B'), 'you.mix': OFF, 'you.rcv': OFF, 'you.key': OFF,
  'mal.sec': secret('R'), 'mal.mix': OFF, 'mal.k1': OFF, 'mal.k2': OFF,
  'srv.sec': secret('G'), 'srv.mix': OFF, 'srv.rcv': OFF, 'srv.key': OFF,
});

/** Part B: clever, but it can't tell who. */
export function MitmExchange() {
  const [slots, setSlots] = useState(initialSlots);
  const [verdict, setVerdict] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const { layer, fly } = useFlight();

  const put = (patch: Partial<Record<Key, SlotState>>) => setSlots((cur) => ({ ...cur, ...patch }));
  const b = (k: Key) => stage.current?.querySelector(`[data-slot="${k}"] [data-blob]`) ?? null;

  const onReset = useCallback(() => {
    setSlots(initialSlots());
    setVerdict(false);
  }, []);

  const steps: Step[] = [
    {
      caption: (
        <>
          The same exchange, but Mallory sits on the wire with her own secret, <b>R</b>. Every message passes through her.
        </>
      ),
    },
    {
      caption: 'You send Y + B toward github.com. Mallory keeps it and forwards her own Y + R instead. github.com has no way to tell.',
      run: async (signal) => {
        put({
          'you.mix': { letters: ['Y', 'B'], f: sum('Y', 'B'), on: true },
          'mal.mix': { letters: ['Y', 'R'], f: sum('Y', 'R'), on: true },
        });
        await sleep(400, signal);
        await fly(b('you.mix'), b('mal.mix'), ['Y', 'B'], signal);
        await fly(b('mal.mix'), b('srv.rcv'), ['Y', 'R'], signal);
        put({ 'srv.rcv': { letters: ['Y', 'R'], f: sum('Y', 'R'), on: true } });
      },
    },
    {
      caption: 'github.com sends Y + G toward you. Mallory swaps it for Y + R again.',
      run: async (signal) => {
        put({ 'srv.mix': { letters: ['Y', 'G'], f: sum('Y', 'G'), on: true } });
        await sleep(400, signal);
        await fly(b('srv.mix'), b('mal.mix'), ['Y', 'G'], signal);
        await fly(b('mal.mix'), b('you.rcv'), ['Y', 'R'], signal);
        put({ 'you.rcv': { letters: ['Y', 'R'], f: sum('Y', 'R'), on: true } });
      },
    },
    {
      caption: (
        <>
          Everyone finishes the maths. You hold <b>B + R + Y</b>. github.com holds <b>G + R + Y</b>. Mallory holds both,
          so she decrypts, reads and re-encrypts everything while each of you thinks the line is private.
        </>
      ),
      run: async (signal) => {
        put({
          'you.key': { letters: ['Y', 'R', 'B'], f: formula(['Y', 'R'], 'B'), on: true },
          'srv.key': { letters: ['Y', 'R', 'G'], f: formula(['Y', 'R'], 'G'), on: true },
        });
        await sleep(700, signal);
        put({
          'mal.k1': { letters: ['Y', 'B', 'R'], f: formula(['Y', 'B'], 'R'), on: true },
          'mal.k2': { letters: ['Y', 'G', 'R'], f: formula(['Y', 'G'], 'R'), on: true },
        });
        await sleep(500, signal);
        setVerdict(true);
      },
    },
  ];

  return (
    <Stepper
      title="Clever, but it can't tell who"
      steps={steps}
      onReset={onReset}
      red
      footer={
        verdict && (
          <Verdict kind="falsum">
            Diffie-Hellman proves you share a key with <em>someone</em>. It can’t tell you who. The fix is for github.com
            to put a seal on its mix that only it can make. That’s <a href="#l3">Layer:03</a>.
          </Verdict>
        )
      }
    >
      <div className={s.stage} ref={stage}>
        <div className={`${s.trio} ${s.b}`}>
          <div className={s.party}>
            <div className={s.pn}>You</div>
            <Slot id="you.sec" state={slots['you.sec']} noFormula label="your secret" />
            <Slot id="you.mix" state={slots['you.mix']} label="you send" />
            <Slot id="you.rcv" state={slots['you.rcv']} label="you receive, and assume it’s github.com’s" />
            <Slot id="you.key" state={slots['you.key']} label="you compute" isKey />
          </div>
          <div className={`${s.party} ${s.mal}`}>
            <div className={s.pn}>Mallory</div>
            <Slot id="mal.sec" state={slots['mal.sec']} noFormula label={<>her secret<br /><em className={s.redEm}>she sits on the wire</em></>} />
            <Slot id="mal.mix" state={slots['mal.mix']} label="she sends to both sides" />
            <Slot id="mal.k1" state={slots['mal.k1']} label="her key with you" isKey />
            <Slot id="mal.k2" state={slots['mal.k2']} label="her key with github.com" isKey />
            <div className={s.fine}>affiliation: knights of the eastern calculus, probably</div>
          </div>
          <div className={s.party}>
            <div className={s.pn}>github.com</div>
            <Slot id="srv.sec" state={slots['srv.sec']} noFormula label="its secret" />
            <Slot id="srv.mix" state={slots['srv.mix']} label="it sends" />
            <Slot id="srv.rcv" state={slots['srv.rcv']} label="it receives, and assumes it’s yours" />
            <Slot id="srv.key" state={slots['srv.key']} label="it computes" isKey />
          </div>
        </div>
        <div className={s.arrows} aria-hidden="true">
          <span>you</span>
          <span>everything passes through her</span>
          <span>github.com</span>
        </div>
        <div ref={layer} className={s.flyLayer} aria-hidden="true" />
      </div>
    </Stepper>
  );
}
