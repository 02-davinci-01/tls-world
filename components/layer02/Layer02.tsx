import { Sheet } from '@/components/frame/Sheet';
import { Apparition } from '@/components/apparition/Apparition';
import { Blob } from './Blob';
import { MitmExchange } from './MitmExchange';
import { PaintExchange } from './PaintExchange';
import type { Letter } from './paint';
import s from './Layer02.module.css';

const LEGEND: [Letter, string][] = [
  ['Y', 'public, everyone has it'],
  ['B', 'your secret'],
  ['G', 'github.com’s secret'],
  ['R', 'Mallory’s secret'],
];

export function Layer02() {
  return (
    <Sheet
      id="l2"
      layer="02"
      word="EXCHANGE"
      slot="card_02.webp"
      slotNote="flickers 2 frames when the title card first scrolls in"
      rail="nothing crossed the wire"
      title="Exchange"
      subject="Diffie-Hellman, man in the middle"
      intro="How two strangers end up holding the same secret while every message between them is public. Paint stands in for the maths: mixing is easy, unmixing is practically impossible. The letters show exactly what went into each mix."
    >
      <div className={s.legend}>
        {LEGEND.map(([l, t]) => (
          <span key={l}>
            <Blob letters={[l]} size="legend" />
            <span>
              <span className="sr-only">{l}: </span>
              {t}
            </span>
          </span>
        ))}
      </div>

      <PaintExchange />

      <div className={s.interlude} aria-hidden="true">
        <svg viewBox="0 0 1000 170" preserveAspectRatio="none">
          <path d="M-10 40 Q250 110 520 30 Q780 110 1010 36" fill="none" stroke="#121216" strokeWidth="1" />
          <path d="M-10 52 Q250 122 520 42 Q780 122 1010 48" fill="none" stroke="#121216" strokeWidth="1" />
          <path d="M-10 64 Q250 134 520 54 Q780 134 1010 60" fill="none" stroke="#121216" strokeWidth="1" />
          <line x1="520" y1="10" x2="520" y2="170" stroke="#121216" strokeWidth="3" />
        </svg>
        <Apparition
          name="interlude_wires.webp"
          mode="static"
          note="a still cutaway between the two halves: sky, wires, nobody"
          className={s.interludeApp}
        />
        <div className={s.cap2}>meanwhile, somewhere on the line</div>
      </div>

      <MitmExchange />
    </Sheet>
  );
}
