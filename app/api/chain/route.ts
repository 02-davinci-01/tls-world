import tls from 'node:tls';
import { NextResponse } from 'next/server';
import { CAPTURES } from '@/components/layer03/captures';
import type { ChainResponse } from '@/lib/chain';
import { buildChainResponse, type ProbeResult } from '@/lib/chainBuild';
import { isChainHost } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TTL_MS = 3600_000;
const cache = new Map<string, { at: number; body: ChainResponse }>();

function probe(host: string): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    const sock = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false, timeout: 4000 }, () => {
      try {
        const certs: ProbeResult['certs'] = [];
        const seen = new Set<string>();
        let cur: tls.DetailedPeerCertificate | undefined = sock.getPeerCertificate(true);
        while (cur && cur.raw && !seen.has(cur.fingerprint256)) {
          seen.add(cur.fingerprint256);
          const self = cur.issuerCertificate === cur || cur.issuerCertificate?.fingerprint256 === cur.fingerprint256;
          certs.push({
            cn: String(cur.subject?.CN ?? ''),
            issuerCn: String(cur.issuer?.CN ?? ''),
            notBefore: cur.valid_from,
            notAfter: cur.valid_to,
            selfSigned: self,
          });
          if (self) break;
          cur = cur.issuerCertificate;
        }
        const eph = sock.getEphemeralKeyInfo() as Partial<tls.EphemeralKeyInfo> | null;
        resolve({
          host,
          authorized: sock.authorized,
          authorizationError: sock.authorizationError ? String((sock.authorizationError as Error).message ?? sock.authorizationError) : undefined,
          protocol: sock.getProtocol() ?? '',
          cipher: sock.getCipher()?.name ?? '',
          ephemeral: eph ? { type: eph.type, name: eph.name, size: eph.size } : {},
          leafKeyType: sock.getPeerX509Certificate()?.publicKey.asymmetricKeyType,
          certs,
        });
      } catch (e) {
        reject(e);
      } finally {
        sock.end();
      }
    });
    sock.on('timeout', () => {
      sock.destroy();
      reject(new Error('timeout'));
    });
    sock.on('error', reject);
  });
}

export async function GET(req: Request) {
  const host = new URL(req.url).searchParams.get('host')?.toLowerCase() ?? '';
  if (!isChainHost(host)) return NextResponse.json({ error: 'host not in this lab' }, { status: 400 });

  const hit = cache.get(host);
  if (hit && Date.now() - hit.at < TTL_MS) return respond(hit.body);

  try {
    const body = buildChainResponse(await probe(host), true, new Date().toISOString());
    cache.set(host, { at: Date.now(), body });
    return respond(body);
  } catch {
    return NextResponse.json(CAPTURES[host], { headers: { 'Cache-Control': 's-maxage=60' } });
  }
}

const respond = (body: ChainResponse) =>
  NextResponse.json(body, { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } });
