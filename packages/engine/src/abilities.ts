import { abilitiesA } from './abilities-a';
import { abilitiesB } from './abilities-b';
import { fire, hurt, knock } from './combat';
import type { Ctx } from './ctx';
import { bounds, clamp, cls, emit, other, ring, sfx, shake } from './ctx';
import type { Fighter } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any -- per-ability params are heterogeneous JSON */
export type P = Record<string, any>;

export interface AbilityEnv {
  c: Ctx;
  s: Ctx['s'];
  f: Fighter;
  e: Fighter;
  C: ReturnType<typeof cls>;
  CP: P;
  m: number;
  A: P;
  a: number;
  dist: number;
  B: ReturnType<typeof bounds>;
  R: Ctx['R'];
  fan: (n: number, spread: number, o: P, center?: number, base?: number) => void;
  near: (range: number) => boolean;
  cx: (x: number, edge: number) => number;
  cy: (y: number, edge: number) => number;
  dash: (boost: number) => void;
  shove: (A: P, col: string, grow: number, w?: number, max?: number) => void;
}

/** Trigger `f`'s selected ability (prototype `useAbility`). Returns false if not ready. */
export function useAbility(c: Ctx, f: Fighter): boolean {
  const { s } = c;
  if (s.phase !== 'fight' || f.abilityCd > 0 || f.hp <= 0 || f.out) return false;
  const e = other(c, f),
    C = cls(c, f),
    CP = C.p as P,
    m = f.m,
    key = f.cls + f.ab,
    A = (c.B.engine.abilities as Record<string, P>)[key]!,
    R = c.R;
  f.abilityCd = f.abilityMax;
  const a = Math.atan2(e.y - f.y, e.x - f.x),
    dist = Math.hypot(e.x - f.x, e.y - f.y),
    B = bounds(c);
  const fan = (n: number, spread: number, o: P, center = (n - 1) / 2, base = a) => {
    for (let i = 0; i < n; i++) fire(c, f, base + (i - center) * spread, o);
  };
  const near = (range: number) => dist < range + e.r;
  const cx = (x: number, edge: number) => clamp(x, B.x0 + edge, B.x1 - edge);
  const cy = (y: number, edge: number) => clamp(y, B.y0 + edge, B.y1 - edge);
  const dash = (boost: number) => {
    f.vx = Math.cos(a) * C.speed;
    f.vy = Math.sin(a) * C.speed;
    f.boostT = c.B.game.BOOST_TIME * boost;
  };
  const shove = (A: P, col: string, grow: number, w = 6, max = 0.45) => {
    ring(c, f.x, f.y, f.r, col, max, w, grow);
    if (near(A.range)) {
      hurt(c, e, A.dmg * m, f);
      knock(c, f, e, A.knock);
      if (A.slow) e.slowT = Math.max(e.slowT, A.slow);
    }
  };

  const env: AbilityEnv = {
    c,
    s,
    f,
    e,
    C,
    CP,
    m,
    A,
    a,
    dist,
    B,
    R,
    fan,
    near,
    cx,
    cy,
    dash,
    shove,
  };
  if (!abilitiesA(env, key)) abilitiesB(env, key);
  ring(c, f.x, f.y, f.r, C.c1, 0.5, 5);
  emit(c, {
    e: 'text',
    x: f.x,
    y: f.y - f.r - 18,
    key: 'ability',
    c: '#ffffff',
    big: true,
    fid: f.id,
  });
  emit(c, { e: 'ability', fid: f.id });
  sfx(c, 'ability');
  shake(c, 7);
  return true;
}
