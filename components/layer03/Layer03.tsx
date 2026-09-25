import { Sheet } from '@/components/frame/Sheet';
import { IdentityLab } from './IdentityLab';
import { ToyRsa } from './ToyRsa';
import s from './Layer03.module.css';

export function Layer03() {
  return (
    <Sheet
      id="l3"
      layer="03"
      word="IDENTITY"
      slot="card_03.webp"
      slotNote="flickers 2 frames when the title card first scrolls in"
      rail="who is on the other side"
      title="Identity"
      subject="chain of trust, CertificateVerify"
      revision="protocol 7"
      intro="The piece Layer:02 was missing. Run the command against a site with a good chain, then one with a broken chain, and watch the output get read as a chain of seals, from a root you already trust down to this very connection."
    >
      <IdentityLab />
      <ToyRsa />
      <p className={s.note}>
        Toy numbers. Real keys are 2048-bit RSA or 256-bit ECDSA, and github.com uses ECDSA. The idea is the same for
        both: only the private key can make the seal, and anyone with the public key can check it.
      </p>
    </Sheet>
  );
}
