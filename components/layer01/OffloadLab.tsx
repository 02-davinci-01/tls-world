'use client';

import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { GEOMETRY } from './geometry';
import { OffloadDiagram } from './OffloadDiagram';
import { Dim, Hi, ReadoutCard, Red } from './ReadoutCard';
import { useOffloadSim, type Mode, type ReqPath } from './useOffloadSim';
import s from './Layer01.module.css';

const MODES = [
  { value: 'http', label: 'HTTP' },
  { value: 'pass', label: 'HTTPS passthrough' },
  { value: 'off', label: 'HTTPS offloaded' },
] as const satisfies readonly { value: Mode; label: string }[];

const PATHS = [
  { value: '/api', label: '/api' },
  { value: '/static', label: '/static' },
  { value: '/login', label: '/login' },
] as const satisfies readonly { value: ReqPath; label: string }[];

const FULL: Record<ReqPath, React.ReactNode> = {
  '/api': 'GET /api/repos HTTP/1.1\nHost: github.com\nCookie: user_session=9f2c71e0…\nAccept: application/json',
  '/static': 'GET /static/app.js HTTP/1.1\nHost: github.com\nCookie: user_session=9f2c71e0…',
  '/login': (
    <>
      {'POST /login HTTP/1.1\nHost: github.com\nContent-Type: application/x-www-form-urlencoded\n\nlogin=vedant&'}
      <Red>password=hunter2</Red>
    </>
  ),
};

const CONTENT = {
  full: (p: ReqPath) => FULL[p],
  eveSealed: (
    <>
      {'TLS application_data, 612 bytes\nSNI, from the handshake: github.com\n'}
      <Dim>method, path, cookies, body: ciphertext</Dim>
    </>
  ),
  lb: (mode: Mode, p: string, backend: string) =>
    mode === 'off' ? (
      <>
        {`decrypted with site.pem\npath ${p} → `}
        <Hi>{backend}</Hi>
        {'\nadds X-Forwarded-Proto: https'}
      </>
    ) : mode === 'pass' ? (
      <>
        {'sealed stream on :443\ncan read: SNI github.com\n'}
        <Red>can’t read the path</Red>
        {', so it\nrotates backends → '}
        <Hi>{backend}</Hi>
      </>
    ) : (
      <>
        {`plain request on :80\npath ${p} → `}
        <Hi>{backend}</Hi>
      </>
    ),
  be: (mode: Mode, p: ReqPath) =>
    mode === 'pass' ? (
      <>
        {'receives ciphertext and terminates\nTLS itself. '}
        <Red>{'Every backend needs\nthe certificate and the private key.'}</Red>
      </>
    ) : mode === 'off' ? (
      <>
        {FULL[p]}
        {'\n'}
        <Hi>{'X-Forwarded-Proto: https\nX-Forwarded-For: 203.0.113.7'}</Hi>
      </>
    ) : (
      FULL[p]
    ),
};

export function OffloadLab() {
  // Below 640px the landscape drawing would shrink its labels to ~3px, so draw it portrait.
  const tall = useMediaQuery('(max-width: 640px)');
  const geo = GEOMETRY[tall ? 'tall' : 'wide'];
  const sim = useOffloadSim(CONTENT, geo);
  return (
    <>
      <div className={s.ctrl}>
        <Segmented label="Protocol mode" options={MODES} value={sim.mode} onChange={sim.setMode} disabled={sim.busy} />
        <Segmented label="Request path" options={PATHS} value={sim.path} onChange={sim.setPath} disabled={sim.busy} />
        <Button onClick={sim.send} disabled={sim.busy}>
          Send request
        </Button>
      </div>
      <div className={s.m1}>
        <OffloadDiagram geo={geo} tall={tall} mode={sim.mode} lbState={sim.lbState} route={sim.route} packet={sim.packet} refs={sim.refs} />
        <div className={s.reads} aria-live="polite">
          <ReadoutCard title="What someone on the wire sees" card={sim.cards.eve} />
          <ReadoutCard title="What HAProxy can read" card={sim.cards.lb} />
          <ReadoutCard title="What the backend receives" card={sim.cards.be} />
        </div>
      </div>
    </>
  );
}
