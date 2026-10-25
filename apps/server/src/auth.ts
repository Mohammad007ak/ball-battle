import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { freshProfile } from '@chakachak/economy';
import { rand } from './game';
import type { Ctx } from './app';
import { tx } from './db';
import { normalizePhone, phoneHash } from './phone';

const OTP_TTL = 2 * 60_000,
  OTP_RESEND = 60_000,
  OTP_ATTEMPTS = 5,
  SESSION_TTL = 180 * 24 * 3600_000;

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

export class AuthError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

export async function requestOtp(c: Ctx, rawPhone: string, ip: string) {
  const phone = normalizePhone(rawPhone);
  if (!phone) throw new AuthError('badPhone');
  if (!c.limit.take('otp-ip:' + ip, 10, 3600_000)) throw new AuthError('rateLimited');
  const h = phoneHash(c.secret, phone),
    now = c.now();
  const prev = c.db.prepare('select sent_at from otp where phone_hash = ?').get(h) as
    { sent_at: number } | undefined;
  if (prev && now - prev.sent_at < OTP_RESEND) throw new AuthError('tooSoon');
  if (!c.limit.take('otp-phone:' + h, 5, 3600_000)) throw new AuthError('rateLimited');
  const code = c.testOtp ?? String(randomInt(0, 100000)).padStart(5, '0');
  c.db
    .prepare(
      `insert into otp (phone_hash, code_hash, attempts, sent_at, expires_at) values (?, ?, 0, ?, ?)
       on conflict(phone_hash) do update set code_hash = excluded.code_hash, attempts = 0,
         sent_at = excluded.sent_at, expires_at = excluded.expires_at`,
    )
    .run(h, sha(h + code), now, now + OTP_TTL);
  await c.sms.sendOtp(phone, code);
}

function newSession(c: Ctx, playerId: string, now: number) {
  const token = randomBytes(32).toString('base64url');
  c.db
    .prepare(
      'insert into sessions (token_hash, player_id, created_at, expires_at) values (?, ?, ?, ?)',
    )
    .run(sha(token), playerId, now, now + SESSION_TTL);
  return token;
}

/** First launch: a guest account with no phone (Clash Royale style; linking is optional). */
export function createGuest(c: Ctx, ip: string) {
  if (!c.limit.take('guest-ip:' + ip, 300, 3600_000)) throw new AuthError('rateLimited');
  const now = c.now(),
    id = randomBytes(12).toString('base64url');
  return tx(c.db, () => {
    c.db
      .prepare('insert into players (id, phone_hash, profile, created_at) values (?, null, ?, ?)')
      .run(id, JSON.stringify(freshProfile(c.config.get(), rand)), now);
    return { token: newSession(c, id, now), playerId: id };
  });
}

/**
 * Check the code. If the phone already belongs to an account, log into it (`switched`).
 * Otherwise link the phone to the current guest (`linked`, progress kept), or create a new
 * account when there is no session.
 */
export function verifyOtp(c: Ctx, rawPhone: string, code: string, currentId: string | null) {
  const phone = normalizePhone(rawPhone);
  if (!phone) throw new AuthError('badPhone');
  const h = phoneHash(c.secret, phone),
    now = c.now();
  const r = tx(c.db, () => {
    const o = c.db
      .prepare('select code_hash, attempts, expires_at from otp where phone_hash = ?')
      .get(h) as { code_hash: string; attempts: number; expires_at: number } | undefined;
    if (!o || o.expires_at < now || o.attempts >= OTP_ATTEMPTS) throw new AuthError('codeExpired');
    const ok = timingSafeEqual(Buffer.from(o.code_hash), Buffer.from(sha(h + code)));
    if (!ok) {
      // Committed (not thrown inside the transaction) so the attempt limit really counts.
      c.db.prepare('update otp set attempts = attempts + 1 where phone_hash = ?').run(h);
      return null;
    }
    c.db.prepare('delete from otp where phone_hash = ?').run(h);
    const owner = c.db
      .prepare('select id from players where phone_hash = ? and deleted_at is null')
      .get(h) as { id: string } | undefined;
    let playerId: string, outcome: 'linked' | 'switched' | 'created';
    if (owner) {
      playerId = owner.id;
      outcome = owner.id === currentId ? 'linked' : 'switched';
    } else if (currentId) {
      c.db.prepare('update players set phone_hash = ? where id = ?').run(h, currentId);
      playerId = currentId;
      outcome = 'linked';
    } else {
      playerId = randomBytes(12).toString('base64url');
      c.db
        .prepare('insert into players (id, phone_hash, profile, created_at) values (?, ?, ?, ?)')
        .run(playerId, h, JSON.stringify(freshProfile(c.config.get(), rand)), now);
      outcome = 'created';
    }
    return { token: newSession(c, playerId, now), playerId, outcome };
  });
  if (!r) throw new AuthError('wrongCode');
  return r;
}

/** Whether the player has linked a phone (shown in settings). */
export const isLinked = (c: Ctx, playerId: string) =>
  !!(
    c.db.prepare('select phone_hash from players where id = ?').get(playerId) as {
      phone_hash: string | null;
    }
  ).phone_hash;

/** Player id for a bearer token, or throws. */
export function authenticate(c: Ctx, header: string | undefined): string {
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new AuthError('unauthorized');
  const s = c.db
    .prepare(
      `select s.player_id from sessions s join players p on p.id = s.player_id
       where s.token_hash = ? and s.expires_at > ? and p.deleted_at is null`,
    )
    .get(sha(token), c.now()) as { player_id: string } | undefined;
  if (!s) throw new AuthError('unauthorized');
  return s.player_id;
}

export function logout(c: Ctx, header: string | undefined) {
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  c.db.prepare('delete from sessions where token_hash = ?').run(sha(token));
}

/** Account deletion (store requirement): sessions gone, phone unlinked, profile wiped. */
export function deleteAccount(c: Ctx, playerId: string) {
  tx(c.db, () => {
    c.db.prepare('delete from sessions where player_id = ?').run(playerId);
    c.db
      .prepare(
        `update players set deleted_at = ?, phone_hash = 'deleted:' || id, profile = '{}' where id = ?`,
      )
      .run(c.now(), playerId);
  });
}
