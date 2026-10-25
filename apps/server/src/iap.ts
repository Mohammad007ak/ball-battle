import type { Ctx } from './app';
import { AuthError } from './auth';
import { tx } from './db';
import { loadProfile } from './game';
import { assertNonNegative, writeLedger } from './ledger';

/**
 * Store purchases (gem packs). The phone pays in the store app and sends us the purchase token;
 * we ask the store whether it is real, grant the gems once per token, and only then does the
 * phone consume the purchase. A purchase the phone could not report (no internet, app killed)
 * is re-sent on the next launch.
 */
export interface StoreVerifier {
  /** True when the store confirms an unrefunded purchase of `product` with this token. */
  verify(product: string, token: string): Promise<boolean>;
}

const ROOT = 'https://pardakht.cafebazaar.ir/devapi/v2';
const SAFE = /^[A-Za-z0-9._-]{1,200}$/;
type Fetch = typeof fetch;

/**
 * Cafe Bazaar developer API (devapi v2). Either the Pishkhan API secret, or a Developer API
 * client with a refresh token (short-lived access tokens are fetched and cached).
 */
export class BazaarVerifier implements StoreVerifier {
  private access = '';
  private expires = 0;

  constructor(
    private pkg: string,
    private auth: { secret: string } | { clientId: string; clientSecret: string; refresh: string },
    private http: Fetch = fetch,
    private now: () => number = Date.now,
  ) {}

  async verify(product: string, token: string): Promise<boolean> {
    if (!SAFE.test(product) || !SAFE.test(token)) return false;
    let url = `${ROOT}/api/validate/${this.pkg}/inapp/${product}/purchases/${token}/`;
    const headers: Record<string, string> = { accept: 'application/json' };
    if ('secret' in this.auth) {
      headers['CAFEBAZAAR-PISHKHAN-API-SECRET'] = this.auth.secret;
      headers.authorization = 'Bearer ' + this.auth.secret;
    } else url += '?access_token=' + encodeURIComponent(await this.accessToken());
    const r = await this.http(url, { headers, signal: AbortSignal.timeout(20_000) });
    if (r.status !== 200) {
      if (r.status !== 404)
        console.warn('bazaar validate', r.status, await r.text().catch(() => ''));
      return false;
    }
    const j = (await r.json().catch(() => ({}))) as { purchaseState?: number };
    return j.purchaseState === 0; // 0 purchased, 1 refunded
  }

  private async accessToken(): Promise<string> {
    if (this.access && this.now() < this.expires) return this.access;
    if ('secret' in this.auth) return '';
    const r = await this.http(`${ROOT}/auth/token/`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.auth.clientId,
        client_secret: this.auth.clientSecret,
        refresh_token: this.auth.refresh,
      }).toString(),
      signal: AbortSignal.timeout(20_000),
    });
    const j = (await r.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
    if (r.status !== 200 || !j.access_token) throw new Error('bazaar token ' + r.status);
    this.access = j.access_token;
    this.expires = this.now() + ((j.expires_in ?? 3600) - 60) * 1000;
    return this.access;
  }
}

/** Bazaar verifier from the environment, or none (the shop then shows "soon"). */
export function bazaarFromEnv(env: NodeJS.ProcessEnv): BazaarVerifier | undefined {
  const pkg = env.BAZAAR_PACKAGE ?? 'ir.chakachak.game';
  if (env.BAZAAR_API_SECRET) return new BazaarVerifier(pkg, { secret: env.BAZAAR_API_SECRET });
  if (env.BAZAAR_CLIENT_ID && env.BAZAAR_CLIENT_SECRET && env.BAZAAR_REFRESH_TOKEN)
    return new BazaarVerifier(pkg, {
      clientId: env.BAZAAR_CLIENT_ID,
      clientSecret: env.BAZAAR_CLIENT_SECRET,
      refresh: env.BAZAAR_REFRESH_TOKEN,
    });
  return undefined;
}

/**
 * Verify one store purchase and grant its gems. Repeating a token the same player already
 * redeemed is fine (`granted: 0`) so the phone can consume it; another player's token is refused.
 */
export async function redeem(
  c: Ctx,
  playerId: string,
  store: string,
  product: string,
  token: string,
): Promise<{ granted: number }> {
  const v = c.stores[store];
  if (!v) throw new AuthError('storeOff');
  const pack = c.config.get().game.GEM_PACKS.find((p) => p.id === product);
  if (!pack) throw new AuthError('badRequest');
  const seen = () =>
    c.db.prepare('select player_id from purchases where token = ?').get(token) as
      { player_id: string } | undefined;
  const done = seen();
  if (done) {
    if (done.player_id !== playerId) throw new AuthError('notYours');
    return { granted: 0 };
  }
  if (!(await v.verify(product, token))) throw new AuthError('notVerified');
  return tx(c.db, () => {
    // Re-checked inside the transaction: two requests with one token may have raced the await.
    const again = seen();
    if (again) {
      if (again.player_id !== playerId) throw new AuthError('notYours');
      return { granted: 0 };
    }
    const now = c.now(),
      before = loadProfile(c, playerId),
      S = structuredClone(before);
    S.gems += pack.gems;
    assertNonNegative(S);
    c.db
      .prepare(
        'insert into purchases (token, store, player_id, product, gems, at) values (?, ?, ?, ?, ?, ?)',
      )
      .run(token, store, playerId, product, pack.gems, now);
    c.db.prepare('update players set profile = ? where id = ?').run(JSON.stringify(S), playerId);
    writeLedger(c.db, playerId, before, S, 'iap', `${store}:${product}`, now);
    return { granted: pack.gems };
  });
}
