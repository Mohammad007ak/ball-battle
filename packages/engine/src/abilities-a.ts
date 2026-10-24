import { dropMine, explode, fire, hurt } from './combat';
import { TAU, burst, clamp, emit, ring } from './ctx';
import type { AbilityEnv } from './abilities';

/** Abilities of archer … ghost (prototype `useAbility`). Returns false if `key` is not handled here. */
export function abilitiesA(env: AbilityEnv, key: string): boolean {
  const { c, s, f, e, C, CP, m, A, a, dist, B, R, fan, cx, cy, dash, shove } = env;
  switch (key) {
    case 'archer0':
      fan(A.n, A.spread, {});
      break;
    case 'archer1':
      fire(c, f, a, { dmg: A.dmg, spd: A.spd, kind: 'heavy', knock: A.knock, rad: A.rad });
      break;
    case 'archer2':
      f.rapidT = A.t;
      f.arrowT = Math.min(f.arrowT, A.first);
      break;
    case 'rage0':
      f.buffT = A.t;
      burst(c, f.x, f.y, '#ff8a5c', 22);
      break;
    case 'rage1':
      dash(A.boost);
      f.nextBonus = A.bonus * m;
      burst(c, f.x, f.y, '#ff8a5c', 14);
      break;
    case 'rage2': {
      const d = f.rageBonus * A.mul + A.base * m;
      f.rageBonus *= A.keep;
      emit(c, { e: 'beam', a: f.id, b: e.id, life: 0.35, col: '255,138,92' });
      hurt(c, e, d, f, '#ffb38a');
      ring(c, e.x, e.y, e.r, '#ff8a5c', 0.5, 6, 60);
      burst(c, e.x, e.y, '#ff8a5c', 26, 1.2);
      break;
    }
    case 'vampire0': {
      const d = CP.suck * m;
      emit(c, { e: 'beam', a: f.id, b: e.id, life: 0.45 });
      hurt(c, e, d, f, '#d06bff');
      f.hp = Math.min(f.maxHp, f.hp + d * A.heal);
      break;
    }
    case 'vampire1':
      fan(
        A.n,
        A.spread,
        { dmg: A.dmg, spd: A.spd, life: A.life, kind: 'bat', home: A.home, rad: A.rad },
        2,
        a + Math.PI,
      );
      break;
    case 'vampire2':
      f.thirstT = A.t;
      break;
    case 'tank0':
      f.invulnT = A.t;
      break;
    case 'tank1':
      shove(A, '#cbd5e1', 140);
      break;
    case 'tank2':
      f.hp = Math.min(f.maxHp, f.hp + f.maxHp * A.heal);
      f.dmgRedT = A.t;
      burst(c, f.x, f.y, '#86efac', 22);
      break;
    case 'poison0':
      e.poison = Math.min(R.poisonMax, e.poison + A.stacks);
      burst(c, e.x, e.y, '#7ee36b', 26);
      ring(c, e.x, e.y, e.r, '#7ee36b', 0.5, 5);
      break;
    case 'poison1':
      s.zones.push({
        x: e.x,
        y: e.y,
        r: A.r,
        life: A.life,
        max: A.life,
        owner: f.id,
        dps: A.dps,
        slow: true,
        kind: 'acid',
      });
      ring(c, e.x, e.y, 10, '#7ee36b', 0.5, 4, 40);
      break;
    case 'poison2': {
      const d = (e.poison * A.perStack + A.base) * m;
      e.poison = Math.floor(e.poison / 2);
      hurt(c, e, d, f, '#9cf28a');
      burst(c, e.x, e.y, '#7ee36b', 30, 1.3);
      ring(c, e.x, e.y, e.r, '#7ee36b', 0.5, 6, 70);
      break;
    }
    case 'frost0':
      e.freezeT = A.freeze;
      hurt(c, e, A.dmg * m, f, '#e0fbff');
      e.slowT = Math.max(e.slowT, A.slow);
      ring(c, e.x, e.y, e.r, '#bff3ff', 0.6, 6);
      burst(c, e.x, e.y, '#e0fbff', 24);
      break;
    case 'frost1':
      f.aura = { t: A.t, r: A.r, dps: A.dps, slow: true, kind: 'snow' };
      break;
    case 'frost2':
      fan(A.n, A.spread, { dmg: A.dmg, spd: A.spd, kind: 'ice', slow: A.slow, rad: A.rad });
      break;
    case 'bomber0':
      explode(c, f, f.x, f.y, CP.boom * m, A.R);
      for (let i = 0; i < A.mines; i++) {
        const aa = a + Math.PI + (i - 1) * A.mineSpread;
        dropMine(
          c,
          f,
          cx(f.x + Math.cos(aa) * A.mineDist, A.edge),
          cy(f.y + Math.sin(aa) * A.mineDist, A.edge),
        );
      }
      break;
    case 'bomber1':
      for (let i = 0; i < A.mines; i++) {
        const aa = (i / A.mines) * TAU + Math.PI / 4;
        dropMine(
          c,
          f,
          cx(f.x + Math.cos(aa) * A.mineDist, A.edge),
          cy(f.y + Math.sin(aa) * A.mineDist, A.edge),
        );
      }
      break;
    case 'bomber2':
      fire(c, f, a, {
        dmg: 0,
        spd: clamp(dist * A.spdMul, A.spdMin, A.spdMax),
        life: A.life,
        kind: 'grenade',
        explode: { dmg: A.dmg, R: A.R },
        rad: A.rad,
      });
      break;
    case 'lightning0':
      f.zapQ = A.n;
      f.zapQT = 0;
      break;
    case 'lightning1':
      f.aura = { t: A.t, r: A.r, dps: A.dps, kind: 'elec' };
      break;
    case 'lightning2':
      f.zapFastT = A.t;
      f.zapT = Math.min(f.zapT, A.first);
      break;
    case 'mirror0':
      f.reflectT = A.t;
      break;
    case 'mirror1':
      fan(A.n, A.spread, { dmg: A.dmg, spd: A.spd, life: A.life, kind: 'shard', rad: A.rad });
      break;
    case 'mirror2': {
      ring(c, f.x, f.y, f.r, '#f9a8d4', 0.45, 5);
      ring(c, e.x, e.y, e.r, '#f9a8d4', 0.45, 5);
      const x = f.x,
        y = f.y;
      f.x = e.x;
      f.y = e.y;
      e.x = x;
      e.y = y;
      emit(c, { e: 'swap', a: f.id, b: e.id });
      e.slowT = Math.max(e.slowT, A.slow);
      hurt(c, e, A.dmg * m, f, '#f9a8d4');
      break;
    }
    case 'ghost0':
      f.invisT = A.t;
      f.ghostNext = true;
      break;
    case 'ghost1': {
      const ev = Math.hypot(e.vx, e.vy) || 1,
        ux = e.vx / ev,
        uy = e.vy / ev;
      ring(c, f.x, f.y, f.r, '#e9e7ff', 0.4, 4);
      f.x = clamp(e.x - ux * (e.r + f.r + A.gap), B.x0 + f.r, B.x1 - f.r);
      f.y = clamp(e.y - uy * (e.r + f.r + A.gap), B.y0 + f.r, B.y1 - f.r);
      emit(c, { e: 'teleport', fid: f.id });
      f.vx = ux * C.speed;
      f.vy = uy * C.speed;
      f.ghostNext = true;
      ring(c, f.x, f.y, f.r, '#e9e7ff', 0.5, 5);
      burst(c, f.x, f.y, '#e9e7ff', 16);
      break;
    }
    case 'ghost2':
      shove(A, '#e9e7ff', 150, 5, 0.55);
      break;
    default:
      return false;
  }
  return true;
}
