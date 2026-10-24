import type { PickupType } from './types';
import { contact, explode, hurt, knockDir } from './combat';
import type { Ctx } from './ctx';
import {
  banner,
  bounds,
  burst,
  clamp,
  cls,
  fighter,
  foesOf,
  other,
  rand,
  ring,
  sfx,
  shake,
  wrapAngle,
} from './ctx';
import { arrowMap, clearOfMap } from './maps';

const ZCOL = {
  fire: '#fb7185',
  acid: '#9cf28a',
  tornado: '#5eead4',
  rainbow: '#f5d0fe',
  dust: '#e9d5ff',
};
const PUP_COL: Record<PickupType, string> = {
  heal: '#4ade80',
  power: '#ffc53d',
  charge: '#6ee7f9',
};

/** Ball-vs-ball collisions, projectiles, mines, star drops and zones. */
export function worldTick(c: Ctx, dt: number) {
  const { s, R } = c,
    B0 = bounds(c);
  const live = s.f.filter((f) => !f.out);
  for (let i = 0; i < live.length; i++)
    for (let j = i + 1; j < live.length; j++) {
      const A = live[i]!,
        Bf = live[j]!;
      const dx = Bf.x - A.x,
        dy = Bf.y - A.y,
        d = Math.hypot(dx, dy),
        mn = A.r + Bf.r;
      if (!(d < mn && d > 0)) continue;
      const nx = dx / d,
        ny = dy / d,
        ov = (mn - d) / 2;
      A.x -= nx * ov;
      A.y -= ny * ov;
      Bf.x += nx * ov;
      Bf.y += ny * ov; // prettier-ignore
      const rv = (Bf.vx - A.vx) * nx + (Bf.vy - A.vy) * ny;
      if (rv < 0) { A.vx += rv * nx; A.vy += rv * ny; Bf.vx -= rv * nx; Bf.vy -= rv * ny; } // prettier-ignore
      if (A.team !== Bf.team && A.hitCd <= 0 && Bf.hitCd <= 0) {
        const strong = A.boostT > 0 || Bf.boostT > 0;
        contact(c, A, Bf);
        contact(c, Bf, A);
        A.hitCd = Bf.hitCd = R.hitCd;
        sfx(c, strong ? 'hitBig' : 'hit');
        const mx = (A.x + Bf.x) / 2,
          my = (A.y + Bf.y) / 2;
        burst(c, mx, my, '#ffffff', strong ? 18 : 10, strong ? 1.4 : 1);
        ring(c, mx, my, 6, '#ffffff', 0.3, strong ? 5 : 3);
        shake(c, strong ? 10 : 5);
      }
    }

  for (const ar of s.arrows) {
    const owner = fighter(c, ar.owner),
      e = other(c, owner);
    if (ar.home && e.invisT <= 0 && e.hp > 0) {
      const cur = Math.atan2(ar.vy, ar.vx),
        df = wrapAngle(Math.atan2(e.y - ar.y, e.x - ar.x) - cur),
        sp = Math.hypot(ar.vx, ar.vy),
        na = cur + clamp(df, -ar.home * dt, ar.home * dt);
      ar.vx = Math.cos(na) * sp;
      ar.vy = Math.sin(na) * sp;
    }
    ar.x += ar.vx * dt;
    ar.y += ar.vy * dt;
    ar.life -= dt;
    arrowMap(c, ar);
    if (ar.life <= 0) continue;
    const hitE = foesOf(c, owner).find(
      (q) => q.invisT <= 0 && Math.hypot(ar.x - q.x, ar.y - q.y) < q.r + ar.rad,
    );
    if (hitE) {
      ar.life = 0;
      if (ar.explode) {
        ar.done = true;
        explode(c, owner, ar.x, ar.y, ar.explode.dmg * owner.m, ar.explode.R);
      } else {
        hurt(c, hitE, ar.dmg, owner);
        if (ar.slow) hitE.slowT = Math.max(hitE.slowT, ar.slow);
        if (ar.bleed) {
          hitE.dotT = ar.bleed.t;
          hitE.dotDps = ar.bleed.dps * owner.m;
          hitE.dotSrc = owner.id;
        }
        if (ar.knock) knockDir(c, hitE, ar.vx, ar.vy, ar.knock);
        burst(c, ar.x, ar.y, cls(c, owner).c1, 6);
      }
      continue;
    }
    const o = R.arrowOffscreen;
    if (ar.x < B0.x0 - o || ar.x > B0.x1 + o || ar.y < B0.y0 - o || ar.y > B0.y1 + o) {
      if (!ar.explode) burst(c, ar.x, ar.y, '#8899cc', 3, 0.5);
      ar.life = 0;
    }
  }
  for (const ar of s.arrows)
    if (ar.life <= 0 && ar.explode && !ar.done) {
      ar.done = true;
      const owner = fighter(c, ar.owner);
      explode(
        c,
        owner,
        clamp(ar.x, B0.x0, B0.x1),
        clamp(ar.y, B0.y0, B0.y1),
        ar.explode.dmg * owner.m,
        ar.explode.R,
      );
    }
  s.arrows = s.arrows.filter((a) => a.life > 0);

  for (const mn of s.mines) {
    mn.t += dt;
    mn.arm -= dt;
    if (mn.x < B0.x0 || mn.x > B0.x1 || mn.y < B0.y0 || mn.y > B0.y1) {
      mn.dead = true;
      continue;
    }
    const owner = fighter(c, mn.owner),
      trig = mn.kind ? R.flowerTrigger : R.mineTrigger;
    const e = foesOf(c, owner).find(
      (q) => q.invisT <= 0 && Math.hypot(mn.x - q.x, mn.y - q.y) < q.r + trig,
    );
    if (mn.arm <= 0 && e) {
      explode(
        c,
        owner,
        mn.x,
        mn.y,
        (mn.dmg || c.B.game.CLASSES.bomber.p.mine) * owner.m,
        mn.R || R.mineRadius,
        mn.kind ? '#f9a8d4' : undefined,
      );
      mn.dead = true;
    }
  }
  s.mines = s.mines.filter((m) => !m.dead);

  for (const d of s.drops) {
    d.t -= dt;
    if (d.t <= 0) {
      d.dead = true;
      explode(c, fighter(c, d.owner), d.x, d.y, d.dmg, d.R, '#f5d0fe');
      burst(c, d.x, d.y, '#fde68a', 14, 1);
    }
  }
  s.drops = s.drops.filter((d) => !d.dead);

  for (const z of s.zones) {
    z.life -= dt;
    if (z.home) {
      const e = other(c, fighter(c, z.owner)),
        dd = Math.hypot(e.x - z.x, e.y - z.y) || 1;
      z.x += ((e.x - z.x) / dd) * z.home * dt;
      z.y += ((e.y - z.y) / dd) * z.home * dt;
    }
  }
  s.zones = s.zones.filter((z) => z.life > 0);
  for (const f of s.f) {
    if (f.out) continue;
    let best = null,
      bv = 0;
    for (const z of s.zones) {
      const zo = fighter(c, z.owner);
      if (zo.team === f.team) continue;
      if (Math.hypot(z.x - f.x, z.y - f.y) < f.r + z.r * R.zoneHitFactor) {
        const v = z.dps * zo.m;
        if (v > bv) {
          bv = v;
          best = z;
        }
      }
    }
    if (best) {
      f.burnAcc += bv * dt;
      if (best.slow) f.slowT = Math.max(f.slowT, R.zoneStatusT);
      if (best.daze) f.dazeT = Math.max(f.dazeT, R.zoneStatusT);
      if (f.burnAcc >= R.tickAcc) {
        hurt(c, f, f.burnAcc, fighter(c, best.owner), ZCOL[best.kind]);
        f.burnAcc = 0;
      }
    }
  }
}

