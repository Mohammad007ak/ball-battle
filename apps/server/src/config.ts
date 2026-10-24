import { defaultBalance, type Balance } from '@chakachak/content';
import type { DB } from './db';

/** Deep-merge a partial override onto the defaults (arrays are replaced, objects merged). */
export function mergeBalance(base: unknown, over: unknown): unknown {
  if (over === undefined) return base;
  if (Array.isArray(over) || typeof over !== 'object' || over === null) return over;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over)) out[k] = mergeBalance(out[k], v);
  return out;
}

/** Remote config: the active row overrides packages/content without an app update. */
export class RemoteConfig {
  version = 0;
  balance: Balance = defaultBalance;
  private loadedAt = 0;

  constructor(
    private db: DB,
    private now: () => number = Date.now,
  ) {
    this.reload();
  }

  reload() {
    const row = this.db
      .prepare(
        'select version, json from remote_config where active = 1 order by version desc limit 1',
      )
      .get() as { version: number; json: string } | undefined;
    this.version = row?.version ?? 0;
    this.balance = row
      ? (mergeBalance(defaultBalance, JSON.parse(row.json)) as Balance)
      : defaultBalance;
    this.loadedAt = this.now();
  }

  /** Current balance, re-read at most once a minute. */
  get(): Balance {
    if (this.now() - this.loadedAt > 60_000) this.reload();
    return this.balance;
  }
}
