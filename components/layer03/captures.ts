import type { ChainResponse } from '@/lib/chain';
import { buildChainResponse } from '@/lib/chainBuild';
import type { ChainHost } from '@/lib/config';

/**
 * Fallback fixtures (served with live: false). Recorded from a real probe on
 * 24 Sep 2026; the live endpoint replaces them whenever it can connect.
 */
const RECORDED_AT = '2026-09-24T21:00:00.000Z';

export const CAPTURES: Record<ChainHost, ChainResponse> = {
  'github.com': buildChainResponse(
    {
      host: 'github.com',
      authorized: true,
      protocol: 'TLSv1.3',
      cipher: 'TLS_AES_128_GCM_SHA256',
      ephemeral: { type: 'ECDH', name: 'X25519', size: 253 },
      leafKeyType: 'ec',
      certs: [
        { cn: 'github.com', issuerCn: 'Sectigo Public Server Authentication CA DV E36', notBefore: 'Sep  1 00:00:00 2026 GMT', notAfter: 'Nov 29 23:59:59 2026 GMT', selfSigned: false },
        { cn: 'Sectigo Public Server Authentication CA DV E36', issuerCn: 'Sectigo Public Server Authentication Root E46', notBefore: 'Mar 22 00:00:00 2021 GMT', notAfter: 'Mar 21 23:59:59 2036 GMT', selfSigned: false },
        { cn: 'Sectigo Public Server Authentication Root E46', issuerCn: 'USERTrust ECC Certification Authority', notBefore: 'Mar 22 00:00:00 2021 GMT', notAfter: 'Jan 18 23:59:59 2038 GMT', selfSigned: false },
        { cn: 'USERTrust ECC Certification Authority', issuerCn: 'USERTrust ECC Certification Authority', notBefore: 'Feb  1 00:00:00 2010 GMT', notAfter: 'Jan 18 23:59:59 2038 GMT', selfSigned: true },
      ],
    },
    false,
    RECORDED_AT,
  ),
  'incomplete-chain.badssl.com': buildChainResponse(
    {
      host: 'incomplete-chain.badssl.com',
      authorized: false,
      authorizationError: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
      protocol: 'TLSv1.2',
      cipher: 'ECDHE-RSA-AES128-GCM-SHA256',
      ephemeral: { type: 'ECDH', name: 'prime256v1', size: 256 },
      leafKeyType: 'rsa',
      certs: [{ cn: '*.badssl.com', issuerCn: 'YR2', notBefore: 'Jul 28 20:03:02 2026 GMT', notAfter: 'Oct 26 20:03:01 2026 GMT', selfSigned: false }],
    },
    false,
    RECORDED_AT,
  ),
};
