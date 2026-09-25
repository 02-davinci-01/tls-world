export type Letter = 'Y' | 'B' | 'G' | 'R';

export const PAINT: Record<Letter, string> = { Y: '#f0cf3a', B: '#2f5bd8', G: '#25a36f', R: '#c0101c' };

const hexToRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toLinear = (c: number) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const toSrgb = (c: number) => {
  c = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(1, c)) * 255);
};

/**
 * Equal-weight average of the component paints in linear-light RGB, back to sRGB.
 * Depends only on the letter multiset, so B+G+Y renders identically in any mixing order.
 */
export function color(letters: readonly Letter[]): string {
  const sum = [0, 0, 0];
  for (const l of letters) hexToRgb(PAINT[l]).map(toLinear).forEach((v, i) => (sum[i] += v));
  return '#' + sum.map((v) => toSrgb(v / letters.length).toString(16).padStart(2, '0')).join('');
}

/** Alphabetical (B, G, R, Y): makes equal keys look equal at a glance. */
export const sorted = (letters: readonly Letter[]): Letter[] => [...letters].sort();

/** A formula shown under a slot: a plain sum, or a received mix plus one's own secret. */
export type FormulaSpec = { sum: Letter[] } | { recv: Letter[]; own: Letter };

export const formula = (recv: Letter[], own: Letter): FormulaSpec => ({ recv, own });
export const sum = (...ls: Letter[]): FormulaSpec => ({ sum: ls });
