export type LineTag = 'root' | 'inter' | 'leaf' | 'cv' | 'verdict';

export type ChainLine = { text: string; tag?: LineTag; bad?: boolean };

export type ChainNode = {
  role: 'root' | 'intermediate' | 'leaf';
  cn: string;
  issuerCn?: string;
  notBefore?: string;
  notAfter?: string;
  keyType?: string;
  source: 'store' | 'server' | 'missing';
};

export type ChainResponse = {
  host: string;
  live: boolean;
  fetchedAt: string;
  verdict: { ok: boolean; code: number; reason: string; nodeError?: string };
  protocol: string;
  cipher: string;
  ephemeral: string;
  peerSigType: string;
  nodes: ChainNode[];
  lines: ChainLine[];
};
