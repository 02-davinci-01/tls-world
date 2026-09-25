'use client';

import { useEffect, useRef, useState } from 'react';
import { Apparition, type ApparitionHandle } from '@/components/apparition/Apparition';
import s from './frame.module.css';

type Props = { layer: string; word: string; slot: string; slotNote: string; headingId: string };

/** Layer:NN band. Flickers once with an RGB split the first time 60% of it is visible. */
export function TitleCard({ layer, word, slot, slotNote, headingId }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  const app = useRef<ApparitionHandle>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setSeen(true);
        t = setTimeout(() => app.current?.flicker(2), 260);
        io.disconnect();
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, []);

  return (
    <h2 ref={ref} id={headingId} className={[s.card, seen ? s.seen : ''].join(' ')}>
      <span className={s.lyr}>Layer:{layer}</span>
      <span className={s.word}>{word}</span>
      <Apparition ref={app} name={slot} mode="ghost" note={slotNote} className={s.cardApp} />
    </h2>
  );
}
