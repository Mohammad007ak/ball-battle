import { createHash, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { AuthError } from './auth';
import type { RemoteConfig } from './config';
import type { DB } from './db';
import { PAGE } from './admin-page';

export interface PlayerStat {
  id: string;
  linked: boolean;
  trophies: number;
  wins: number;
  coins: number;
  gems: number;
  matches: number;
  createdAt: number;
  lastMatchAt: number | null;
}

export interface Day {
  /** Start of the day in Asia/Tehran (UTC+3:30, no DST since 1401), as epoch ms. */
  day: number;
  signups: number;
  matches: number;
  active: number;
}

export interface Stats {
  players: number;
  linked: number;
  /** Players with a finished match in the last 24 hours / 7 days. */
  active24h: number;
  active7d: number;
  matches: number;
  matches24h: number;
  byMode: Record<string, number>;
  purchases: { count: number; gems: number; toman: number; byProduct: Record<string, number> };
  errors24h: number;
  /** Gem packs as the server serves them now (remote config applied). */
  config: { version: number; gemPacks: { id: string; gems: number; toman: number }[] };
  days: Day[];
  list: PlayerStat[];
}

const DAY = 86_400_000,
  TEHRAN = 3.5 * 3_600_000;
const dayOf = (t: number) => Math.floor((t + TEHRAN) / DAY) * DAY - TEHRAN;

function players(db: DB): PlayerStat[] {
  const rows = db
    .prepare(
      `select p.id, p.phone_hash, p.profile, p.created_at,
              count(m.id) as matches, max(m.finished_at) as last
         from players p
         left join matches m on m.player_id = p.id and m.finished_at is not null
        where p.deleted_at is null
        group by p.id
        order by matches desc, p.created_at desc`,
    )
    .all() as {
    id: string;
    phone_hash: string | null;
    profile: string;
    created_at: number;
    matches: number;
    last: number | null;
  }[];
  return rows.map((r) => {
    const p = JSON.parse(r.profile) as Partial<
      Record<'trophies' | 'wins' | 'coins' | 'gems', number>
    >;
    return {
      id: r.id,
      linked: r.phone_hash !== null,
      trophies: p.trophies ?? 0,
      wins: p.wins ?? 0,
      coins: p.coins ?? 0,
      gems: p.gems ?? 0,
      matches: r.matches,
      createdAt: r.created_at,
      lastMatchAt: r.last,
    };
  });
}

/** Last 14 Tehran days, oldest first. */
function days(db: DB, list: PlayerStat[], now: number): Day[] {
  const first = dayOf(now) - 13 * DAY;
  const out = Array.from({ length: 14 }, (_, i) => ({
    day: first + i * DAY,
    signups: 0,
    matches: 0,
    active: 0,
  }));
  const at = (t: number) => out[Math.floor((dayOf(t) - first) / DAY)];
  for (const p of list) if (p.createdAt >= first) at(p.createdAt)!.signups++;
  const ms = db
    .prepare('select player_id, finished_at from matches where finished_at >= ?')
    .all(first) as { player_id: string; finished_at: number }[];
  const seen = new Set<string>();
  for (const m of ms) {
    const d = at(m.finished_at);
    if (!d) continue;
    d.matches++;
    const k = d.day + ':' + m.player_id;
    if (seen.has(k)) continue;
    seen.add(k);
    d.active++;
  }
  return out;
}

const count = (db: DB, sql: string, ...a: number[]) =>
  (db.prepare(sql).get(...a) as { n: number }).n;

/** Dashboard numbers (deleted accounts excluded). */
export function stats(db: DB, config: RemoteConfig, now: number): Stats {
  const list = players(db);
  const since = (ms: number) =>
    list.filter((p) => p.lastMatchAt !== null && now - p.lastMatchAt < ms).length;
  const byMode: Record<string, number> = {};
  for (const r of db
    .prepare('select mode, count(*) as n from matches where finished_at is not null group by mode')
    .all() as { mode: string; n: number }[])
    byMode[r.mode] = r.n;
  const gemPacks = config
    .get()
    .game.GEM_PACKS.map((p) => ({ id: p.id, gems: p.gems, toman: p.toman }));
  const price = new Map(gemPacks.map((p) => [p.id, p.toman]));
  const purchases = { count: 0, gems: 0, toman: 0, byProduct: {} as Record<string, number> };
  for (const r of db
    .prepare('select product, count(*) as n, sum(gems) as g from purchases group by product')
    .all() as { product: string; n: number; g: number }[]) {
    purchases.count += r.n;
    purchases.gems += r.g;
    purchases.toman += r.n * (price.get(r.product) ?? 0);
    purchases.byProduct[r.product] = r.n;
  }
  return {
    players: list.length,
    linked: list.filter((p) => p.linked).length,
    active24h: since(DAY),
    active7d: since(7 * DAY),
    matches: list.reduce((s, p) => s + p.matches, 0),
    matches24h: count(db, 'select count(*) as n from matches where finished_at >= ?', now - DAY),
    byMode,
    purchases,
    errors24h: count(db, 'select count(*) as n from errors where at >= ?', now - DAY),
    config: { version: config.version, gemPacks },
    days: days(db, list, now),
    list,
  };
}

const hash = (s: string) => createHash('sha256').update(s).digest();

/** Bearer token or `?key=` must equal ADMIN_TOKEN; without a token the dashboard is off. */
function allowed(token: string | undefined, req: FastifyRequest): boolean {
  if (!token) return false;
  const h = req.headers.authorization;
  const given = h?.startsWith('Bearer ') ? h.slice(7) : (req.query as { key?: string }).key;
  return !!given && timingSafeEqual(hash(given), hash(token));
}

export function adminRoutes(
  app: FastifyInstance,
  db: DB,
  config: RemoteConfig,
  now: () => number,
  token?: string,
) {
  app.get('/admin', async (_req, reply) => reply.type('text/html; charset=utf-8').send(PAGE));
  // Vazirmatn served from here, never from a font CDN (CLAUDE.md rule 8).
  const fonts = new Map<string, Buffer>();
  app.get('/admin/fonts/:file', async (req, reply) => {
    const f = (req.params as { file: string }).file;
    if (!/^vazirmatn-(arabic|latin)-(400|700)-normal\.woff2$/.test(f))
      throw new AuthError('badRequest');
    if (!fonts.has(f)) fonts.set(f, readFileSync(new URL('../assets/' + f, import.meta.url)));
    return reply
      .type('font/woff2')
      .header('cache-control', 'public, max-age=31536000, immutable')
      .send(fonts.get(f));
  });
  app.get('/admin/stats', async (req) => {
    if (!allowed(token, req)) throw new AuthError('unauthorized');
    return stats(db, config, now());
  });
}
