import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { AssetsProvider } from '@/components/apparition/assets';
import { BootScreen } from '@/components/global/BootScreen';
import { ControlBar } from '@/components/global/ControlBar';
import { HumToggle } from '@/components/global/HumToggle';
import { MediaPlayer } from '@/components/global/MediaPlayer';
import { IdleOverlay } from '@/components/global/IdleOverlay';
import { SlotDebugToggle } from '@/components/global/SlotDebugToggle';
import { listSlotAssets } from '@/lib/assets';
import './globals.css';

const display = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--fd', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--fm', display: 'swap' });

export const metadata: Metadata = {
  title: 'Into the wired',
  description:
    'How do you resolve an identity crisis in the virtual world? An interactive walk through TLS termination, Diffie-Hellman and certificate verification, drawn as technical sheets.',
  openGraph: {
    title: 'Into the wired',
    description:
      'An interactive walk through TLS termination, Diffie-Hellman and certificate verification, drawn as technical sheets.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light',
  themeColor: '#f2f2f5',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable} booting`} suppressHydrationWarning>
      <body>
        <noscript>
          <style>{'[data-boot]{display:none!important}html.booting *{animation-play-state:running!important}'}</style>
        </noscript>
        <AssetsProvider files={listSlotAssets()}>
          {children}
          <IdleOverlay />
          <BootScreen />
          <ControlBar
            left={<MediaPlayer />}
            right={
              <>
                <SlotDebugToggle />
                <HumToggle />
              </>
            }
          />
        </AssetsProvider>
      </body>
    </html>
  );
}
