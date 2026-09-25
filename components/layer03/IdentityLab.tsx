'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApparitionHandle } from '@/components/apparition/Apparition';
import { Caption } from '@/components/ui/Stepper';
import { Verdict } from '@/components/ui/Verdict';
import { anim, isAbort, replayClass, sleep } from '@/lib/motion';
import { CHAIN_HOSTS, isChainHost, type ChainHost } from '@/lib/config';
import { CAPTURES } from './captures';
import { ChainDiagram, type WalkState } from './ChainDiagram';
import { buildView, type ChainView, type SealState } from './chainView';
import { CrtTerminal, type TermLine } from './CrtTerminal';
import { getChain } from './useChain';
import s from './Layer03.module.css';

const LINE_MS = 110;
const KEY_FLIGHT = 1100;
/** Autoplay dwell: long enough to read the caption. */
const DWELL_MIN = 3800;
const DWELL_PER_WORD = 240;
const EXAMPLE = 'openssl s_client -connect github.com:443 -showcerts';
const BOOT = ['copland os · navi', 'connecting to the wired … ok', '', 'Pick a tab above, or run the prompt below.'];
/** Typed while the terminal has focus; never shown until they run. */
const SECRETS = ['protocol7', 'whoami', 'clear', 'lain'];
const cmdFor = (h: ChainHost) => `openssl s_client -connect ${h}:443 -showcerts`;

const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const words = (n: React.ReactNode) => (typeof n === 'string' ? n.split(/\s+/).length : 20);

/** Seal states after steps 0..resolved have resolved. Derived, so stepping back is exact. */
function sealsAt(view: ChainView, resolved: number): WalkState {
  const seals: [SealState, SealState, SealState] = ['pending', 'pending', 'pending'];
  view.steps.slice(0, resolved + 1).forEach((st) => {
    if (st.link !== undefined && st.res) seals[st.link] = st.res;
  });
  return { seals };
}

let lineId = 0;
const mk = (l: Omit<TermLine, 'id'>): TermLine => ({ id: ++lineId, ...l });

