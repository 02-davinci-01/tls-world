export const ARTICLE_URL = 'https://02-davinci-01.vercel.app/scripta/tls-offloading-by-a-dummy';
export const CHAIN_HOSTS = ['github.com', 'incomplete-chain.badssl.com'] as const;
export type ChainHost = (typeof CHAIN_HOSTS)[number];
export const IDLE_MS = 40_000;
export const REDIRECT_SECONDS = 8;

export const isChainHost = (h: string): h is ChainHost => (CHAIN_HOSTS as readonly string[]).includes(h);
