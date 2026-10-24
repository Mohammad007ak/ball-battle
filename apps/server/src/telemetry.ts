import type { ErrorReport, TelemetryEvent } from '@chakachak/protocol';
import { tx, type DB } from './db';

const DAY = 86_400_000;

/** Store a batch of client events (analytics on our own server; no foreign services). */
export function recordEvents(db: DB, playerId: string, events: TelemetryEvent[], at: number) {
  const ins = db.prepare(
    'insert into events (player_id, name, data, client_at, at) values (?, ?, ?, ?, ?)',
  );
  tx(db, () => {
    for (const e of events) ins.run(playerId, e.n, e.d ? JSON.stringify(e.d) : null, e.t, at);
  });
}

export function recordError(db: DB, playerId: string | null, r: ErrorReport, at: number) {
  db.prepare(
    'insert into errors (player_id, kind, message, stack, source, app, device, at) values (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    playerId,
    r.kind,
    r.message,
    r.stack ?? null,
    r.source ?? null,
    r.app,
    r.device ?? null,
    at,
  );
}

export interface Retention {
  cohort: number;
  /** Day n → share of the cohort that started a session on their n-th day after signing up. */
  days: Record<number, number>;
}

/** Classic D1/D7/D30 retention for players created in [from, to), from `session_start` events. */
export function retention(db: DB, from: number, to: number, days = [1, 7, 30]): Retention {
  const cohort = (
    db
      .prepare('select count(*) as n from players where created_at >= ? and created_at < ?')
      .get(from, to) as { n: number }
  ).n;
  const q = db.prepare(
    `select count(distinct p.id) as n from players p join events e on e.player_id = p.id
     where p.created_at >= ? and p.created_at < ? and e.name = 'session_start'
       and e.at >= p.created_at + ? and e.at < p.created_at + ?`,
  );
  const out: Record<number, number> = {};
  for (const d of days) {
    const n = (q.get(from, to, d * DAY, (d + 1) * DAY) as { n: number }).n;
    out[d] = cohort ? n / cohort : 0;
  }
  return { cohort, days: out };
}
