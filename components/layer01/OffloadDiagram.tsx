'use client';

import type { RefObject } from 'react';
import type { Geometry } from './geometry';
import { BACKENDS, type Mode, type Packet } from './useOffloadSim';
import s from './Layer01.module.css';

type Props = {
  geo: Geometry;
  tall: boolean;
  mode: Mode;
  lbState: string;
  route: number | null;
  packet: Packet;
  refs: {
    pk: RefObject<SVGGElement | null>;
    lb: RefObject<SVGRectElement | null>;
    moves: RefObject<(SVGPathElement | null)[]>;
    backends: RefObject<(SVGRectElement | null)[]>;
  };
};

const PORT: Record<Mode, string> = { http: 'listening on :80', pass: ':443, mode tcp', off: ':443 ssl crt site.pem' };
const ROUTE_TEXT = ['path_beg /api', 'path_beg /static', 'everything else'];

/** Client → HAProxy → three Node backends, drawn wide (the mockup) or tall (phones). */
export function OffloadDiagram({ geo, tall, mode, lbState, route, packet, refs }: Props) {
  const labels = mode === 'pass' ? geo.routeLabels.map((_, i) => (i === geo.rrLabel ? 'round robin' : '')) : ROUTE_TEXT;
  const { client, lb, eve } = geo;
  return (
    <svg
      className={[s.net, tall ? s.tall : '', mode === 'pass' ? s.pass : ''].join(' ')}
      viewBox={geo.viewBox}
      role="img"
      aria-label="Diagram: your browser sends a request across the public internet, past someone on the wire, to HAProxy at the edge of your private network, which forwards it to one of three Node backends. The readout cards describe each hop."
    >
      <defs>
        <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 1L10 5L0 9z" className={s.ahp} />
        </marker>
        <pattern id="rd2" width="23" height="15" patternUnits="userSpaceOnUse">
          <rect width="23" height="15" fill="#121216" />
          <circle cx="5" cy="4" r="1.8" fill="#c0101c" />
          <circle cx="16" cy="10" r="1.4" fill="#c0101c" />
          <circle cx="19" cy="3" r="1" fill="#c0101c" />
        </pattern>
      </defs>
      <rect x={geo.zone.x} y={geo.zone.y} width={geo.zone.w} height={geo.zone.h} className={s.zone} />
      <text x={geo.labels.publicAt[0]} y={geo.labels.publicAt[1]} className={s.zl}>public internet</text>
      <text x={geo.labels.wiredAt[0]} y={geo.labels.wiredAt[1]} className={s.zl2}>the wired</text>
      <text x={geo.labels.privateAt[0]} y={geo.labels.privateAt[1]} className={s.zl}>your private network</text>
      <line {...geo.edge} className={s.edge} />

      {/* the eavesdropper, under a utility pole */}
      <path d={eve.pole[0]} className={s.npole} />
      <path d={eve.pole[1]} className={s.npole} style={{ strokeWidth: 1.6 }} />
      <polygon points={eve.shadow} fill="url(#rd2)" />
      <circle cx={eve.head[0]} cy={eve.head[1]} r={eve.head[2]} fill="url(#rd2)" />
      <path d={eve.body} fill="url(#rd2)" />
      {eve.label2 ? (
        <>
          <text x={eve.label[0]} y={eve.label[1]} textAnchor={eve.labelAnchor} className={s.sm}>someone</text>
          <text x={eve.label2[0]} y={eve.label2[1]} textAnchor={eve.labelAnchor} className={s.sm}>on the wire</text>
        </>
      ) : (
        <text x={eve.label[0]} y={eve.label[1]} textAnchor={eve.labelAnchor} className={s.sm}>someone on the wire</text>
      )}
      <line x1={eve.tap[0]} y1={eve.tap[1]} x2={eve.tap[2]} y2={eve.tap[3]} className={s.edge} />

      <rect x={client.x} y={client.y} width={client.w} height={client.h} className={s.nb} />
      <text x={client.text[0]} y={client.text[1]} className={s.nt}>You</text>
      <text x={client.sub[0]} y={client.sub[1]} className={s.sm}>browser</text>

      <g className={mode !== 'http' ? s.sealed : undefined}>
        <path d={geo.cable[0]} className={s.cable} />
        <path d={geo.cable[1]} className={s.cable2} />
      </g>

      <rect ref={refs.lb} x={lb.x} y={lb.y} width={lb.w} height={lb.h} className={s.nb} />
      <text x={lb.title[0]} y={lb.title[1]} className={s.nt}>HAProxy</text>
      <text x={lb.port[0]} y={lb.port[1]} className={s.sm}>{PORT[mode]}</text>
      <text x={lb.state[0]} y={lb.state[1]} className={`${s.sm} ${s.acc}`}>{lbState}</text>

      {geo.routes.map((d, i) => (
        <path key={i} d={d} className={[s.route, route === i ? s.on : ''].join(' ')} markerEnd="url(#ah)" />
      ))}
      {geo.moves.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="none"
          ref={(el) => {
            refs.moves.current[i] = el;
          }}
        />
      ))}
      {labels.map((t, i) => (
        <text key={i} x={geo.routeLabels[i].at[0]} y={geo.routeLabels[i].at[1]} textAnchor={geo.routeLabels[i].anchor} className={s.sm}>
          {t}
        </text>
      ))}

      {BACKENDS.map((b, i) => {
        const g = geo.backends[i];
        const [port, desc] = b.sub.split(', ');
        return (
          <g key={b.name}>
            <rect
              ref={(el) => {
                refs.backends.current[i] = el;
              }}
              x={g.x}
              y={g.y}
              width={g.w}
              height={g.h}
              className={s.nb}
            />
            <text x={g.name[0]} y={g.name[1]} className={s.nt} style={{ fontSize: g.nameSize }}>
              {b.name}
            </text>
            {g.sub2 ? (
              <>
                <text x={g.sub[0]} y={g.sub[1]} className={s.sm}>{port}</text>
                <text x={g.sub2[0]} y={g.sub2[1]} className={s.sm}>{desc}</text>
              </>
            ) : (
              <text x={g.sub[0]} y={g.sub[1]} className={s.sm}>{b.sub}</text>
            )}
            <text x={g.badge[0]} y={g.badge[1]} textAnchor={g.badgeAnchor} className={s.badge}>
              needs cert + key
            </text>
          </g>
        );
      })}

      <g ref={refs.pk} style={{ opacity: packet.visible ? 1 : 0 }} aria-hidden="true">
        <rect x="-72" y="-14" width="144" height="28" className={[s.pkr, packet.plain ? s.plain : ''].join(' ')} />
        <text textAnchor="middle" y="4" className={[s.pkt, packet.plain ? s.plain : ''].join(' ')}>
          {packet.label}
        </text>
      </g>
    </svg>
  );
}
