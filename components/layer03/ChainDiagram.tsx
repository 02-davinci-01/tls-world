'use client';

import { Fragment, type RefObject } from 'react';
import type { ChainView, SealState } from './chainView';
import s from './Layer03.module.css';

export type WalkState = { seals: [SealState, SealState, SealState] };

const GLYPH: Record<SealState, string> = { pending: '·', ok: '✓', bad: '✕', q: '?', off: '–' };
const SEAL_LABEL: Record<SealState, string> = {
  pending: 'not checked yet',
  ok: 'seal holds',
  bad: 'seal broken',
  q: 'nothing to check',
  off: 'does not count',
};

type Props = { view: ChainView; walk: WalkState; hl: string | null; flyLayer: RefObject<HTMLDivElement | null> };

/** Four nodes and three seals, left to right: trust flows from the root down to this handshake. */
export function ChainDiagram({ view, walk, hl, flyLayer }: Props) {
  return (
    <div className={s.chainWrap}>
      <ol className={s.chain} aria-label="Chain of seals">
        {view.nodes.map((n, i) => {
          const link = i < 3 ? i : -1;
          const seal = link >= 0 ? walk.seals[link] : null;
          const dim = n.k === 'cv' && walk.seals[2] === 'off';
          return (
            <Fragment key={n.k}>
              <li
                data-k={n.k}
                data-i={i}
                className={[s.node, n.cls ? s[n.cls] : '', dim ? s.dim : '', hl === n.k ? s.hl : ''].join(' ')}
                title={n.full && n.full !== n.nm ? n.full : undefined}
              >
                <span className={s.role}>{n.role}</span>
                <span className={s.nm}>{n.nm}</span>
                <span className={s.nt2}>{n.nt}</span>
                {n.key && (
                  <span data-key="" className={s.key}>
                    {n.key}
                  </span>
                )}
              </li>
              {seal && (
                <li
                  aria-label={`${view.links[link].replace('\n', ' ')}: ${SEAL_LABEL[seal]}`}
                  data-k={view.nodes[i + 1].k}
                  data-l={link}
                  className={[s.link, seal === 'bad' ? s.broken : '', seal === 'off' ? s.off : '', hl === view.nodes[i + 1].k ? s.hl : ''].join(' ')}
                >
                  <span data-seal="" className={[s.seal, s[seal]].join(' ')} aria-hidden="true">
                    {GLYPH[seal]}
                  </span>
                  <span className={s.lk} aria-hidden="true">
                    {view.links[link].split('\n').map((t, j) => (
                      <Fragment key={j}>
                        {j > 0 && <br />}
                        {t}
                      </Fragment>
                    ))}
                  </span>
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
      <div ref={flyLayer} className={s.flyLayer} aria-hidden="true" />
    </div>
  );
}
