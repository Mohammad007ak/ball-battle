import { nudge } from './fighter';
import type { Ctx } from './ctx';
import { bounds, cls, rand } from './ctx';
import { useAbility } from './abilities';
import type { Fighter } from './types';

/** Built-in bot (prototype `botThink`). `A` is its current target. */
export function botThink(c: Ctx, B: Fighter, A: Fighter, dt: number) {
  const K = c.R.bot,
    li = c.s.botLevel;
  if (B.abilityCd <= 0) {
    B.aiDelay -= dt;
    if (B.aiDelay <= 0) {
      useAbility(c, B);
      B.aiDelay = K.abilityRedelay[0]! + rand(c) * K.abilityRedelay[1]!;
    }
  }
  B.botT -= dt;
  if (B.botT > 0 || B.charges < 1) return;
  const C = cls(c, B),
    p = c.s.pups[0];
  let tx: number, ty: number;
  if (p && rand(c) < K.pickupChance) {
    tx = p.x;
    ty = p.y;
  } else if (C.melee) {
    tx = A.x + A.vx * K.lead;
    ty = A.y + A.vy * K.lead;
  } else {
    const dx = B.x - A.x,
      dy = B.y - A.y,
      d = Math.hypot(dx, dy) || 1,
      b = bounds(c);
    tx = Math.min(
      b.x1 - K.kiteMargin,
      Math.max(b.x0 + K.kiteMargin, B.x + (dx / d) * K.kite + (rand(c) - 0.5) * K.kiteJitter),
    );
    ty = Math.min(
      b.y1 - K.kiteMargin,
      Math.max(b.y0 + K.kiteMargin, B.y + (dy / d) * K.kite + (rand(c) - 0.5) * K.kiteJitter),
    );
  }
  nudge(c, B, tx, ty);
  B.botT = Math.max(K.boostMin, K.boostBase - li * K.boostPerLeague) + rand(c) * K.boostJitter;
}
