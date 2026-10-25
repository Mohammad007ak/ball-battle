import type { Balance } from '@chakachak/content';
import { useAbility } from './abilities';
import type { Ctx } from './ctx';
import { bounds, cls, fighter, rand } from './ctx';
import { nudge } from './fighter';
import type { Fighter } from './types';
import { hypot } from './dmath';

/**
 * Bot skill -1..1 for a player's trophy count (piecewise linear over `rules.bot.skillCurve`).
 * Below 0 is "ease" for new players: the bot boosts less often, fires its ability later and aims
 * worse, so a beginner wins most early games. At 0 and above nothing changes.
 */
export function botSkillFor(B: Balance, trophies: number): number {
  const pts = B.engine.rules.bot.skillCurve as number[][];
  if (trophies <= pts[0]![0]!) return pts[0]![1]!;
  for (let i = 1; i < pts.length; i++) {
    const [t1, s1] = pts[i]!,
      [t0, s0] = pts[i - 1]!;
    if (trophies <= t1!) return s0! + ((s1! - s0!) * (trophies - t0!)) / (t1! - t0!);
  }
  return pts[pts.length - 1]![1]!;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Whether a skilled bot should fire its ability now; unskilled bots fire whenever ready. */
function abilityTiming(c: Ctx, B: Fighter, A: Fighter, sk: number): boolean {
  const S = c.R.bot.smart,
    key = B.cls + B.ab,
    AP = (c.B.engine.abilities as Record<string, { range?: number }>)[key],
    dist = hypot(A.x - B.x, A.y - B.y);
  // Hold for at most `rangeHold` seconds; a skill-0 bot never holds.
  if (B.botHold > S.rangeHold * sk) return true;
  if (AP?.range !== undefined) return dist < AP.range + A.r;
  if ((S.defensive as string[]).includes(key))
    return (
      dist < S.threatDist + A.r + B.r ||
      B.hp / B.maxHp < S.lowHp ||
      incoming(c, B, S.dodgeLook) !== null
    );
  return true;
}

/** First enemy projectile that will pass within `dodgeDist` of the bot in the next `look` seconds. */
function incoming(c: Ctx, B: Fighter, look: number) {
  const D = c.R.bot.smart.dodgeDist;
  for (const ar of c.s.arrows) {
    if (fighter(c, ar.owner).team === B.team) continue;
    const rx = B.x - ar.x,
      ry = B.y - ar.y,
      v2 = ar.vx * ar.vx + ar.vy * ar.vy || 1,
      t = (rx * ar.vx + ry * ar.vy) / v2;
    if (t < 0 || t > look) continue;
    if (hypot(ar.x + ar.vx * t - B.x, ar.y + ar.vy * t - B.y) < D + B.r) return ar;
  }
  return null;
}

/**
 * Built-in bot (prototype `botThink`), scaled by `s.botSkill`. At skill 0 it behaves exactly like
 * the prototype's first league; higher skill reacts faster, times range/defensive abilities, leads
 * its target, sidesteps projectiles and goes for heals when low.
 */
export function botThink(c: Ctx, B: Fighter, A: Fighter, dt: number) {
  const K = c.R.bot,
    S = K.smart,
    sk = Math.max(0, B.skill),
    ease = Math.max(0, -B.skill);
  if (B.abilityCd <= 0) {
    B.aiDelay -= dt;
    if (B.aiDelay <= 0) {
      if (sk <= 0 || abilityTiming(c, B, A, sk)) {
        useAbility(c, B);
        B.botHold = 0;
        const lo = lerp(K.abilityRedelay[0]!, S.abilityDelay[0]!, sk),
          span = lerp(K.abilityRedelay[1]!, S.abilityDelay[1]! - S.abilityDelay[0]!, sk);
        B.aiDelay = (lo + rand(c) * span) * (1 + ease * K.easeAbility);
      } else B.botHold += dt;
    }
  }
  B.botT -= dt;
  if (B.charges < 1) return;
  // Dodge: a skilled bot spends a charge to sidestep a projectile about to hit it.
  if (sk >= S.dodgeMin && B.invulnT <= 0) {
    const ar = incoming(c, B, S.dodgeLook * 0.6);
    if (ar && rand(c) < sk * dt * 8) {
      const side = ar.vx * (B.y - ar.y) - ar.vy * (B.x - ar.x) >= 0 ? 1 : -1,
        v = hypot(ar.vx, ar.vy) || 1;
      nudge(c, B, B.x - (ar.vy / v) * 100 * side, B.y + (ar.vx / v) * 100 * side);
      B.botT = Math.max(B.botT, K.boostMin);
      return;
    }
  }
  if (B.botT > 0) return;
  const C = cls(c, B),
    p = c.s.pups[0],
    low = B.hp / B.maxHp < S.lowHp,
    dist = hypot(A.x - B.x, A.y - B.y);
  // A skilled bot saves charges until a boost can land a hit (melee) or is needed to escape (ranged).
  if (sk > 0 && !p) {
    const range = C.melee ? S.meleeBoostRange : S.rangedBoostRange;
    if (dist > range + (1 - sk) * 400) return;
  }
  let tx: number, ty: number;
  if (p && (rand(c) < K.pickupChance || (sk > 0 && low && p.type === 'heal'))) {
    tx = p.x;
    ty = p.y;
  } else if (C.melee) {
    const lead = lerp(K.lead, S.leadMax, sk);
    tx = A.x + A.vx * lead;
    ty = A.y + A.vy * lead;
    // Only an eased bot draws extra randoms, so skill >= 0 keeps its exact random sequence.
    if (ease > 0) {
      tx += (rand(c) - 0.5) * ease * K.easeAim * 2;
      ty += (rand(c) - 0.5) * ease * K.easeAim * 2;
    }
  } else {
    const dx = B.x - A.x,
      dy = B.y - A.y,
      d = hypot(dx, dy) || 1,
      b = bounds(c),
      jit = lerp(K.kiteJitter, S.kiteJitterMin, sk);
    tx = Math.min(
      b.x1 - K.kiteMargin,
      Math.max(b.x0 + K.kiteMargin, B.x + (dx / d) * K.kite + (rand(c) - 0.5) * jit),
    );
    ty = Math.min(
      b.y1 - K.kiteMargin,
      Math.max(b.y0 + K.kiteMargin, B.y + (dy / d) * K.kite + (rand(c) - 0.5) * jit),
    );
  }
  nudge(c, B, tx, ty);
  B.botT =
    (Math.max(K.boostMin, K.boostBase - sk * K.boostPerSkill) + rand(c) * K.boostJitter) *
    (1 + ease * K.easeBoost);
}
