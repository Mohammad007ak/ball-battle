import type { PickupType } from './types';
import { dropMine, fire, hurt, spines, zap } from './combat';
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
  wrapAngle,
} from './ctx';
import { mapPhysics } from './maps';
import type { Fighter } from './types';
import { atan2, cos, hypot, sin } from './dmath';

const PUP_COL: Record<PickupType, string> = {
  heal: '#4ade80',
  power: '#ffc53d',
  charge: '#6ee7f9',
};

/** Timers, movement, walls, map, class passives, poison, aura and pickups for one fighter. */
export function fighterTick(c: Ctx, f: Fighter, dt: number) {
  const { s, R, B } = c,
    G = B.game,
    P = B.engine.passives,
    C = cls(c, f),
    B0 = bounds(c);
  f.rootT -= dt;
  f.dazeT -= dt;
  f.charmT -= dt;
  f.bubbleT -= dt;
  f.cocoonT -= dt;
  f.lifeT -= dt;
  f.warT -= dt;
  f.healHitT -= dt;
  f.rainbowT -= dt; // prettier-ignore
  f.slowT -= dt;
  f.freezeT -= dt;
  f.reflectT -= dt;
  f.invisT -= dt;
  f.rapidT -= dt;
  f.thirstT -= dt;
  f.zapFastT -= dt;
  f.spikyT -= dt;
  f.stoneT -= dt;
  f.dmgRedT -= dt;
  f.kbT -= dt; // prettier-ignore
  f.hitCd -= dt;
  f.buffT -= dt;
  f.invulnT -= dt;
  f.boostT -= dt;
  f.powT -= dt; // prettier-ignore
  f.abilityCd = Math.max(0, f.abilityCd - dt);
  if (f.charges < G.NUDGE_MAX) {
    f.chargeT += dt;
    if (f.chargeT >= G.NUDGE_RECHARGE) {
      f.charges++;
      f.chargeT = 0;
    }
  } else f.chargeT = 0;

  // Movement: balls always travel at their (modified) class speed with a slight wander.
  const bt = Math.max(f.boostT, f.kbT),
    boost = bt > 0 ? G.BOOST_MUL * Math.min(R.boostSpeedCap, bt / G.BOOST_TIME) : 0;
  let buffMul = 1;
  if (f.buffT > 0) buffMul = (R.buffSpeed as Record<string, number>)[f.cls] ?? 1;
  if (f.thirstT > 0) buffMul *= R.thirstSpeed;
  const want =
    C.speed * buffMul * (1 + boost) *
    (f.slowT > 0 ? R.slowMul : 1) * (f.freezeT > 0 ? R.freezeMul : 1) *
    (f.rootT > 0 || f.cocoonT > 0 ? R.rootMul : 1) * (f.dazeT > 0 ? R.dazeMul : 1); // prettier-ignore
  let ang = atan2(f.vy, f.vx) + (bt > 0 ? 0 : (rand(c) - 0.5) * R.wander);
  if (f.charmT > 0 && f.charmBy >= 0 && bt <= 0) {
    const by = fighter(c, f.charmBy),
      df = wrapAngle(atan2(by.y - f.y, by.x - f.x) - ang);
    ang += clamp(df, -R.charmTurn * dt, R.charmTurn * dt);
  }
  f.vx = cos(ang) * want;
  f.vy = sin(ang) * want;
  f.x += f.vx * dt;
  f.y += f.vy * dt;
  let wall: string | null = null;
  if (f.x < B0.x0 + f.r) { f.x = B0.x0 + f.r; f.vx = Math.abs(f.vx); wall = 'l'; } // prettier-ignore
  if (f.x > B0.x1 - f.r) { f.x = B0.x1 - f.r; f.vx = -Math.abs(f.vx); wall = 'r'; } // prettier-ignore
  if (f.y < B0.y0 + f.r) { f.y = B0.y0 + f.r; f.vy = Math.abs(f.vy); wall = 't'; } // prettier-ignore
  if (f.y > B0.y1 - f.r) { f.y = B0.y1 - f.r; f.vy = -Math.abs(f.vy); wall = 'b'; } // prettier-ignore
  if (wall && f.boostT > 0) burst(c, f.x, f.y, C.c1, 4, 0.6);
  mapPhysics(c, f, B0, wall, dt);

  // Class passives.
  const CP = C.p as Record<string, number>;
  const aim = () => {
    const e = other(c, f);
    return atan2(e.y - f.y, e.x - f.x);
  };
  if (f.cls === 'archer') {
    f.arrowT -= dt;
    if (f.arrowT <= 0) {
      fire(c, f, aim());
      f.arrowT = CP.every! / (f.rapidT > 0 ? P.archer.rapidMul : 1);
    }
  }
  if (f.cls === 'lightning') {
    f.zapT -= dt;
    if (f.zapT <= 0) {
      zap(c, f, CP.zap!);
      f.zapT = f.zapFastT > 0 ? P.lightning.fastEvery : CP.every!;
    }
    if (f.zapQ > 0) {
      f.zapQT -= dt;
      if (f.zapQT <= 0) {
        zap(c, f, CP.big!);
        f.zapQ--;
        f.zapQT = P.lightning.burstGap;
      }
    }
  }
  if (f.cls === 'bomber') {
    f.mineT -= dt;
    if (f.mineT <= 0) {
      dropMine(c, f, f.x, f.y);
      f.mineT = CP.every!;
    }
  }
  if (f.cls === 'dragon') {
    f.fireT -= dt;
    if (f.fireT <= 0) {
      const T = f.buffT > 0 ? P.dragon.big : P.dragon.small;
      s.zones.push({
        x: f.x,
        y: f.y,
        r: T.r,
        life: T.life,
        max: T.life,
        owner: f.id,
        dps: CP.burn!,
        kind: 'fire',
      });
      f.fireT = T.every;
    }
  }
  if (f.cls === 'porcupine') {
    f.spineT -= dt;
    if (f.spineT <= 0) {
      spines(c, f, CP.n!);
      f.spineT = CP.every!;
    }
  }
  if (f.cls === 'fairy' && f.hp > 0) f.hp = Math.min(f.maxHp, f.hp + CP.regen! * f.m * dt);
  if (f.cls === 'mermaid') {
    f.shotT -= dt;
    if (f.shotT <= 0) {
      const M = P.mermaid;
      fire(c, f, aim(), {
        dmg: CP.bub!,
        spd: M.spd,
        life: M.life,
        kind: 'bubble',
        slow: M.slow,
        rad: M.rad,
      });
      f.shotT = CP.every!;
    }
  }
  if (f.cls === 'butterfly') {
    f.shotT -= dt;
    if (f.shotT <= 0) {
      const Q = P.butterfly;
      fire(c, f, aim() + (rand(c) - 0.5) * Q.spread, {
        dmg: CP.bf!,
        spd: Q.spd,
        life: Q.life,
        kind: 'bfly',
        home: Q.home,
        rad: Q.rad,
      });
      f.shotT = CP.every!;
    }
  }
  if (f.rainbowT > 0) {
    f.rbT -= dt;
    if (f.rbT <= 0) {
      const T = P.unicorn.rainbow;
      s.zones.push({
        x: f.x,
        y: f.y,
        r: T.r,
        life: T.life,
        max: T.life,
        owner: f.id,
        dps: T.dps,
        kind: 'rainbow',
      });
      f.rbT = T.every;
    }
  }
  if (f.dotT > 0) {
    f.dotT -= dt;
    f.dotAcc += f.dotDps * dt;
    if (f.dotAcc >= R.tickAcc) {
      hurt(c, f, f.dotAcc, f.dotSrc >= 0 ? fighter(c, f.dotSrc) : null, '#fda4af');
      f.dotAcc = 0;
    }
  }
  if (f.poison > 0) {
    f.poisonAcc += f.poison * G.CLASSES.poison.p.tick * dt;
    if (f.poisonAcc >= R.tickAcc) {
      hurt(c, f, f.poisonAcc, null, '#7ee36b');
      f.poisonAcc = 0;
    }
    f.poisonDecay += dt;
    if (f.poisonDecay >= R.poisonDecay) {
      f.poison--;
      f.poisonDecay = 0;
    }
  }
  if (f.aura && f.aura.t > 0) {
    const au = f.aura;
    au.t -= dt;
    for (const e of foesOf(c, f))
      if (hypot(e.x - f.x, e.y - f.y) < au.r + e.r) {
        e.auraAcc += au.dps * f.m * dt;
        if (au.slow) e.slowT = Math.max(e.slowT, R.auraSlowT);
        if (e.auraAcc >= R.tickAcc) {
          hurt(c, e, e.auraAcc, f);
          e.auraAcc = 0;
        }
      }
    if (au.heal && f.hp > 0) f.hp = Math.min(f.maxHp, f.hp + au.heal * f.m * dt);
  }
  const K = R.pickups;
  for (const p of s.pups) {
    if (hypot(p.x - f.x, p.y - f.y) < f.r + K.radius && !p.taken) {
      p.taken = true;
      if (p.type === 'heal') f.hp = Math.min(f.maxHp, f.hp + f.maxHp * K.heal);
      if (p.type === 'power') f.powT = K.powerT;
      if (p.type === 'charge') {
        f.charges = G.NUDGE_MAX;
        f.chargeT = 0;
        f.abilityCd = Math.max(0, f.abilityCd - K.abilityCdCut);
      }
      const col = PUP_COL[p.type];
      burst(c, p.x, p.y, col, 26);
      ring(c, p.x, p.y, 10, col, 0.5, 5);
      banner(c, 'pickup', col, { fid: f.id, type: p.type });
      sfx(c, 'pickup');
    }
  }
}
