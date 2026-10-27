import { createPublicKey, createVerify } from 'node:crypto';
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
/** What the store app handed the phone: the purchase JSON and the store's signature of it. */
export interface Signed {
  json: string;
  sig: string;
}

export interface StoreVerifier {
  /** True when the store confirms an unrefunded purchase of `product` with this token. */
  verify(product: string, token: string, signed?: Signed): Promise<boolean>;
}

const ROOT = 'https://pardakht.cafebazaar.ir/devapi/v2';
const SAFE = /^[A-Za-z0-9._-]{1,200}$/;
type Fetch = typeof fetch;

type Auth = { secret: string } | { clientId: string; clientSecret: string; refresh: string };

/**
 * Cafe Bazaar purchase check, two independent ways (either one is enough):
 * 1. The purchase JSON signed by Bazaar (SHA1withRSA), checked with the app's public RSA key from
 *    Pishkhan — offline, the same check Poolakey does on the phone, but here the phone cannot fake it.
 * 2. Bazaar's developer API (devapi v2) with the Pishkhan API secret or a Developer API client.
 */
export class BazaarVerifier implements StoreVerifier {
  private access = '';
  private expires = 0;
  private key: ReturnType<typeof createPublicKey> | null;

  constructor(
    private pkg: string,
    private auth: Auth | null,
    private http: Fetch = fetch,
    private now: () => number = Date.now,
    rsaKey = '',
  ) {
    this.key = rsaKey
      ? createPublicKey({
          key: Buffer.from(rsaKey.replace(/\s+/g, ''), 'base64'),
          format: 'der',
          type: 'spki',
        })
      : null;
  }

  async verify(product: string, token: string, signed?: Signed): Promise<boolean> {
    if (!SAFE.test(product) || !SAFE.test(token)) return false;
    if (signed && this.signatureOk(product, token, signed)) return true;
    if (!this.auth) return false;
    try {
      return await this.api(product, token);
    } catch (e) {
      console.warn('bazaar api', e);
      return false;
    }
  }

  /** Signed purchase JSON for exactly this package, product and token, not refunded. */
  signatureOk(product: string, token: string, s: Signed): boolean {
    if (!this.key || s.json.length > 4000 || s.sig.length > 1000) return false;
    try {
      const v = createVerify('RSA-SHA1');
      v.update(s.json, 'utf8');
      if (!v.verify(this.key, s.sig, 'base64')) {
        console.warn('bazaar signature mismatch');
        return false;
      }
      const j = JSON.parse(s.json) as Record<string, unknown>;
      return (
        j.packageName === this.pkg &&
        j.productId === product &&
        j.purchaseToken === token &&
        (j.purchaseState === undefined || j.purchaseState === 0)
      );
    } catch {
      return false;
    }
  }

  /** Is the API key accepted? A made-up token answers 404 when it is, 401/403 when it is not. */
  async probe(): Promise<{ rsa: boolean; api: number | 'off' | 'error' }> {
    const rsa = !!this.key;
    if (!this.auth) return { rsa, api: 'off' };
    try {
      const r = await this.request('gems_80', 'key-check');
      return { rsa, api: r.status };
    } catch {
      return { rsa, api: 'error' };
    }
  }

  private async api(product: string, token: string): Promise<boolean> {
    const r = await this.request(product, token);
    if (r.status !== 200) {
      console.warn('bazaar validate', r.status, (await r.text().catch(() => '')).slice(0, 300));
      return false;
    }
    const j = (await r.json().catch(() => ({}))) as { purchaseState?: number };
    if (j.purchaseState !== 0)
      console.warn('bazaar validate state', JSON.stringify(j).slice(0, 300));
    return j.purchaseState === 0; // 0 purchased, 1 refunded
  }

  private async request(product: string, token: string): Promise<Response> {
    const auth = this.auth!;
    let url = `${ROOT}/api/validate/${this.pkg}/inapp/${product}/purchases/${token}/`;
    const headers: Record<string, string> = { accept: 'application/json' };
    if ('secret' in auth) {
      headers['CAFEBAZAAR-PISHKHAN-API-SECRET'] = auth.secret;
      headers.authorization = 'Bearer ' + auth.secret;
    } else url += '?access_token=' + encodeURIComponent(await this.accessToken());
    return this.http(url, { headers, signal: AbortSignal.timeout(20_000) });
  }

  private async accessToken(): Promise<string> {
    if (this.access && this.now() < this.expires) return this.access;
    if (!this.auth || 'secret' in this.auth) return '';
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
  const pkg = env.BAZAAR_PACKAGE ?? 'ir.chakachak.game',
    rsa = env.BAZAAR_RSA_KEY ?? '';
  const auth: Auth | null = env.BAZAAR_API_SECRET
    ? { secret: env.BAZAAR_API_SECRET }
    : env.BAZAAR_CLIENT_ID && env.BAZAAR_CLIENT_SECRET && env.BAZAAR_REFRESH_TOKEN
      ? {
          clientId: env.BAZAAR_CLIENT_ID,
          clientSecret: env.BAZAAR_CLIENT_SECRET,
          refresh: env.BAZAAR_REFRESH_TOKEN,
        }
      : null;
  return auth || rsa ? new BazaarVerifier(pkg, auth, fetch, Date.now, rsa) : undefined;
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
  signed?: Signed,
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
  if (!(await v.verify(product, token, signed))) {
    console.warn('iap not verified', store, product, playerId);
    throw new AuthError('notVerified');
  }
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
