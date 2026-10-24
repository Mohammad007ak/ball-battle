import { describe, expect, it } from 'vitest';
import { defaultBalance as B } from '@chakachak/content';
import { buildApp } from './app';
import { openDb } from './db';
import { ConsoleSms } from './sms';

function setup() {
  let t = 1_700_000_000_000;
  const sms = new ConsoleSms();
  const { app, ctx } = buildApp({
    db: openDb(':memory:'),
    sms,
    secret: 'x'.repeat(32),
    now: () => t,
    testOtp: '12345',
  });
  const call = async (
    method: 'GET' | 'POST' | 'DELETE',
    url: string,
    token?: string,
    body?: unknown,
  ) => {
    const r = await app.inject({
      method,
      url,
      ...(body ? { payload: body as object } : {}),
      headers: token ? { authorization: 'Bearer ' + token } : {},
    });
    return { status: r.statusCode, body: r.json() };
  };
  let n = 0;
  const act = (token: string, action: object, idem = 'idem-key-' + n++) =>
    call('POST', '/v1/act', token, { action, idem });
  const guest = async () => (await call('POST', '/v1/auth/guest')).body.token as string;
  return { app, ctx, sms, call, act, guest, advance: (ms: number) => (t += ms) };
}

describe('server', () => {
  it('guest account is created without login and keeps progress', async () => {
    const s = setup();
    const tok = await s.guest();
    const me = await s.call('GET', '/v1/me', tok);
    expect(me.body).toMatchObject({ linked: false, profile: { coins: 100, gems: 120 } });
    expect((await s.call('GET', '/v1/me')).status).toBe(401);
  });

  it('chest timers are real time and decided by the server', async () => {
    const s = setup(),
      tok = await s.guest();
    expect((await s.act(tok, { t: 'unlock', slot: 0 })).body.ok).toBe(true);
    expect((await s.act(tok, { t: 'unlock', slot: 1 })).body).toMatchObject({
      ok: false,
      code: 'oneAtATime',
    });
    s.advance(14 * 60_000);
    const r = await s.act(tok, { t: 'open', slot: 0 }); // 1 min left → 1 gem
    expect(r.body.ok).toBe(true);
    expect(r.body.data.items[0].type).toBe('coins');
    expect((await s.call('GET', '/v1/me', tok)).body.profile.gems).toBe(119);
  });

  it('two concurrent opens of the same chest grant it once', async () => {
    const s = setup(),
      tok = await s.guest();
    await s.act(tok, { t: 'unlock', slot: 0 });
    s.advance(16 * 60_000);
    const [a, b] = await Promise.all([
      s.act(tok, { t: 'open', slot: 0 }),
      s.act(tok, { t: 'open', slot: 0 }),
    ]);
    expect([a.body.ok, b.body.ok].sort()).toEqual([false, true]);
    const rows = s.ctx.db
      .prepare("select count(*) n from ledger where reason = 'open' and key = 'coins'")
      .get() as { n: number };
    expect(rows.n).toBe(1);
  });

  it('a retried request (same idem) is applied once', async () => {
    const s = setup(),
      tok = await s.guest();
    await s.act(tok, { t: 'unlock', slot: 0 });
    s.advance(16 * 60_000);
    const a = await s.act(tok, { t: 'open', slot: 0 }, 'same-key-1');
    const b = await s.act(tok, { t: 'open', slot: 0 }, 'same-key-1');
    expect(b.body.data).toEqual(a.body.data);
    const me = await s.call('GET', '/v1/me', tok);
    expect(me.body.profile.coins).toBe(100 + a.body.data.items[0].n);
  });

  it('the client cannot grant itself anything', async () => {
    const s = setup(),
      tok = await s.guest();
    expect((await s.act(tok, { t: 'cheat', what: 'gems' })).body).toMatchObject({
      ok: false,
      code: 'forbidden',
    });
    expect(
      (await s.call('POST', '/v1/act', tok, { action: { t: 'gems', n: 999 }, idem: 'abcdefgh' }))
        .status,
    ).toBe(400);
    expect((await s.act(tok, { t: 'upgrade', k: 'archer' })).body).toMatchObject({ ok: false });
    // A made-up "win" is replayed by the server and rejected.
    const start = await s.act(tok, { t: 'matchStart', mode: '1v1' });
    const fake = await s.act(tok, {
      t: 'match',
      id: start.body.data.id,
      log: { rounds: [{ pick: 0, inputs: [] }] },
    });
    expect(fake.body).toMatchObject({ ok: false, code: 'badLog' });
    const me = await s.call('GET', '/v1/me', tok);
    expect(me.body.profile).toMatchObject({ gems: 120, coins: 100, trophies: 0 });
  });

  it('a real match is verified by replay; quitting a match counts as a loss', async () => {
    const s = setup(),
      tok = await s.guest();
    const start = await s.act(tok, { t: 'matchStart', mode: '1v1' });
    expect(start.body.data.setup.teams[1]).toHaveLength(2);
    const sur = await s.act(tok, {
      t: 'match',
      id: start.body.data.id,
      log: { rounds: [], surrender: true },
    });
    expect(sur.body.data).toMatchObject({ win: false, tier: -1 });
    await s.act(tok, { t: 'matchStart', mode: '1v1' });
    await s.act(tok, { t: 'matchStart', mode: '1v1' }); // abandoned the previous one
    const me = await s.call('GET', '/v1/me', tok);
    expect(me.body.profile.losses).toBe(2);
  });

  it('linking a phone keeps guest progress; a new device can switch to it', async () => {
    const s = setup(),
      tok = await s.guest();
    await s.act(tok, { t: 'team', i: 0, k: 'rage' });
    expect((await s.call('POST', '/v1/auth/otp', undefined, { phone: '۰۹۱۲۱۲۳۴۵۶۷' })).status).toBe(
      200,
    );
    expect(s.sms.sent[0]).toEqual({ phone: '989121234567', code: '12345' });
    const link = await s.call('POST', '/v1/auth/verify', tok, {
      phone: '09121234567',
      code: '12345',
    });
    expect(link.body).toMatchObject({
      outcome: 'linked',
      linked: true,
      profile: { team: ['rage', 'archer'] },
    });
    // New phone, fresh guest, then log in with the same number → back to the saved account.
    const tok2 = await s.guest();
    s.advance(61_000);
    await s.call('POST', '/v1/auth/otp', undefined, { phone: '+989121234567' });
    const sw = await s.call('POST', '/v1/auth/verify', tok2, {
      phone: '9121234567',
      code: '12345',
    });
    expect(sw.body).toMatchObject({ outcome: 'switched', profile: { team: ['rage', 'archer'] } });
  });

  it('wrong codes are limited and account deletion revokes access', async () => {
    const s = setup(),
      tok = await s.guest();
    await s.call('POST', '/v1/auth/otp', undefined, { phone: '09121234567' });
    for (let i = 0; i < 5; i++)
      expect(
        (await s.call('POST', '/v1/auth/verify', tok, { phone: '09121234567', code: '00000' })).body
          .error,
      ).toBe('wrongCode');
    expect(
      (await s.call('POST', '/v1/auth/verify', tok, { phone: '09121234567', code: '12345' })).body
        .error,
    ).toBe('codeExpired');
    expect((await s.call('DELETE', '/v1/account', tok)).status).toBe(200);
    expect((await s.call('GET', '/v1/me', tok)).status).toBe(401);
  });

  it('serves the remote config', async () => {
    const s = setup();
    s.ctx.db
      .prepare('insert into remote_config (version, json, active, at) values (2, ?, 1, 0)')
      .run(JSON.stringify({ game: { ECON: { skipSecPerGem: 600 } } }));
    s.ctx.config.reload();
    const r = await s.call('GET', '/v1/config');
    expect(r.body.version).toBe(2);
    expect(r.body.balance.game.ECON).toMatchObject({
      skipSecPerGem: 600,
      leagueBonus: B.game.ECON.leagueBonus,
    });
  });
});
