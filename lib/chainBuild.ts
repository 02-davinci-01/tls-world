import type { ChainLine, ChainNode, ChainResponse, LineTag } from './chain';

/** What a TLS probe observed. Certs are ordered leaf → root, as Node walks issuerCertificate. */
export type ProbeResult = {
  host: string;
  authorized: boolean;
  authorizationError?: string;
  protocol: string;
  cipher: string;
  ephemeral: { type?: string; name?: string; size?: number };
  leafKeyType?: string;
  certs: Array<{ cn: string; issuerCn: string; notBefore?: string; notAfter?: string; selfSigned: boolean }>;
};

/** Node error → OpenSSL verify code (SPEC §8.5). */
const CODES: Record<string, number> = {
  UNABLE_TO_GET_ISSUER_CERT_LOCALLY: 20,
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: 21,
  CERT_HAS_EXPIRED: 10,
  DEPTH_ZERO_SELF_SIGNED_CERT: 18,
  SELF_SIGNED_CERT_IN_CHAIN: 19,
};
const REASONS: Record<number, string> = {
  0: 'ok',
  10: 'certificate has expired',
  18: 'self-signed certificate',
  19: 'self-signed certificate in certificate chain',
  20: 'unable to get local issuer certificate',
  21: 'unable to verify the first certificate',
};

const sigType = (k?: string) =>
  k === 'ec' ? 'ECDSA' : k === 'rsa' || k === 'rsa-pss' ? 'RSA-PSS' : k === 'ed25519' ? 'Ed25519' : (k ?? 'unknown');

function tempKey(e: ProbeResult['ephemeral']) {
  if (!e.name) return 'none';
  return e.type === 'ECDH' && e.name !== 'X25519' && e.name !== 'X448'
    ? `ECDH, ${e.name}, ${e.size} bits`
    : `${e.name}, ${e.size} bits`;
}

/** Builds the simplified s_client view (CN only, no PEM) from a probe. Pure: safe on client and server. */
export function buildChainResponse(p: ProbeResult, live: boolean, fetchedAt: string): ChainResponse {
  const code = p.authorized ? 0 : (CODES[p.authorizationError ?? ''] ?? -1);
  const reason = REASONS[code] ?? (p.authorizationError ?? 'unknown error').toLowerCase().replace(/_/g, ' ');
  const certs = p.certs;
  const top = certs[certs.length - 1];
  const hasRoot = certs.length > 1 && top?.selfSigned;
  const ephemeral = tempKey(p.ephemeral);
  const peerSigType = sigType(p.leafKeyType);

  const nodes: ChainNode[] = [];
  const lines: ChainLine[] = [{ text: 'CONNECTED(00000003)' }];
  const L = (text: string, tag?: LineTag, bad?: boolean) => lines.push(bad ? { text, tag, bad } : tag ? { text, tag } : { text });

  if (p.authorized || hasRoot) {
    // A complete chain: root from the store, everything below it sent by the server.
    certs.forEach((c, i) => {
      const role = i === 0 ? 'leaf' : i === certs.length - 1 && hasRoot ? 'root' : 'intermediate';
      nodes.push({ role, cn: c.cn, issuerCn: c.issuerCn, notBefore: c.notBefore, notAfter: c.notAfter, source: role === 'root' ? 'store' : 'server', ...(i === 0 ? { keyType: peerSigType } : {}) });
    });
    const tagOf = (i: number): LineTag => (i === 0 ? 'leaf' : i === certs.length - 1 && hasRoot ? 'root' : 'inter');
    for (let d = certs.length - 1; d >= 0; d--) {
      L(`depth=${d} CN=${certs[d].cn}`, tagOf(d));
      L(code === 0 ? 'verify return:1' : `verify error:num=${code}:${reason}`, tagOf(d), code !== 0);
    }
    L('---');
    L('Certificate chain');
    const sent = hasRoot ? certs.slice(0, -1) : certs;
    sent.forEach((c, i) => {
      L(` ${i} s:CN=${c.cn}`, tagOf(i));
      L(`   i:CN=${c.issuerCn}`, tagOf(i));
    });
  } else {
    // The server sent the leaf alone and nothing local completes it.
    const leaf = certs[0];
    nodes.push({ role: 'root', cn: '', source: 'store' });
    nodes.push({ role: 'intermediate', cn: leaf?.issuerCn ?? '', source: 'missing' });
    nodes.push({ role: 'leaf', cn: leaf?.cn ?? p.host, issuerCn: leaf?.issuerCn, notBefore: leaf?.notBefore, notAfter: leaf?.notAfter, keyType: peerSigType, source: 'server' });
    L(`depth=0 CN=${leaf?.cn}`, 'leaf');
    L(`verify error:num=20:${REASONS[20]}`, 'inter', true);
    L('verify return:1', 'inter');
    L(`depth=0 CN=${leaf?.cn}`, 'leaf');
    L(`verify error:num=${code}:${reason}`, 'leaf', true);
    L('verify return:1', 'leaf');
    L('---');
    L('Certificate chain');
    L(` 0 s:CN=${leaf?.cn}`, 'leaf');
    L(`   i:CN=${leaf?.issuerCn}  (intermediate, not sent)`, 'inter', true);
  }
  L('---');
  L(`Peer signature type: ${peerSigType}`, 'cv');
  L(`Server Temp Key: ${ephemeral}`, 'cv');
  L(`Verify return code: ${code} (${reason})`, 'verdict', code !== 0);

  // Root first, as the diagram reads.
  const order = { root: 0, intermediate: 1, leaf: 2 } as const;
  nodes.sort((a, b) => order[a.role] - order[b.role]);

  return {
    host: p.host,
    live,
    fetchedAt,
    verdict: { ok: code === 0, code, reason, ...(p.authorizationError ? { nodeError: p.authorizationError } : {}) },
    protocol: p.protocol,
    cipher: p.cipher,
    ephemeral,
    peerSigType,
    nodes,
    lines,
  };
}
