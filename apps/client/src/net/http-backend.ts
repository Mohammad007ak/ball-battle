import type { Balance } from '@chakachak/content';
import type { Profile } from '@chakachak/economy';
import type { AccountApi, Action, ActResult, Backend } from './backend';

const TOKEN = 'chakachak-token';

interface Me {
  profile: Profile;
  now: number;
  dayKey: number;
  linked: boolean;
  token?: string;
  outcome?: 'linked' | 'switched' | 'created';
}

/**
 * The real game server. Gameplay runs on the phone; the server owns the profile, chests and
 * rewards. The first launch creates a guest account automatically; linking a phone is optional.
 */
export class HttpBackend implements Backend, AccountApi {
  readonly dev = false;
  readonly account: AccountApi = this;
  private S!: Profile;
  private offset = 0;
  private day = 0;
  private isLinked = false;
  private phone = false;
  private storeList: string[] = [];
  private token_: string | null = null;

  constructor(private base: string) {}

  /** Log in (or create a guest), then load the remote balance and the profile. */
  async init(): Promise<Balance> {
    this.token_ = localStorage.getItem(TOKEN);
    if (this.token_) {
      try {
        this.apply(await this.req<Me>('GET', '/v1/me'));
      } catch (e) {
        if ((e as Error).message !== 'unauthorized') throw e;
        this.token_ = null;
      }
    }
    if (!this.token_) this.apply(await this.req<Me>('POST', '/v1/auth/guest'));
    const cfg = await this.req<{ balance: Balance; phoneLogin?: boolean; stores?: string[] }>(
      'GET',
      '/v1/config',
    );
    this.phone = !!cfg.phoneLogin;
    this.storeList = cfg.stores ?? [];
    return cfg.balance;
  }

  profile(): Profile {
    return this.S;
  }
  now(): number {
    return Date.now() + this.offset;
  }
  dayKey(): number {
    return this.day;
  }
  onlineUrl(): string {
    return this.base.replace(/^http/, 'ws') + '/v1/ws';
  }
  token(): string | null {
    return this.token_;
  }
  setProfile(p: Profile) {
    this.S = p;
  }
  async refresh() {
    this.apply(await this.req<Me>('GET', '/v1/me'));
  }
  /** Stores whose purchases the server can verify (gem shop open). */
  stores(): string[] {
    return this.storeList;
  }
  /** Send a store purchase to the server; resolves with the gems granted (0 if already counted). */
  async iap(store: string, product: string, token: string): Promise<number> {
    const r = await this.req<{ granted: number; profile: Profile }>('POST', '/v1/iap', {
      store,
      product,
      token,
    });
    this.S = r.profile;
    return r.granted;
  }
  phoneEnabled(): boolean {
    return this.phone;
  }
  linked(): boolean {
    return this.isLinked;
  }

  async act(a: Action): Promise<ActResult> {
    // One key per user action: retries after a dropped connection can never apply it twice.
    const idem = crypto.randomUUID();
    for (let attempt = 0; ; attempt++) {
      try {
        const r = await this.req<ActResult & { profile: Profile; now: number }>('POST', '/v1/act', {
          action: a,
          idem,
        });
        this.S = r.profile;
        this.offset = r.now - Date.now();
        return r.ok ? (r.data === undefined ? { ok: true } : { ok: true, data: r.data }) : r;
      } catch (e) {
        if (attempt >= 2 || (e as Error).message === 'unauthorized')
          return { ok: false, code: 'network' };
        await new Promise((res) => setTimeout(res, 800 * (attempt + 1)));
      }
    }
  }

  async requestOtp(phone: string): Promise<ActResult> {
    return this.call(() => this.req('POST', '/v1/auth/otp', { phone }));
  }
  async verify(phone: string, code: string): Promise<ActResult> {
    return this.call(async () => {
      const me = await this.req<Me>('POST', '/v1/auth/verify', { phone, code });
      this.apply(me);
      return { outcome: me.outcome };
    });
  }
  async deleteAccount(): Promise<ActResult> {
    return this.call(async () => {
      await this.req('DELETE', '/v1/account');
      localStorage.removeItem(TOKEN);
      this.token_ = null;
      this.apply(await this.req<Me>('POST', '/v1/auth/guest'));
    });
  }

  private apply(me: Me) {
    if (me.token) {
      this.token_ = me.token;
      localStorage.setItem(TOKEN, me.token);
    }
    this.S = me.profile;
    this.offset = me.now - Date.now();
    this.day = me.dayKey;
    this.isLinked = me.linked;
  }

  private async call(fn: () => Promise<unknown>): Promise<ActResult> {
    try {
      const data = await fn();
      return data && typeof data === 'object' ? { ok: true, data } : { ok: true };
    } catch (e) {
      return { ok: false, code: (e as Error).message || 'network' };
    }
  }

  private async req<T>(method: string, path: string, body?: unknown): Promise<T> {
    const r = await fetch(this.base + path, {
      method,
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(this.token_ ? { authorization: 'Bearer ' + this.token_ } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(10_000),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) throw new Error(j.error || 'network');
    return j as T;
  }
}
