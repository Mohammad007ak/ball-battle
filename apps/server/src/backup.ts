import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { DB } from './db';

/**
 * Consistent snapshot of the live database (`VACUUM INTO`) into DATA_DIR/backups, keeping the
 * newest `keep` files. Copy that folder off the server too (see docs/DEPLOY.md).
 */
export function backup(db: DB, dataDir: string, now: Date, keep = 14) {
  const dir = join(dataDir, 'backups');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `chakachak-${now.toISOString().replace(/[:.]/g, '-')}.db`);
  db.prepare('vacuum into ?').run(file);
  const all = readdirSync(dir)
    .filter((f) => f.endsWith('.db'))
    .sort();
  for (const f of all.slice(0, Math.max(0, all.length - keep))) rmSync(join(dir, f));
  return file;
}