/** The terminal and the chain diagram: printing, then walking the seals. Hover links lines and nodes. */
export function IdentityLab() {
  const [lines, setLines] = useState<TermLine[]>(() => BOOT.map((text) => mk({ text, kind: 'boot' })));
  const [prompt, setPrompt] = useState(EXAMPLE);
  const [busy, setBusy] = useState(false);
  const [host, setHost] = useState<ChainHost>('github.com');
  const [status, setStatus] = useState<string | null>(null);
  const [view, setView] = useState<ChainView>(() => buildView(CAPTURES['github.com']));
  /** Step whose caption is showing (-1 before any run). */
  const [step, setStep] = useState(-1);
  /** Last step whose seal has resolved. Lags `step` while a key is in flight. */
  const [resolved, setResolved] = useState(-1);
  const [auto, setAuto] = useState(false);
  const [flying, setFlying] = useState(false);
  const [hl, setHl] = useState<string | null>(null);

  const printing = useRef(false);
  const keyBuf = useRef('');
  const runCtrl = useRef<AbortController | null>(null);
  const walkCtrl = useRef<AbortController | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const flyLayer = useRef<HTMLDivElement>(null);
  const ghost = useRef<ApparitionHandle>(null);

  const print = (l: Omit<TermLine, 'id'>) => setLines((ls) => [...ls, mk(l)]);
  const glitch = () => replayClass(screen.current, s.glitch);
  const last = view.steps.length - 1;

  // Prefetch both captures as the section approaches.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        CHAIN_HOSTS.forEach((h) => void getChain(h));
        io.disconnect();
      },
      { rootMargin: '800px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The ghost in the machine: 2–3 frames every 7–12s, never while printing.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        if (!printing.current && !document.hidden) ghost.current?.flicker(2 + ((Math.random() * 2) | 0));
        loop();
      }, 7000 + Math.random() * 5000);
    };
    loop();
    return () => clearTimeout(t);
  }, []);

  useEffect(
    () => () => {
      runCtrl.current?.abort();
      walkCtrl.current?.abort();
    },
    [],
  );

  const flyKey = async (from: number, link: number, signal: AbortSignal) => {
    const layer = flyLayer.current;
    const root = layer?.parentElement;
    const src = root?.querySelector(`[data-i="${from}"] [data-key]`);
    const seal = root?.querySelector(`[data-l="${link}"] [data-seal]`);
    if (!layer || !src || !seal) return;
    const base = layer.getBoundingClientRect();
    const a = src.getBoundingClientRect();
    const b = seal.getBoundingClientRect();
    const x0 = a.left + a.width / 2 - base.left;
    const y0 = a.top + a.height / 2 - base.top;
    const x1 = b.left + b.width / 2 - base.left;
    const y1 = b.top + b.height / 2 - base.top;
    const f = document.createElement('span');
    f.className = s.keyfly;
    f.textContent = src.textContent;
    layer.appendChild(f);
    try {
      await anim(
        KEY_FLIGHT,
        (k) => {
          f.style.left = x0 + (x1 - x0) * k + 'px';
          f.style.top = y0 + (y1 - y0) * k - Math.sin(Math.PI * k) * 22 + 'px';
        },
        signal,
      );
    } finally {
      f.remove();
    }
  };

  /** Show step i's caption, fly its key (if any), then resolve its seal. */
  const enter = async (v: ChainView, i: number, signal: AbortSignal) => {
    const st = v.steps[i];
    setStep(i);
    if (st.link !== undefined && st.res) {
      setFlying(true);
      try {
        if (st.from !== undefined) await flyKey(st.from, st.link, signal);
        else await sleep(600, signal);
      } finally {
        setFlying(false);
      }
    }
    setResolved(i);
  };

  /** Autoplay from step `from` to the end. Any manual control aborts it. */
  const autoplay = async (v: ChainView, from: number) => {
    walkCtrl.current?.abort();
    const c = new AbortController();
    walkCtrl.current = c;
    setAuto(true);
    if (from === 0) setResolved(-1); // replaying from the top: rewind the seals
    try {
      for (let i = from; i < v.steps.length; i++) {
        await enter(v, i, c.signal);
        if (i < v.steps.length - 1) await sleep(Math.max(DWELL_MIN, words(v.steps[i].caption) * DWELL_PER_WORD), c.signal);
      }
    } catch (e) {
      if (!isAbort(e)) throw e;
      return;
    }
    if (walkCtrl.current === c) setAuto(false);
  };

  const stopAuto = () => {
    walkCtrl.current?.abort();
    walkCtrl.current = null;
    setAuto(false);
    setFlying(false);
  };

  const goNext = async () => {
    if (step >= last || printing.current) return;
    stopAuto();
    // Finish the current step instantly if its key was mid-flight.
    setResolved(step);
    const c = new AbortController();
    walkCtrl.current = c;
    try {
      await enter(view, step + 1, c.signal);
    } catch (e) {
      if (!isAbort(e)) throw e;
    }
  };
  const goPrev = () => {
    if (step <= 0 || printing.current) return;
    stopAuto();
    setStep(step - 1);
    setResolved(step - 1);
  };
  const toggleAuto = () => {
    if (printing.current || step < 0) return;
    if (auto) return stopAuto();
    void autoplay(view, step >= last ? 0 : step + 1);
  };

  const run = useCallback(
    async (raw: string) => {
      if (printing.current) return;
      const cmd = raw.trim();
      if (!cmd) return;
      print({ text: '% ' + cmd, kind: 'cmd' });
      setPrompt('');

      if (cmd === 'clear') {
        setLines([]);
        return;
      }
      if (cmd === 'lain') {
        glitch();
        ghost.current?.flicker(5);
        return;
      }
      if (cmd === 'whoami') {
        print({ text: 'you are connected.', kind: 'boot' });
        return;
      }
      if (cmd === 'protocol7') {
        print({ text: 'protocol 7: not yet deployed.', kind: 'boot' });
        return;
      }
      const m = cmd.match(/-connect\s+([\w.*-]+)/);
      const h = m?.[1].toLowerCase();
      if (!/^openssl\s+s_client\b/.test(cmd) || !h) {
        print({ text: `try: ${EXAMPLE}`, bad: true });
        glitch();
        return;
      }
      if (!isChainHost(h)) {
        print({ text: `${h}: not in this lab. Pick one of the two tabs above.`, bad: true });
        glitch();
        return;
      }

      printing.current = true;
      setBusy(true);
      stopAuto();
      runCtrl.current?.abort();
      const c = new AbortController();
      runCtrl.current = c;
      setHost(h);
      try {
        const data = await getChain(h);
        if (c.signal.aborted) return;
        const v = buildView(data);
        setStatus(data.live ? `live · fetched ${hhmm(data.fetchedAt)}` : 'sample capture');
        setView(v);
        setStep(-1);
        setResolved(-1);
        for (const l of data.lines) {
          print({ text: l.text, tag: l.tag, bad: l.bad });
          if (l.bad) glitch();
          await sleep(LINE_MS, c.signal);
        }
        if (!v.ok) ghost.current?.flicker(3);
        printing.current = false;
        setBusy(false);
        void autoplay(v, 0);
      } catch (e) {
        printing.current = false;
        setBusy(false);
        if (!isAbort(e)) throw e;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /** A tab types its command into the prompt like a person would, then runs it. */
  const onTab = async (h: ChainHost) => {
    if (printing.current) return;
    printing.current = true;
    setBusy(true);
    setHost(h);
    const cmd = cmdFor(h);
    try {
      setPrompt('');
      await sleep(180);
      for (let i = 1; i <= cmd.length; i++) {
        setPrompt(cmd.slice(0, i));
        await sleep(22 + Math.random() * 38 + (cmd[i - 1] === ' ' ? 40 : 0));
      }
      await sleep(320);
    } finally {
      printing.current = false;
      setBusy(false);
    }
    await run(cmd);
  };

  const onRun = () => {
    if (printing.current || !prompt) return;
    void run(prompt);
  };

  // Hidden commands: typed blind while the terminal has focus.
  const onKey = (k: string) => {
    if (printing.current) return;
    keyBuf.current = (keyBuf.current + k).slice(-12);
    const hit = SECRETS.find((w) => keyBuf.current.endsWith(w));
    if (hit) {
      keyBuf.current = '';
      void run(hit);
    }
  };

  const onOver = (e: React.MouseEvent) => {
    const k = (e.target as Element).closest<HTMLElement>('[data-k]')?.dataset.k ?? null;
    if (k !== hl) setHl(k);
  };

  const started = step >= 0;
  const controls = (
    <div className={s.walkCtl} role="group" aria-label="Chain walk controls">
      <button type="button" onClick={goPrev} disabled={!started || step <= 0} aria-label="Previous step">
        ‹
      </button>
      <button type="button" onClick={toggleAuto} disabled={!started} aria-label={auto ? 'Pause autoplay' : 'Play from here'} aria-pressed={auto}>
        {auto ? '❚❚' : '▶'}
      </button>
      <button type="button" onClick={() => void goNext()} disabled={!started || step >= last || (flying && !auto)} aria-label="Next step">
        ›
      </button>
    </div>
  );

  return (
    <div ref={wrap} onMouseOver={onOver} onMouseLeave={() => setHl(null)}>
      <CrtTerminal
        lines={lines}
        prompt={prompt}
        busy={busy}
        onRun={onRun}
        onKey={onKey}
        host={host}
        onTab={(h) => void onTab(h)}
        status={status}
        hl={hl}
        screenRef={screen}
        ghostRef={ghost}
      />

      <div className={s.subh}>
        <h3>Reading the chain</h3>
        <span className={s.sub}>trust flows from something you already have</span>
      </div>
      {/* wrapper scopes the sticky caption to the diagram on phones */}
      <div>
        <ChainDiagram view={view} walk={sealsAt(view, resolved)} hl={hl} flyLayer={flyLayer} />
        <Caption steps={view.steps.length} index={step} controls={controls} sticky>
          {started ? view.steps[step].caption : 'Run the command above. Each seal below gets checked in order.'}
        </Caption>
      </div>
      {resolved === last && (
        <Verdict kind={view.verdict.kind} data-k="verdict" className={hl === 'verdict' ? s.hlVerdict : undefined}>
          {view.verdict.text}
        </Verdict>
      )}
    </div>
  );
}
