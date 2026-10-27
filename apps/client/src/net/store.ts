import { Capacitor, registerPlugin } from '@capacitor/core';
import type { HttpBackend } from './http-backend';

interface Purchase {
  product: string;
  token: string;
  /** Store-signed purchase data (Bazaar), checked by the server. */
  json?: string;
  sig?: string;
}
/** Native billing plugin (android: StorePlugin.java, one per store flavour). */
interface StorePlugin {
  info(): Promise<{ store: string; billing: boolean }>;
  buy(o: { product: string }): Promise<Purchase>;
  pending(): Promise<{ items: Purchase[] }>;
  consume(o: { token: string }): Promise<void>;
}
const Native = registerPlugin<StorePlugin>('Store');

export type BuyResult = { ok: true; granted: number } | { ok: false; code: string };

/**
 * Gem packs bought through the phone's store. The server verifies each purchase with the store
 * and grants the gems; only after that is the purchase consumed, so nothing paid is ever lost.
 */
export class GemStore {
  private store = '';

  constructor(private http: HttpBackend | null) {}

  /** Ask the native side which store this build is for; (the UI then calls `resume`). */
  async init(): Promise<void> {
    if (!this.http || !Capacitor.isNativePlatform()) return;
    try {
      const i = await Native.info();
      if (i.billing && this.http.stores().includes(i.store)) this.store = i.store;
    } catch {
      return;
    }
  }

  /** The buy buttons work (store build with billing, and the server verifies that store). */
  open(): boolean {
    return !!this.store;
  }

  async buy(product: string): Promise<BuyResult> {
    if (!this.store || !this.http) return { ok: false, code: 'unavailable' };
    let p: Purchase;
    try {
      p = await Native.buy({ product });
    } catch (e) {
      return { ok: false, code: (e as { message?: string }).message || 'failed' };
    }
    return this.redeem(p);
  }

  /** Purchases paid earlier but not yet granted (no internet, app closed). Returns gems granted. */
  async resume(): Promise<number> {
    if (!this.store) return 0;
    let n = 0;
    try {
      for (const p of (await Native.pending()).items) {
        const r = await this.redeem(p);
        if (r.ok) n += r.granted;
      }
    } catch {
      /* try again next launch */
    }
    return n;
  }

  private async redeem(p: Purchase): Promise<BuyResult> {
    try {
      const granted = await this.http!.iap(this.store, p);
      await Native.consume({ token: p.token }).catch(() => {});
      return { ok: true, granted };
    } catch (e) {
      // Not consumed: the purchase stays pending and is re-sent on the next launch.
      return { ok: false, code: (e as Error).message || 'network' };
    }
  }
}
