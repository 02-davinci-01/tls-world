import { Footer } from '@/components/global/Footer';
import { Hero } from '@/components/hero/Hero';
import { Layer01 } from '@/components/layer01/Layer01';
import { Layer02 } from '@/components/layer02/Layer02';
import { Layer03 } from '@/components/layer03/Layer03';
import { FreeCertAd } from '@/components/layer04/FreeCertAd';
import { Sky } from '@/components/sky/Sky';

export default function Page() {
  return (
    <div className="page">
      <Sky />
      <Hero />
      <main>
        <Layer01 />
        <Layer02 />
        <Layer03 />
        <FreeCertAd />
      </main>
      <Footer />
    </div>
  );
}
