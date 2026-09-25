/**
 * Two drawings of the same network. `wide` is the mockup's landscape sheet (kept exactly);
 * `tall` is a portrait version for phones, where the wide one would render its labels at ~3px.
 * Path i of `moves`: 0 = client → HAProxy centre, 1..3 = HAProxy → backend i-1.
 */
export type Layout = 'wide' | 'tall';

type Box = { x: number; y: number; w: number; h: number };

export type Geometry = {
  viewBox: string;
  /** Packet speed, so a hop takes about as long in both drawings. */
  msPerUnit: number;
  /** Has the packet reached the eavesdropper yet? */
  pastEve: (x: number, y: number) => boolean;
  zone: Box;
  edge: { x1: number; y1: number; x2: number; y2: number };
  labels: { publicAt: [number, number]; wiredAt: [number, number]; privateAt: [number, number] };
  client: Box & { text: [number, number]; sub: [number, number] };
  cable: [string, string];
  eve: {
    pole: string[];
    shadow: string;
    head: [number, number, number];
    body: string;
    label: [number, number];
    labelAnchor: 'middle' | 'end';
    /** When set, the label breaks after "someone" and continues here. */
    label2?: [number, number];
    tap: [number, number, number, number];
  };
  lb: Box & { title: [number, number]; port: [number, number]; state: [number, number] };
  routes: string[];
  moves: string[];
  routeLabels: { at: [number, number]; anchor: 'start' | 'middle' }[];
  /** Label index shown in passthrough mode ("round robin"). */
  rrLabel: number;
  backends: (Box & {
    name: [number, number];
    sub: [number, number];
    /** When set, the subtitle splits at ", " and its second half goes here. */
    sub2?: [number, number];
    badge: [number, number];
    badgeAnchor: 'end' | 'middle';
    nameSize: number;
  })[];
};

export const WIDE: Geometry = {
  viewBox: '0 0 900 330',
  msPerUnit: 1100 / 300,
  pastEve: (x) => x >= 262,
  zone: { x: 470, y: 0, w: 430, h: 330 },
  edge: { x1: 470, y1: 0, x2: 470, y2: 330 },
  labels: { publicAt: [16, 24], wiredAt: [16, 37], privateAt: [486, 24] },
  client: { x: 24, y: 137, w: 120, h: 56, text: [40, 162], sub: [40, 180] },
  cable: ['M144 165 Q267 196 390 165', 'M144 171 Q267 202 390 171'],
  eve: {
    pole: ['M267 62 V300', 'M243 78 H291'],
    shadow: '264,300 270,300 360,316 352,322',
    head: [318, 104, 9],
    body: 'M303 142 Q318 114 333 142 Z',
    label: [318, 158],
    labelAnchor: 'middle',
    tap: [318, 164, 300, 178],
  },
  lb: { x: 390, y: 100, w: 150, h: 130, title: [406, 127], port: [406, 146], state: [406, 214] },
  routes: ['M540 165 H610 V67 H676', 'M540 165 H676', 'M610 165 V263 H676'],
  moves: ['M144 165 Q267 196 390 165 L465 165', 'M465 165 H610 V67 H676', 'M465 165 H676', 'M465 165 H610 V263 H676'],
  routeLabels: [
    { at: [618, 58], anchor: 'start' },
    { at: [618, 156], anchor: 'start' },
    { at: [618, 254], anchor: 'start' },
  ],
  rrLabel: 0,
  backends: [67, 165, 263].map((cy) => ({
    x: 680,
    y: cy - 27,
    w: 200,
    h: 54,
    name: [696, cy - 3] as [number, number],
    sub: [696, cy + 15] as [number, number],
    badge: [872, cy - 13] as [number, number],
    badgeAnchor: 'end' as const,
    nameSize: 15,
  })),
};

/** Portrait: you at the top, the wire running down past the eavesdropper, HAProxy on the edge, backends below. */
export const TALL: Geometry = {
  viewBox: '0 0 360 512',
  msPerUnit: 1100 / 150,
  pastEve: (_x, y) => y >= 120,
  zone: { x: 0, y: 258, w: 360, h: 254 },
  edge: { x1: 0, y1: 258, x2: 360, y2: 258 },
  labels: { publicAt: [12, 20], wiredAt: [12, 33], privateAt: [12, 336] },
  client: { x: 120, y: 40, w: 120, h: 50, text: [134, 63], sub: [134, 80] },
  cable: ['M180 90 Q140 145 180 200', 'M186 90 Q146 145 186 200'],
  eve: {
    // pole stops above HAProxy and stands right of the wire, clear of the box
    pole: ['M272 88 V186', 'M252 102 H292'],
    shadow: '269,186 275,186 306,195 301,198',
    head: [320, 114, 8],
    body: 'M307 148 Q320 124 333 148 Z',
    label: [320, 164],
    labelAnchor: 'middle',
    label2: [320, 178],
    // a short tick, like the wide drawing's
    tap: [312, 184, 296, 200],
  },
  lb: { x: 105, y: 200, w: 150, h: 112, title: [119, 224], port: [119, 241], state: [119, 300] },
  routes: ['M180 312 V352 H63 V400', 'M180 312 V400', 'M180 312 V352 H297 V400'],
  moves: ['M180 90 Q140 145 180 200 L180 256', 'M180 256 V352 H63 V400', 'M180 256 V400', 'M180 256 V352 H297 V400'],
  routeLabels: [
    { at: [63, 502], anchor: 'middle' },
    { at: [180, 502], anchor: 'middle' },
    { at: [297, 502], anchor: 'middle' },
  ],
  rrLabel: 1,
  backends: [63, 180, 297].map((cx) => ({
    x: cx - 54,
    y: 404,
    w: 108,
    h: 64,
    name: [cx - 46, 426] as [number, number],
    sub: [cx - 46, 443] as [number, number],
    sub2: [cx - 46, 459] as [number, number],
    badge: [cx, 484] as [number, number],
    badgeAnchor: 'middle' as const,
    nameSize: 14,
  })),
};

export const GEOMETRY: Record<Layout, Geometry> = { wide: WIDE, tall: TALL };
