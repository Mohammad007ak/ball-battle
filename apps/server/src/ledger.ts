import type { Profile } from '@chakachak/economy';
import type { DB } from './db';

/** Every countable thing in a profile, flattened (coins, gems, trophies, cards.*, lv.*, skins). */
function balances(S: Profile): Map<string, number> {
  const m = new Map<string, number>([
    ['coins', S.coins],
    ['gems', S.gems],
    ['trophies', S.trophies],
  ]);
  for (const [k, v] of Object.entries(S.cards)) m.set('cards.' + k, v);
  for (const [k, v] of Object.entries(S.lv)) m.set('lv.' + k, v);
  for (const [k, list] of Object.entries(S.skins))
    for (const st of list ?? []) m.set(`skin.${k}.${st}`, 1);
  return m;
}

/**
 * Append one ledger row per changed balance. Called inside the same transaction as the profile
 * write, so the ledger always explains the profile (auditable, nothing changes unrecorded).
 */
export function writeLedger(
  db: DB,
  playerId: string,
  before: Profile,
  after: Profile,
  reason: string,
  ref: string | null,
  at: number,
) {
  const a = balances(before),
    b = balances(after),
    ins = db.prepare(
      'insert into ledger (player_id, key, delta, after, reason, ref, at) values (?, ?, ?, ?, ?, ?, ?)',
    );
  for (const key of new Set([...a.keys(), ...b.keys()])) {
    const x = a.get(key) ?? 0,
      y = b.get(key) ?? 0;
    if (x !== y) ins.run(playerId, key, y - x, y, reason, ref, at);
  }
}

/** Defensive invariant: no balance may ever be negative. */
export function assertNonNegative(S: Profile) {
  for (const [k, v] of balances(S))
    if (!(v >= 0) || !Number.isFinite(v)) throw new Error(`negative balance ${k}=${v}`);
}
