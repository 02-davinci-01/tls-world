import type { ReactNode } from 'react';
import { Rail } from './Rail';
import { TitleBlock } from './TitleBlock';
import { TitleCard } from './TitleCard';
import s from './frame.module.css';

type Props = {
  id: string;
  layer: string;
  word: string;
  slot: string;
  slotNote: string;
  rail: string;
  title: string;
  subject: string;
  revision?: string;
  intro: ReactNode;
  children: ReactNode;
};

/** A technical drawing sheet: double frame, 24px grid, title card, rail and title block. */
export function Sheet({ id, layer, word, slot, slotNote, rail, title, subject, revision = 'B, Sep 2026', intro, children }: Props) {
  return (
    <section className={s.sheet} id={id} aria-labelledby={`${id}-h`}>
      <div className={s.body}>
        <TitleCard layer={layer} word={word} slot={slot} slotNote={slotNote} headingId={`${id}-h`} />
        <p className={s.intro}>{intro}</p>
        {children}
      </div>
      <Rail className={s.sheetRail}>{rail}</Rail>
      <TitleBlock layer={layer} title={title} subject={subject} revision={revision} />
    </section>
  );
}
