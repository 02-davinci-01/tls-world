'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { anim, isAbort, replayClass, sleep } from '@/lib/motion';
import type { Geometry } from './geometry';
import type { CardState } from './ReadoutCard';

export type Mode = 'http' | 'pass' | 'off';
export type ReqPath = '/api' | '/static' | '/login';
export type CardId = 'eve' | 'lb' | 'be';

export const BACKENDS = [
  { name: 'node-a', sub: ':3001, the API' },
  { name: 'node-b', sub: ':3002, static files' },
  { name: 'node-c', sub: ':3000, the app' },
] as const;

export const REQUESTS: Record<ReqPath, { line: string; be: number }> = {
  '/api': { line: 'GET /api/repos', be: 0 },
  '/static': { line: 'GET /static/app.js', be: 1 },
  '/login': { line: 'POST /login', be: 2 },
};


const emptyCard = (): CardState => ({ content: null, leak: false, n: 0 });
const emptyCards = () => ({ eve: emptyCard(), lb: emptyCard(), be: emptyCard() });

export type Packet = { label: string; plain: boolean; visible: boolean };

type Content = {
  full: (p: ReqPath) => ReactNode;
  eveSealed: ReactNode;
  lb: (mode: Mode, p: string, backend: string) => ReactNode;
  be: (mode: Mode, p: ReqPath) => ReactNode;
};

export function useOffloadSim(content: Content, geo: Geometry) {
  const [mode, setModeState] = useState<Mode>('off');
  const [path, setPathState] = useState<ReqPath>('/login');
  const [busy, setBusy] = useState(false);
  const [lbState, setLbState] = useState('');
  const [route, setRoute] = useState<number | null>(null);
  const [packet, setPacket] = useState<Packet>({ label: '', plain: false, visible: false });
  const [cards, setCards] = useState(emptyCards);

  const rr = useRef(0);
  const pk = useRef<SVGGElement>(null);
  const lb = useRef<SVGRectElement>(null);
  const moves = useRef<(SVGPathElement | null)[]>([]);
  const backends = useRef<(SVGRectElement | null)[]>([]);
  const ctrl = useRef<AbortController | null>(null);
  useEffect(() => () => ctrl.current?.abort(), []);

  const reset = () => {
    setLbState('');
    setRoute(null);
    setCards(emptyCards());
  };
  const setMode = (m: Mode) => {
    if (busy) return;
    setModeState(m);
    reset();
  };
  const setPath = (p: ReqPath) => {
    if (busy) return;
    setPathState(p);
    reset();
  };

  const card = (id: CardId, c: ReactNode, leak = false) =>
    setCards((cs) => ({ ...cs, [id]: { content: c, leak, n: cs[id].n + 1 } }));

  const along = async (i: number, signal: AbortSignal, onPoint?: (x: number, y: number) => void) => {
    const p = moves.current[i];
    const g = pk.current;
    if (!p || !g) return;
    const L = p.getTotalLength();
    await anim(
      geo.msPerUnit * L,
      (k) => {
        const q = p.getPointAtLength(k * L);
        g.setAttribute('transform', `translate(${q.x},${q.y})`);
        onPoint?.(q.x, q.y);
      },
      signal,
    );
  };

  const send = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const c = new AbortController();
    ctrl.current = c;
    const { signal } = c;
    const r = REQUESTS[path];
    const be = mode === 'pass' ? rr.current++ % 3 : r.be;
    const sealed = mode !== 'http';
    const p = r.line.split(' ')[1];
    setRoute(null);
    setLbState('');
    setPacket({ label: sealed ? '▓▓▓ sealed ▓▓▓' : r.line, plain: !sealed, visible: true });
    try {
      let seen = false;
      await along(0, signal, (x, y) => {
        if (seen || !geo.pastEve(x, y)) return;
        seen = true;
        card('eve', sealed ? content.eveSealed : content.full(path), !sealed);
      });
      replayClass(lb.current, 'hit');
      if (mode === 'off') {
        setLbState('decrypting…');
        await sleep(700, signal);
        setPacket({ label: r.line, plain: true, visible: true });
      }
      setLbState(mode === 'pass' ? 'can’t read the path' : 'reads ' + p);
      card('lb', content.lb(mode, p, BACKENDS[be].name));
      setRoute(be);
      await along(be + 1, signal);
      replayClass(backends.current[be], 'hit');
      card('be', content.be(mode, path));
      await sleep(500, signal);
      setPacket((pk) => ({ ...pk, visible: false }));
      setBusy(false);
    } catch (e) {
      if (!isAbort(e)) throw e;
    }
  }, [busy, mode, path, content, geo]);

  return { mode, setMode, path, setPath, busy, send, lbState, route, packet, cards, refs: { pk, lb, moves, backends } };
}
