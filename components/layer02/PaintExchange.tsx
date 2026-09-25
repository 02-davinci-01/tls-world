'use client';

import { useCallback, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { sleep } from '@/lib/motion';
import { Stepper, type Step } from '@/components/ui/Stepper';
import { Blob } from './Blob';
import { Formula, Sum } from './Formula';
import { formula, sum, type Letter } from './paint';
import { OFF, secret, Slot, type SlotState } from './Slot';
import { useFlight } from './useFlight';
import s from './Layer02.module.css';

type Key = 'you.sec' | 'you.mix' | 'you.key' | 'srv.sec' | 'srv.mix' | 'srv.key';
type WireItem = { id: string; letters: Letter[]; label: string; hidden: boolean };

const initialSlots = (): Record<Key, SlotState> => ({
  'you.sec': secret('B'),
  'you.mix': OFF,
  'you.key': OFF,
  'srv.sec': secret('G'),
  'srv.mix': OFF,
  'srv.key': OFF,
});
const initialWire = (): WireItem[] => [{ id: 'y', letters: ['Y'], label: 'the public colour', hidden: false }];

/** Part A: a key that was never sent. */
export function PaintExchange() {
  const [slots, setSlots] = useState(initialSlots);
  const [wire, setWire] = useState(initialWire);
  const [note, setNote] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const { layer, fly } = useFlight();

  const put = (patch: Partial<Record<Key, SlotState>>) => setSlots((cur) => ({ ...cur, ...patch }));
  const blob = (sel: string) => stage.current?.querySelector(`${sel} [data-blob]`) ?? null;
  const slotBlob = (k: Key) => blob(`[data-slot="${k}"]`);
  const wireBlob = (id: string) => blob(`[data-wire="${id}"]`);

  const onReset = useCallback(() => {
    setSlots(initialSlots());
    setWire(initialWire());
    setNote(false);
  }, []);

  const steps: Step[] = [
    {
      caption: (
        <>
          You and github.com agree on a public colour, <b>Y</b>, out in the open. You secretly pick <b>B</b>. github.com
          secretly picks <b>G</b>. Neither secret ever leaves its box.
        </>
      ),
    },
    {
      caption: 'Each side mixes its secret into the public colour and sends the result. Anyone watching now holds Y, Y + B and Y + G.',
      run: async (signal) => {
        put({
          'you.mix': { letters: ['Y', 'B'], f: sum('Y', 'B'), on: true },
          'srv.mix': { letters: ['Y', 'G'], f: sum('Y', 'G'), on: true },
        });
        await sleep(500, signal);
        flushSync(() =>
          setWire((w) => [
            ...w,
            { id: 'yb', letters: ['Y', 'B'], label: 'your mix', hidden: true },
            { id: 'yg', letters: ['Y', 'G'], label: 'github.com’s mix', hidden: true },
          ]),
        );
        await Promise.all([
          fly(slotBlob('you.mix'), wireBlob('yb'), ['Y', 'B'], signal),
          fly(slotBlob('srv.mix'), wireBlob('yg'), ['Y', 'G'], signal),
        ]);
        setWire((w) => w.map((x) => ({ ...x, hidden: false })));
      },
    },
    {
      caption: (
        <>
          Each side pours its own secret into the mix it received. You get (Y + G) + B. github.com gets (Y + B) + G.
          Same three paints, same colour: <b>B + G + Y</b>.
        </>
      ),
      run: async (signal) => {
        await Promise.all([
          fly(wireBlob('yg'), slotBlob('you.key'), ['Y', 'G'], signal),
          fly(wireBlob('yb'), slotBlob('srv.key'), ['Y', 'B'], signal),
        ]);
        put({
          'you.key': { letters: ['Y', 'G', 'B'], f: formula(['Y', 'G'], 'B'), on: true },
          'srv.key': { letters: ['Y', 'B', 'G'], f: formula(['Y', 'B'], 'G'), on: true },
        });
        await sleep(500, signal);
        setNote(true);
      },
    },
  ];

  return (
    <Stepper title="A key that was never sent" steps={steps} onReset={onReset}>
      <div className={s.stage} ref={stage}>
        <div className={s.trio}>
          <div className={s.party}>
            <div className={s.pn}>You</div>
            <Slot id="you.sec" state={slots['you.sec']} noFormula label={<>your secret<br /><em>never leaves this box</em></>} />
            <Slot id="you.mix" state={slots['you.mix']} label="you send" />
            <Slot id="you.key" state={slots['you.key']} label="you compute" isKey />
          </div>
          <div className={s.wirecol}>
            <div className={s.wh}>on the wire, visible to everyone</div>
            {wire.map((w) => (
              <div key={w.id} data-wire={w.id} className={s.witem} style={w.hidden ? { visibility: 'hidden' } : undefined}>
                <Blob letters={w.letters} size="wire" />
                <span>
                  {w.label}
                  <br />
                  <Formula f={{ sum: w.letters }} />
                </span>
              </div>
            ))}
            {note && (
              <div className={s.nokey}>
                The key{' '}
                <code className={s.f}>
                  <span className={s.res}>
                    <Sum ls={['B', 'G', 'Y']} />
                  </span>
                </code>{' '}
                was never sent.
                <span className={s.try}>
                  A watcher’s best move is to pour both mixes together:{' '}
                  <code className={s.f}>
                    <Sum ls={['B', 'G', 'Y', 'Y']} />
                  </code>
                  . One Y too many, and paint doesn’t unmix. In TLS, unmixing is the discrete log on x25519.
                </span>
              </div>
            )}
          </div>
          <div className={s.party}>
            <div className={s.pn}>github.com</div>
            <Slot id="srv.sec" state={slots['srv.sec']} noFormula label={<>its secret<br /><em>never leaves this box</em></>} />
            <Slot id="srv.mix" state={slots['srv.mix']} label="it sends" />
            <Slot id="srv.key" state={slots['srv.key']} label="it computes" isKey />
          </div>
        </div>
        <div ref={layer} className={s.flyLayer} aria-hidden="true" />
      </div>
    </Stepper>
  );
}
