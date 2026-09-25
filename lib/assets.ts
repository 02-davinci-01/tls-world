import 'server-only';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Lists owner-supplied asset slot files (SPEC §5.2). Runs at build/render time on the server. */
export function listSlotAssets(): string[] {
  const pub = join(process.cwd(), 'public');
  const out: string[] = [];
  try {
    for (const f of readdirSync(join(pub, 'lain'))) if (!f.startsWith('.') && f !== 'README.md') out.push(f);
  } catch {}
  return out;
}