export function spawnPup(c: Ctx) {
  const { s, R } = c,
    K = R.pickups,
    types = K.types as PickupType[],
    type = types[Math.floor(rand(c) * types.length)]!,
    B = bounds(c);
  let found = false,
    x = 0,
    y = 0,
    bx = B.x0 + K.spawnFallback,
    by = B.y0 + K.spawnFallback;
  for (let i = 0; i < K.spawnTries; i++) {
    const tx = B.x0 + K.spawnMargin + rand(c) * (B.x1 - B.x0 - 2 * K.spawnMargin),
      ty = B.y0 + K.spawnMargin + rand(c) * (B.y1 - B.y0 - 2 * K.spawnMargin);
    if (!clearOfMap(c, tx, ty)) continue;
    bx = tx;
    by = ty;
    if (s.f.every((f) => Math.hypot(f.x - tx, f.y - ty) > K.playerClear)) {
      x = tx;
      y = ty;
      found = true;
      break;
    }
  }
  if (!found) {
    x = bx;
    y = by;
  }
  s.pups.push({ x, y, type, t: 0 });
  ring(c, x, y, 6, PUP_COL[type], 0.6, 4);
  banner(c, 'pupSpawn', PUP_COL[type], { type });
  const Q = R.bot;
  for (const b of s.f)
    if (b.bot)
      b.botT = Math.min(
        b.botT,
        Q.pupReact +
          Math.max(Q.pupReactMin, Q.pupReactBase - s.botLevel * Q.pupReactPerLeague) * rand(c),
      );
}
