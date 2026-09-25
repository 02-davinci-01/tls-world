import type { ReactNode } from 'react';
import type { ChainResponse, LineTag } from '@/lib/chain';

export type NodeKey = 'root' | 'inter' | 'leaf' | 'cv';
export type SealState = 'pending' | 'ok' | 'bad' | 'q' | 'off';
export type NodeView = { k: NodeKey; role: string; nm: string; full?: string; nt: string; key?: string; cls?: 'trust' | 'hs' | 'miss' };
export type WalkStep = { caption: ReactNode; link?: number; from?: number; res?: SealState };
export type ChainView = {
  ok: boolean;
  nodes: [NodeView, NodeView, NodeView, NodeView];
  links: [string, string, string];
  steps: WalkStep[];
  verdict: { kind: 'verum' | 'falsum'; text: string };
};
export type { LineTag };

/** Trims long CA names so they fit a node: "Sectigo Public Server Authentication CA DV E36" → "Sectigo DV E36". */
export function shortCn(cn: string) {
  return (
    cn
      .replace(/\s*Certification Authority$/i, '')
      .replace(/Public Server Authentication (CA )?/i, '')
      .replace(/Domain Validation Secure Server CA/i, 'DV')
      .replace(/\s+/g, ' ')
      .trim() || cn
  );
}

export function buildView(data: ChainResponse): ChainView {
  const root = data.nodes.find((n) => n.role === 'root');
  const inters = data.nodes.filter((n) => n.role === 'intermediate');
  const leaf = data.nodes.find((n) => n.role === 'leaf');
  // The intermediate drawn is the one that sealed the leaf.
  const inter = inters.find((n) => n.cn === leaf?.issuerCn) ?? inters[inters.length - 1];

  if (data.verdict.ok) {
    const extra = inters.length - 1;
    return {
      ok: true,
      nodes: [
        { k: 'root', role: 'root CA', nm: shortCn(root?.cn ?? 'a trusted root'), full: root?.cn, nt: 'already on your machine, never sent', key: 'K·root', cls: 'trust' },
        {
          k: 'inter',
          role: 'intermediate CA',
          nm: shortCn(inter?.cn ?? 'intermediate'),
          full: inter?.cn,
          nt: extra > 0 ? `sent by the server, with ${extra} more intermediate${extra > 1 ? 's' : ''} above it` : 'sent by the server',
          key: 'K·int',
        },
        { k: 'leaf', role: 'leaf certificate', nm: leaf?.cn ?? data.host, nt: 'sent by the server, the name you asked for', key: 'K·leaf' },
        { k: 'cv', role: 'this handshake', nm: 'your connection', nt: 'the transcript, both paint mixes included', cls: 'hs' },
      ],
      links: ['root seals\nintermediate', 'intermediate\nseals leaf', 'leaf key seals\nhandshake'],
      steps: [
        { caption: 'Start from what you already trust: the root in your machine’s store. The server never sends it.' },
        { from: 0, link: 0, res: 'ok', caption: 'The intermediate carries a seal made by the root. Your machine checks it with the root’s public key. It holds.' },
        { from: 1, link: 1, res: 'ok', caption: 'The github.com certificate carries a seal made by the intermediate. Checked with the intermediate’s public key. It holds.' },
        {
          from: 2,
          link: 2,
          res: 'ok',
          caption:
            'Last is CertificateVerify. github.com seals this very handshake, both paint mixes included, with its private key. You check it with the public key inside its certificate. Only the real key holder could have made it.',
        },
      ],
      verdict: {
        kind: 'verum',
        text: 'Every seal holds, from a root you already trust down to this connection. If Mallory had swapped the paint, the handshake would differ and the last seal would fail.',
      },
    };
  }

  return {
    ok: false,
    nodes: [
      { k: 'root', role: 'root CA', nm: 'a trusted root', nt: 'somewhere in your store', key: 'K·root', cls: 'trust' },
      { k: 'inter', role: 'intermediate CA', nm: 'missing', full: inter?.cn, nt: 'the server didn’t send it, and it isn’t in your store', cls: 'miss' },
      { k: 'leaf', role: 'leaf certificate', nm: leaf?.cn ?? data.host, nt: 'sent by the server', key: 'K·leaf' },
      { k: 'cv', role: 'this handshake', nm: 'your connection', nt: 'the transcript', cls: 'hs' },
    ],
    links: ['root seals\n???', '??? seals\nleaf', 'leaf key seals\nhandshake'],
    steps: [
      { caption: 'Start from your trust store, the same as before.' },
      { link: 0, res: 'q', caption: 'The leaf says an intermediate sealed it. The server never sent that intermediate, so there’s nothing here for your root to vouch for.' },
      {
        link: 1,
        res: 'bad',
        caption: `With no intermediate, there’s no public key to check the leaf’s seal with. The chain breaks right here. OpenSSL reports error ${data.verdict.code}: ${data.verdict.reason}.`,
      },
      { link: 2, res: 'off', caption: 'The handshake seal may be perfectly valid, but it’s vouched for by a certificate nobody vouches for. A browser stops here.' },
    ],
    verdict: {
      kind: 'falsum',
      text: 'One missing link and nothing after it counts. From your side, this looks exactly like a certificate Mallory made herself.',
    },
  };
}
