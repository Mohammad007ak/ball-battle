import { randomBytes, randomInt } from 'node:crypto';
import * as EC from '@chakachak/economy';
import type { MatchLog, MatchSetup } from '@chakachak/engine';
import type { Action, ActResult } from '@chakachak/protocol';
import type { Ctx } from './app';
import { tx } from './db';
import { assertNonNegative, writeLedger } from './ledger';

/** Server-side randomness for chests and match seeds (never the client's). */
export const rand = () => randomInt(0, 2 ** 47) / 2 ** 47;

/** Calendar day in Iran (yyyymmdd) for the daily shop. */
export function dayKey(now: number): number {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(new Date(now));
  return Number(p.replaceAll('-', ''));
}

export function loadProfile(c: Ctx, playerId: string): EC.Profile {
  const row = c.db.prepare('select profile from players where id = ?').get(playerId) as {
    profile: string;
  };
  return EC.fixProfile(c.config.get(), JSON.parse(row.profile) as Partial<EC.Profile>);
}

export function me(c: Ctx, playerId: string) {
  const now = c.now();
  return {
    profile: loadProfile(c, playerId),
    now,
    dayKey: dayKey(now),
    configVersion: c.config.version,
  };
}

/** Matches against bots: hand out a setup, later verify the recorded inputs by replay. */
function matchAction(
  c: Ctx,
  playerId: string,
  S: EC.Profile,
  a: Action & { t: 'matchStart' | 'match' },
) {
  const B = c.config.get(),
    now = c.now();
  const open = c.db
    .prepare('select id, mode, setup from matches where player_id = ? and finished_at is null')
    .get(playerId) as { id: string; mode: '1v1' | '2v2'; setup: string } | undefined;
  if (a.t === 'matchStart') {
    // Leaving a match without finishing it counts as a loss (no farming by quitting).
    if (open) {
      const r = EC.matchResult(B, S, false, open.mode);
      c.db
        .prepare('update matches set finished_at = ?, result = ? where id = ?')
        .run(now, JSON.stringify({ abandoned: true, ...r }), open.id);
    }
    const id = randomBytes(12).toString('base64url'),
      setup = EC.matchSetup(B, S, a.mode, rand);
    c.db
      .prepare(
        'insert into matches (id, player_id, mode, setup, started_at) values (?, ?, ?, ?, ?)',
      )
      .run(id, playerId, a.mode, JSON.stringify(setup), now);
    return { id, setup };
  }
  if (!open || open.id !== a.id) throw new EC.EconomyError('noMatch');
  const r = EC.matchFinish(B, S, JSON.parse(open.setup) as MatchSetup, a.log as MatchLog);
  c.db
    .prepare('update matches set finished_at = ?, log = ?, result = ? where id = ?')
    .run(now, JSON.stringify(a.log), JSON.stringify(r), open.id);
  return r;
}

/**
 * Apply one player action atomically: load profile, run the shared economy rule, write the
 * profile, the ledger rows and the idempotency record in one transaction. A repeated `idem`
 * returns the first response without applying anything again.
 */
export function act(c: Ctx, playerId: string, a: Action, idem: string): ActResult {
  return tx(c.db, () => {
    const seen = c.db
      .prepare('select response from idem where player_id = ? and key = ?')
      .get(playerId, idem) as { response: string } | undefined;
    if (seen) return JSON.parse(seen.response) as ActResult;
    const before = loadProfile(c, playerId),
      S = structuredClone(before),
      now = c.now();
    let res: ActResult;
    try {
      const data =
        a.t === 'matchStart' || a.t === 'match'
          ? matchAction(c, playerId, S, a)
          : EC.applyAction(c.config.get(), S, a, { now, dayKey: dayKey(now), rand, dev: c.dev });
      assertNonNegative(S);
      c.db.prepare('update players set profile = ? where id = ?').run(JSON.stringify(S), playerId);
      writeLedger(c.db, playerId, before, S, a.t, 'id' in a ? a.id : null, now);
      res = data === undefined ? { ok: true } : { ok: true, data };
    } catch (e) {
      if (!(e instanceof EC.EconomyError)) throw e;
      res = e.need ? { ok: false, code: e.code, need: e.need } : { ok: false, code: e.code };
    }
    c.db
      .prepare('insert into idem (player_id, key, response, at) values (?, ?, ?, ?)')
      .run(playerId, idem, JSON.stringify(res), now);
    return res;
  });
}
