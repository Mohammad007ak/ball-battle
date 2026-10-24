import { describe, expect, it } from 'vitest';
import { buildApp } from './app';
import { openDb } from './db';
import { ConsoleSms } from './sms';
import { retention } from './telemetry';

const DAY = 86_400_000;

function setup() {
  let t = 1_700_000_000_000;
  const { app, ctx } = buildApp({
    db: openDb(':memory:'),
    sms: new ConsoleSms(),
    secret: 'x'.repeat(32),
    now: () => t,
  });
  const post = async (url: string, body: unknown, token?: string) => {
    const r = await app.inject({
      method: 'POST',
      url,
      payload: body as object,
      headers: token ? { authorization: 'Bearer ' + token } : {},
    });
    return r.statusCode;
  };
  const guest = async () =>
    (await app.inject({ method: 'POST', url: '/v1/auth/guest' })).json().token as string;
  return { ctx, post, guest, start: t, advance: (ms: number) => (t += ms) };
}

describe('telemetry', () => {
  it('stores validated event batches for logged-in players only', async () => {
    const s = setup(),
      tok = await s.guest();
    const ev = {
      events: [
        { n: 'session_start', t: 1 },
        { n: 'match', t: 2, d: { win: true } },
      ],
    };
    expect(await s.post('/v1/events', ev)).toBe(401);
    expect(await s.post('/v1/events', ev, tok)).toBe(200);
    expect(await s.post('/v1/events', { events: [{ n: 'Bad Name!', t: 1 }] }, tok)).toBe(400);
    const rows = s.ctx.db.prepare('select name, data from events order by id').all();
    expect(rows).toEqual([
      { name: 'session_start', data: null },
      { name: 'match', data: '{"win":true}' },
    ]);
  });

  it('accepts error reports without login', async () => {
    const s = setup();
    const r = { kind: 'error', message: 'x is undefined', app: '1.0.0', stack: 'at f' };
    expect(await s.post('/v1/errors', r)).toBe(200);
    expect(await s.post('/v1/errors', { ...r, kind: 'nope' })).toBe(400);
    expect(s.ctx.db.prepare('select player_id, message from errors').all()).toEqual([
      { player_id: null, message: 'x is undefined' },
    ]);
  });

  it('computes D1/D7 retention from session_start events', async () => {
    const s = setup();
    const a = await s.guest(),
      b = await s.guest();
    s.advance(DAY + 1000);
    await s.post('/v1/events', { events: [{ n: 'session_start', t: 0 }] }, a);
    s.advance(6 * DAY);
    await s.post('/v1/events', { events: [{ n: 'session_start', t: 0 }] }, a);
    await s.post('/v1/events', { events: [{ n: 'session_start', t: 0 }] }, b);
    expect(retention(s.ctx.db, s.start, s.start + DAY)).toEqual({
      cohort: 2,
      days: { 1: 0.5, 7: 1, 30: 0 },
    });
  });
});
