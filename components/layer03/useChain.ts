'use client';

import type { ChainResponse } from '@/lib/chain';
import type { ChainHost } from '@/lib/config';
import { CAPTURES } from './captures';

const cache = new Map<ChainHost, Promise<ChainResponse>>();

/** Fetches /api/chain for an allowlisted host, falling back to the recorded capture. Memoised per page load. */
export function getChain(host: ChainHost): Promise<ChainResponse> {
  let p = cache.get(host);
  if (!p) {
    p = (async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 7000);
        const res = await fetch(`/api/chain?host=${encodeURIComponent(host)}`, { signal: ctrl.signal });
        clearTimeout(t);
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as ChainResponse;
        if (!Array.isArray(body.lines) || !Array.isArray(body.nodes)) throw new Error('bad shape');
        return body;
      } catch {
        cache.delete(host);
        return CAPTURES[host];
      }
    })();
    cache.set(host, p);
  }
  return p;
}
