import { Sheet } from '@/components/frame/Sheet';
import { OffloadLab } from './OffloadLab';

export function Layer01() {
  return (
    <Sheet
      id="l1"
      layer="01"
      word="TERMINATION"
      slot="card_01.webp"
      slotNote="flickers 2 frames when the title card first scrolls in"
      rail="everyone is connected"
      title="Termination"
      subject="HTTP vs HTTPS, L7 routing"
      intro="Send a request and follow it across the wire. Plain HTTP shows everything to anyone on the line. HTTPS seals it, but then the load balancer has a choice: pass the sealed stream through blind, or open it and route by what's inside."
    >
      <OffloadLab />
    </Sheet>
  );
}
