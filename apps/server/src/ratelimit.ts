/** Fixed-window counters in memory (single server process). */
export class RateLimiter {
  private hits = new Map<string, { n: number; until: number }>();
  constructor(private now: () => number = Date.now) {}

  /** True if `key` may act now: at most `max` times per `windowMs`. */
  take(key: string, max: number, windowMs: number): boolean {
    const t = this.now(),
      h = this.hits.get(key);
    if (!h || h.until <= t) {
      this.hits.set(key, { n: 1, until: t + windowMs });
      if (this.hits.size > 50_000) this.sweep(t);
      return true;
    }
    if (h.n >= max) return false;
    h.n++;
    return true;
  }
  private sweep(t: number) {
    for (const [k, h] of this.hits) if (h.until <= t) this.hits.delete(k);
  }
}
