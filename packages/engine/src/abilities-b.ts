import { dropMine, fire, hurt, knock, pull, spines } from './combat';
import { TAU, burst, emit, rand, ring, shake } from './ctx';
import type { AbilityEnv } from './abilities';
import { cos, sin } from './dmath';

/** Abilities of dragon … butterfly (prototype `useAbility`). Returns false if `key` is not handled here. */
export function abilitiesB(env: AbilityEnv, key: string): boolean {
  const { c, s, f, e, CP, m, A, a, dist, fan, near, cx, cy, dash } = env;
  switch (key) {
    case 'dragon0':
      for (let i = 1; i <= A.n; i++)
        s.zones.push({
          x: f.x + cos(a) * i * A.step,
          y: f.y + sin(a) * i * A.step,
          life: A.life,
          max: A.life,
          owner: f.id,
          r: A.r,
          dps: CP.burn,
          kind: 'fire',
        });
      break;
    case 'dragon1':
      for (let i = 0; i < A.n; i++) {
        const aa = (i / A.n) * TAU;
        s.zones.push({
          x: f.x + cos(aa) * A.dist,
          y: f.y + sin(aa) * A.dist,
          r: A.r,
          life: A.life,
          max: A.life,
          owner: f.id,
          dps: CP.burn,
          kind: 'fire',
        });
      }
      break;
    case 'dragon2':
      f.buffT = A.t;
      break;
    case 'porcupine0':
      spines(c, f, A.n);
      break;
    case 'porcupine1':
      f.spikyT = A.t;
      break;
    case 'porcupine2':
      fan(A.n, A.spread, { dmg: A.dmg, spd: A.spd, life: A.life, kind: 'spine' });
      break;
    case 'whirlwind0':
      f.buffT = A.t;
      pull(c, f, e, 1);
      break;
    case 'whirlwind1':
      ring(c, f.x, f.y, f.r, '#5eead4', 0.5, 5, 170);
      if (near(A.range)) {
        hurt(c, e, A.dmg * m, f);
        knock(c, f, e, A.knock);
      }
      break;
    case 'whirlwind2':
      s.zones.push({
        x: f.x + cos(a) * A.dist,
        y: f.y + sin(a) * A.dist,
        r: A.r,
        life: A.life,
        max: A.life,
        owner: f.id,
        dps: A.dps,
        slow: true,
        kind: 'tornado',
        home: A.home,
      });
      break;
    case 'phoenix0':
      f.hp = Math.min(f.maxHp, f.hp + f.maxHp * A.heal);
      if (dist < A.range) hurt(c, e, CP.flame * m, f, '#ffcf70');
      ring(c, f.x, f.y, f.r, '#ffcf70', 0.6, 6, 120);
      burst(c, f.x, f.y, '#ffcf70', 30);
      break;
    case 'phoenix1':
      fan(A.n, A.spread, {
        dmg: A.dmg,
        spd: A.spd,
        life: A.life,
        kind: 'feather',
        home: A.home,
        rad: A.rad,
      });
      break;
    case 'phoenix2':
      f.aura = { t: A.t, r: A.r, dps: A.dps, heal: A.heal, kind: 'sun' };
      break;
    case 'giant0':
      ring(c, f.x, f.y, f.r, '#d6d3d1', 0.6, 7, 130);
      if (near(A.range)) {
        hurt(c, e, CP.quake * m, f);
        knock(c, f, e, A.knock);
      }
      shake(c, 12);
      break;
    case 'giant1':
      fire(c, f, a, {
        dmg: A.dmg,
        spd: A.spd,
        life: A.life,
        kind: 'rock',
        knock: A.knock,
        rad: A.rad,
      });
      break;
    case 'giant2':
      f.stoneT = A.t;
      break;
    case 'fairy0':
      f.aura = { t: A.t, r: A.r, dps: A.dps, heal: A.heal, kind: 'petal' };
      break;
    case 'fairy1':
      e.rootT = A.t;
      hurt(c, e, A.dmg * m, f, '#86efac');
      ring(c, e.x, e.y, e.r, '#4ade80', 0.6, 5, 26);
      burst(c, e.x, e.y, '#86efac', 18);
      break;
    case 'fairy2': {
      const off = rand(c) * TAU;
      for (let i = 0; i < A.n; i++) {
        const aa = off + (i / A.n) * TAU;
        dropMine(c, f, cx(e.x + cos(aa) * A.dist, A.edge), cy(e.y + sin(aa) * A.dist, A.edge), {
          kind: 'flower',
          dmg: A.dmg,
          R: A.R,
          arm: A.arm,
        });
      }
      ring(c, e.x, e.y, 20, '#f9a8d4', 0.5, 4, 50);
      break;
    }
    case 'mooncat0':
      dash(A.boost);
      f.nextBonus = A.bonus * m;
      f.invulnT = Math.max(f.invulnT, A.invuln);
      burst(c, f.x, f.y, '#c7d2fe', 16);
      break;
    case 'mooncat1':
      fan(A.n, A.spread, {
        dmg: A.dmg,
        spd: A.spd,
        life: A.life,
        kind: 'claw',
        rad: A.rad,
        bleed: { t: A.bleedT, dps: A.bleedDps },
      });
      break;
    case 'mooncat2':
      f.lifeT = A.t;
      ring(c, f.x, f.y, f.r, '#fde68a', 0.6, 5, 40);
      break;
    case 'mermaid0':
      ring(c, f.x, f.y, f.r, '#67e8f9', 0.55, 7, 170);
      burst(c, f.x, f.y, '#a5f3fc', 26, 1.3);
      if (near(A.range)) {
        hurt(c, e, A.dmg * m, f, '#a5f3fc');
        knock(c, f, e, A.knock);
      }
      break;
    case 'mermaid1':
      e.charmT = A.t;
      e.charmBy = f.id;
      emit(c, { e: 'beam', a: f.id, b: e.id, life: 0.45, col: '244,114,182' });
      ring(c, e.x, e.y, e.r, '#f472b6', 0.5, 4, 30);
      break;
    case 'mermaid2':
      f.bubbleT = A.t;
      ring(c, f.x, f.y, f.r, '#a5f3fc', 0.5, 4, 20);
      break;
    case 'unicorn0':
      f.buffT = A.t;
      f.rainbowT = A.t;
      dash(1);
      burst(c, f.x, f.y, '#f5d0fe', 20);
      break;
    case 'unicorn1':
      f.healHitT = A.t;
      f.hp = Math.min(f.maxHp, f.hp + f.maxHp * A.heal);
      burst(c, f.x, f.y, '#86efac', 20);
      break;
    case 'unicorn2':
      for (let i = 0; i < A.n; i++) {
        const aa = rand(c) * TAU,
          rr = rand(c) * A.spread,
          t = A.delay + i * A.gap;
        s.drops.push({
          x: cx(e.x + cos(aa) * rr, A.edge),
          y: cy(e.y + sin(aa) * rr, A.edge),
          t,
          t0: t,
          owner: f.id,
          dmg: A.dmg * m,
          R: A.R,
        });
      }
      break;
    case 'gordafarid0':
      fire(c, f, a, {
        dmg: A.dmg,
        spd: A.spd,
        life: A.life,
        kind: 'spear',
        knock: A.knock,
        rad: A.rad,
      });
      break;
    case 'gordafarid1':
      pull(c, f, e, A.pull);
      e.slowT = Math.max(e.slowT, A.slow);
      hurt(c, e, A.dmg * m, f, '#fcd34d');
      f.nextBonus = A.bonus * m;
      emit(c, { e: 'beam', a: f.id, b: e.id, life: 0.45, col: '214,170,110' });
      break;
    case 'gordafarid2':
      f.warT = A.t;
      burst(c, f.x, f.y, '#fb7185', 24);
      break;
    case 'butterfly0':
      s.zones.push({
        x: e.x,
        y: e.y,
        r: A.r,
        life: A.life,
        max: A.life,
        owner: f.id,
        dps: A.dps,
        daze: true,
        kind: 'dust',
      });
      ring(c, e.x, e.y, 10, '#e9d5ff', 0.5, 4, 50);
      break;
    case 'butterfly1':
      f.invulnT = A.t;
      f.cocoonT = A.t;
      f.hp = Math.min(f.maxHp, f.hp + f.maxHp * A.heal);
      break;
    case 'butterfly2':
      fan(A.n, A.spread, {
        dmg: A.dmg,
        spd: A.spd,
        life: A.life,
        kind: 'bfly',
        home: A.home,
        rad: A.rad,
      });
      break;
    default:
      return false;
  }
  return true;
}
