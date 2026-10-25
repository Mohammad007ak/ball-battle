import type { Balance, ClassDef, EngineData } from '@chakachak/content';
import type { GameEvent } from './events';
import { next } from './rng';
import type { Fighter, RoundState } from './types';
import { hypot } from './dmath';

/** Per-step context: state plus read-only balance and the event sink. */
export interface Ctx {
  s: RoundState;
  B: Balance;
  R: EngineData['rules'];
  ev: GameEvent[];
}

export const TAU = Math.PI * 2;
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const rand = (c: Ctx) => next(c.s.rng);

export function wrapAngle(d: number): number {
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  return d;
}

export const cls = (c: Ctx, f: Fighter): ClassDef => c.B.game.CLASSES[f.cls];
export const fighter = (c: Ctx, id: number): Fighter => c.s.f[id]!;

/** Nearest living enemy, or the nearest enemy at all if none is alive (prototype `other`). */
export function other(c: Ctx, f: Fighter): Fighter {
  let best: Fighter | null = null;
  let bd = 1e9;
  for (const e of c.s.f) {
    if (e.team === f.team) continue;
    const d = (e.hp > 0 && !e.out ? 0 : 1e6) + hypot(e.x - f.x, e.y - f.y);
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  return best!;
}

export const foesOf = (c: Ctx, f: Fighter) =>
  c.s.f.filter((e) => e.team !== f.team && !e.out && e.hp > 0);

export const bounds = (c: Ctx) => ({
  x0: c.s.ins,
  y0: c.s.ins,
  x1: c.s.W - c.s.ins,
  y1: c.s.H - c.s.ins,
});

export type Bounds = ReturnType<typeof bounds>;

export function emit(c: Ctx, e: GameEvent) {
  if (c.s.fx) c.ev.push(e);
}
export const ring = (
  c: Ctx,
  x: number,
  y: number,
  r: number,
  col: string,
  max = 0.4,
  w = 3,
  grow?: number,
) =>
  emit(
    c,
    grow === undefined
      ? { e: 'ring', x, y, r, c: col, max, w }
      : { e: 'ring', x, y, r, c: col, max, w, grow },
  );
export const burst = (c: Ctx, x: number, y: number, col: string, n: number, spd?: number) =>
  emit(
    c,
    spd === undefined ? { e: 'burst', x, y, c: col, n } : { e: 'burst', x, y, c: col, n, spd },
  );
export const shake = (c: Ctx, v: number) => emit(c, { e: 'shake', v });
export const sfx = (c: Ctx, n: string) => emit(c, { e: 'sfx', n });
export const banner = (
  c: Ctx,
  key: 'start' | 'shrink' | 'phoenix' | 'pickup' | 'pupSpawn',
  col: string,
  extra: { fid?: number; type?: string } = {},
) => emit(c, { e: 'banner', key, c: col, ...extra });
