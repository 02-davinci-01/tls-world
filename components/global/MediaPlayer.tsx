'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { Apparition, type ApparitionHandle } from '@/components/apparition/Apparition';
import { setGlobal } from '@/lib/store';
import { prefersReducedMotion } from '@/lib/useReducedMotion';
import bar from './global.module.css';
import s from './MediaPlayer.module.css';

const SRC = '/audio/duvet.mp3';
const TITLE = 'Bôa — Duvet';
const BARS = 22;

const fmt = (t: number) => {
  if (!Number.isFinite(t)) return '--:--';
  const m = Math.floor(t / 60);
  return `${String(m).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
};

type Pos = { x: number; y: number };

/**
 * An early-2000s media player that plays one song. Off-system on purpose, like the Layer:04 ad.
 * The launcher lives in the bottom-right control bar; the window is draggable by its title bar.
 */
export function MediaPlayer() {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(NaN);
  const [vol, setVol] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);

  const audio = useRef<HTMLAudioElement>(null);
  const win = useRef<HTMLDivElement>(null);
  const playBtn = useRef<HTMLButtonElement>(null);
  const viz = useRef<HTMLCanvasElement>(null);
  const screen = useRef<ApparitionHandle>(null);
  const graph = useRef<{ ctx: AudioContext; an: AnalyserNode } | null>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  // Share state with the hum and the hero figure.
  useEffect(() => setGlobal({ musicOn: playing }), [playing]);
  useEffect(() => () => setGlobal({ musicOn: false }), []);

  const connect = () => {
    const a = audio.current;
    if (!a || graph.current) return;
    try {
      const ctx = new AudioContext();
      const src = ctx.createMediaElementSource(a);
      const an = ctx.createAnalyser();
      an.fftSize = 64;
      an.smoothingTimeConstant = 0.75;
      src.connect(an);
      an.connect(ctx.destination);
      graph.current = { ctx, an };
    } catch {
      /* visualiser is optional */
    }
  };

  const play = useCallback(async () => {
    const a = audio.current;
    if (!a) return;
    connect();
    if (graph.current?.ctx.state === 'suspended') await graph.current.ctx.resume();
    try {
      await a.play();
    } catch {
      setPlaying(false);
    }
  }, []);
  const pause = () => audio.current?.pause();
  const stop = () => {
    const a = audio.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
    setTime(0);
  };

  const launch = () => {
    setOpen(true);
    if (!playing) void play();
  };
  const close = () => {
    stop();
    setOpen(false);
  };
  const minimise = () => setOpen(false);

  // Initial placement: bottom-left, just above its launcher.
  useLayoutEffect(() => {
    if (!open || pos || !win.current) return;
    const r = win.current.getBoundingClientRect();
    setPos({ x: Math.min(16, Math.max(0, innerWidth - r.width)), y: Math.max(12, innerHeight - r.height - 64) });
  }, [open, pos]);
  useEffect(() => {
    if (open) playBtn.current?.focus();
  }, [open]);

  // Keep it on screen when the viewport shrinks.
  useEffect(() => {
    const fit = () =>
      setPos((p) => {
        const el = win.current;
        if (!p || !el) return p;
        const r = el.getBoundingClientRect();
        return { x: Math.min(Math.max(0, p.x), Math.max(0, innerWidth - r.width)), y: Math.min(Math.max(0, p.y), Math.max(0, innerHeight - r.height)) };
      });
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, []);

  const onDown = (e: RPointerEvent) => {
    if ((e.target as Element).closest('button') || !pos) return;
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };
  const onMove = (e: RPointerEvent) => {
    const d = drag.current;
    const el = win.current;
    if (!d || !el) return;
    const r = el.getBoundingClientRect();
    setPos({
      x: Math.min(Math.max(0, e.clientX - d.dx), innerWidth - r.width),
      y: Math.min(Math.max(0, e.clientY - d.dy), innerHeight - 40),
    });
  };
  const onUp = () => (drag.current = null);

  // Visualiser + occasional screen glitches while playing.
  useEffect(() => {
    if (!open || !playing || prefersReducedMotion()) return;
    const c = viz.current;
    const g = c?.getContext('2d');
    const an = graph.current?.an;
    let raf = 0;
    const data = an ? new Uint8Array(an.frequencyBinCount) : null;
    const frame = () => {
      if (c && g && an && data) {
        an.getByteFrequencyData(data);
        g.clearRect(0, 0, c.width, c.height);
        const w = c.width / BARS;
        for (let i = 0; i < BARS; i++) {
          const v = data[Math.min(data.length - 1, i + 1)] / 255;
          const h = Math.max(1, v * c.height);
          g.fillStyle = i % 5 === 4 ? 'rgba(255,65,80,.85)' : 'rgba(199,182,255,.8)';
          g.fillRect(i * w + 1, c.height - h, w - 2, h);
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        if (!document.hidden) void screen.current?.flicker(2 + ((Math.random() * 2) | 0), 'glitch');
        loop();
      }, 2600 + Math.random() * 3600);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [open, playing]);

  useEffect(() => {
    if (audio.current) {
      audio.current.volume = vol;
      audio.current.muted = muted;
    }
  }, [vol, muted]);

  useEffect(() => () => void graph.current?.ctx.close(), []);

  const pct = Number.isFinite(dur) && dur > 0 ? (time / dur) * 100 : 0;

  return (
    <>
      <button
        type="button"
        className={playing ? bar.on : undefined}
        aria-expanded={open}
        aria-controls="navi-player"
        onClick={() => (open ? minimise() : launch())}
      >
        {playing ? 'duvet.mp3' : '▶ duvet.mp3'}
      </button>

      <audio
        ref={audio}
        src={SRC}
        preload="none"
        loop
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onDurationChange={(e) => setDur(e.currentTarget.duration)}
      />

      <div
        id="navi-player"
        ref={win}
        role="dialog"
        aria-label={`Media player: ${TITLE}`}
        className={s.win}
        hidden={!open}
        style={pos ? { left: pos.x, top: pos.y } : { left: 16, bottom: 64 }}
        onKeyDown={(e) => e.key === 'Escape' && minimise()}
      >
        <div className={s.title} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <span className={s.icon} aria-hidden="true" />
          <span className={s.titleText}>Navi Media Player</span>
          <div className={s.wbtns}>
            <button type="button" className={s.wbtn} aria-label="Minimise, keep playing" onClick={minimise}>
              <span className={s.gMin} />
            </button>
            <span className={`${s.wbtn} ${s.fake}`} aria-hidden="true">
              <span className={s.gMax} />
            </span>
            <button type="button" className={`${s.wbtn} ${s.closeBtn}`} aria-label="Close and stop" onClick={close}>
              ×
            </button>
          </div>
        </div>

        <div className={s.menu} aria-hidden="true">
          <span><u>F</u>ile</span>
          <span><u>V</u>iew</span>
          <span><u>P</u>lay</span>
          <span><u>T</u>ools</span>
          <span><u>H</u>elp</span>
        </div>

        <div className={s.strip}>
          <span className={s.marquee}>
            <span>now playing: {TITLE} · layer:07 · present day, present time · </span>
          </span>
        </div>

        <div className={[s.screen, playing ? '' : s.paused].join(' ')}>
          <Apparition ref={screen} name="player_screen.webp" mode="static" color note="player screen" className={s.screenApp} />
          <canvas ref={viz} className={s.viz} width={220} height={40} aria-hidden="true" />
          {!playing && <span className={s.pausedTag}>{time > 0 ? '▌▌ paused' : '■ stopped'}</span>}
        </div>

        <div className={s.controls}>
          <input
            className={s.seek}
            type="range"
            min={0}
            max={Number.isFinite(dur) ? dur : 0}
            step={0.1}
            value={time}
            aria-label="Seek"
            style={{ ['--pct' as string]: `${pct}%` }}
            onChange={(e) => {
              const a = audio.current;
              if (a) a.currentTime = Number(e.target.value);
              setTime(Number(e.target.value));
            }}
          />
          <div className={s.row}>
            <button
              ref={playBtn}
              type="button"
              className={s.play}
              aria-label={playing ? 'Pause' : 'Play'}
              onClick={() => (playing ? pause() : void play())}
            >
              {playing ? '❚❚' : '▶'}
            </button>
            <button type="button" className={s.small} aria-label="Stop" onClick={stop}>
              ■
            </button>
            <span className={s.time} aria-live="off">
              {fmt(time)} / {fmt(dur)}
            </span>
            <button type="button" className={s.small} aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={muted} onClick={() => setMuted((m) => !m)}>
              {muted ? '🔇' : '🔊'}
            </button>
            <input
              className={s.vol}
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={vol}
              aria-label="Volume"
              style={{ ['--pct' as string]: `${vol * 100}%` }}
              onChange={(e) => setVol(Number(e.target.value))}
            />
          </div>
        </div>
      </div>
    </>
  );
}
