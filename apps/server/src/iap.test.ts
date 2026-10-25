import { describe, expect, it } from 'vitest';
import { buildApp } from './app';
import { openDb } from './db';
import { BazaarVerifier, type StoreVerifier } from './iap';
import { ConsoleSms } from './sms';

function setup(stores: Record<string, StoreVerifier>) {
  const db = openDb(':memory:');
  const { app } = buildApp({ db, sms: new ConsoleSms(), secret: 'x'.repeat(32), stores });
  const call = async (url: string, token?: string, body?: object) => {
    const r = await app.inject({
      method: body || url.includes('guest') ? 'POST' : 'GET',
      url,
      ...(body ? { payload: body } : {}),
      headers: token ? { authorization: 'Bearer ' + token } : {},
    });
    return { status: r.statusCode, body: r.json() };
  };
  const guest = async () => (await call('/v1/auth/guest')).body.token as string;
  const gems = async (t: string) => (await call('/v1/me', t)).body.profile.gems as number;
  const buy = (t: string, token: string, product = 'gems_500') =>
    call('/v1/iap', t, { store: 'bazaar', product, token });
  return { db, call, guest, gems, buy };
}

const valid: StoreVerifier = { verify: async (_p, token) => token.startsWith('ok') };

describe('in-app purchases', () => {
  it('grants a verified pack once per token, with a ledger row', async () => {
    const s = setup({ bazaar: valid }),
      t = await s.guest(),
      g0 = await s.gems(t);
    const r = await s.buy(t, 'ok-1');
    expect(r.status).toBe(200);
    expect(r.body.granted).toBe(500);
    expect(r.body.profile.gems).toBe(g0 + 500);
    // The phone repeats the token (consume failed, app restarted): accepted, nothing granted.
    expect((await s.buy(t, 'ok-1')).body.granted).toBe(0);
    expect(await s.gems(t)).toBe(g0 + 500);
    const row = s.db.prepare("select delta, reason from ledger where key = 'gems'").get();
    expect(row).toEqual({ delta: 500, reason: 'iap' });
  });

  it("refuses unverified tokens, unknown packs and another player's token", async () => {
    const s = setup({ bazaar: valid }),
      a = await s.guest(),
      b = await s.guest(),
      g0 = await s.gems(a);
    expect((await s.buy(a, 'fake')).status).toBe(402);
    expect((await s.buy(a, 'ok-2', 'gems_999999')).status).toBe(400);
    await s.buy(a, 'ok-3');
    expect((await s.buy(b, 'ok-3')).status).toBe(409);
    expect(await s.gems(a)).toBe(g0 + 500);
  });

  it('reports the shop as off when the store has no verifier', async () => {
    const s = setup({}),
      t = await s.guest();
    expect((await s.call('/v1/config')).body.stores).toEqual([]);
    expect((await s.buy(t, 'ok-1')).status).toBe(503);
  });

  it('asks Bazaar with a refreshed access token and accepts only purchaseState 0', async () => {
    const urls: string[] = [];
    const http = (async (url: string) => {
      urls.push(url);
      if (url.includes('/auth/token/'))
        return new Response(JSON.stringify({ access_token: 'AT', expires_in: 3600 }));
      if (url.includes('/purchases/good/'))
        return new Response(JSON.stringify({ purchaseState: 0 }));
      if (url.includes('/purchases/refunded/'))
        return new Response(JSON.stringify({ purchaseState: 1 }));
      return new Response('{"error":"not_found"}', { status: 404 });
    }) as typeof fetch;
    const v = new BazaarVerifier(
      'ir.chakachak.game',
      { clientId: 'c', clientSecret: 's', refresh: 'r' },
      http,
    );
    expect(await v.verify('gems_80', 'good')).toBe(true);
    expect(await v.verify('gems_80', 'refunded')).toBe(false);
    expect(await v.verify('gems_80', 'missing')).toBe(false);
    expect(await v.verify('gems_80', '../x')).toBe(false);
    expect(urls.filter((u) => u.includes('/auth/token/'))).toHaveLength(1);
    expect(urls[1]).toBe(
      'https://pardakht.cafebazaar.ir/devapi/v2/api/validate/ir.chakachak.game/inapp/gems_80/purchases/good/?access_token=AT',
    );
  });
});
