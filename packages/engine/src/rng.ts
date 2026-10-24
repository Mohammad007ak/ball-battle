/** Seeded PRNG (mulberry32). Its whole state is one uint32 so it can live inside match state. */
export interface Rng {
  s: number;
}

export const createRng = (seed: number): Rng => ({ s: seed >>> 0 });

/** Returns a float in [0, 1) and advances the state. */
export function next(r: Rng): number {
  r.s = (r.s + 0x6d2b79f5) >>> 0;
  let t = r.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
