import type { Ctx } from './ctx';
import { TAU, banner, burst, cls, emit, foesOf, other, rand, ring, sfx, shake } from './ctx';
import type { Fighter, Mine, ProjectileKind } from './types';
import { cos, hypot, sin } from './dmath';

/** Apply damage to `def`. `src` is the attacker, or null for map/poison/bleed damage. */
export function hurt(
  c: Ctx,
  def: Fighter,
  dmg: number,
  src: Fighter | null,
  col?: string,
  noRefl = false,
) {
  const { s, R, B } = c;
  if (def.hp <= 0 || s.phase !== 'fight') return;
  const tx = def.x,
    ty = def.y - def.r;
  if (def.invulnT > 0) {
    emit(c, { e: 'text', x: tx, y: ty, key: 'block', c: '#dfe6ff' });
    return;
  }
  if (def.invisT > 0) return;
  if (def.cls === 'ghost' && src && rand(c) < B.game.CLASSES.ghost.p.dodge) {
    emit(c, { e: 'text', x: tx, y: ty, key: 'dodge', c: '#e9e7ff' });
    return;
  }
  if (def.bubbleT > 0 && src && src !== def) {
    def.bubbleT = 0;
    emit(c, { e: 'text', x: tx, y: ty, key: 'bubblePop', c: '#a5f3fc' });
    ring(c, def.x, def.y, def.r + 8, '#a5f3fc', 0.4, 4, 30);
    burst(c, def.x, def.y, '#cffafe', 16);
    return;
  }
  const T = R.taken;
  if (src && src.charmT > 0) dmg *= T.charm;
  if (def.warT > 0) dmg *= T.war;
  if (src && src.powT > 0) dmg *= T.power;
  if (def.cls === 'tank') dmg *= T.tank;
  if (def.spikyT > 0) dmg *= T.spiky;
  if (def.stoneT > 0) dmg *= T.stone;
  if (def.dmgRedT > 0) dmg *= T.dmgRed;
  if (def.cls === 'mirror' && src && src !== def && !noRefl) {
    if (def.reflectT > 0) {
      emit(c, { e: 'text', x: tx, y: ty, key: 'reflect', c: '#f9a8d4' });
      hurt(c, src, dmg, null, '#f9a8d4', true);
      return;
    }
    hurt(c, src, dmg * B.game.CLASSES.mirror.p.reflect, null, '#f9a8d4', true);
  }
  def.hp = Math.max(0, def.hp - dmg);
  emit(c, {
    e: 'dmg',
    fid: def.id,
    x: def.x,
    y: ty - 4,
    n: Math.max(1, dmg),
    src: src ? src.id : -1,
    ...(col ? { c: col } : {}),
  });
  if (src && src.cls === 'vampire') {
    const P = B.engine.passives.vampire;
    src.hp = Math.min(src.maxHp, src.hp + dmg * (src.thirstT > 0 ? P.thirstHeal : P.heal));
  }
  if (def.hp <= 0 && def.lifeT > 0) {
    def.lifeT = 0;
    def.hp = def.maxHp * B.engine.passives.mooncat.nineLivesHp;
    ring(c, def.x, def.y, def.r, '#fde68a', 0.8, 6, 100);
    burst(c, def.x, def.y, '#fde68a', 36, 1.2);
    emit(c, { e: 'text', x: def.x, y: ty - 18, key: 'nineLives', c: '#fde68a', big: true });
  }
  if (def.hp <= 0 && def.cls === 'phoenix' && !def.revived) {
    def.revived = true;
    def.hp = def.maxHp * B.game.CLASSES.phoenix.p.revive;
    def.poison = 0;
    ring(c, def.x, def.y, def.r, '#ffcf70', 0.8, 6, 110);
    burst(c, def.x, def.y, '#ffcf70', 40, 1.3);
    emit(c, { e: 'text', x: def.x, y: ty - 18, key: 'revived', c: '#ffcf70', big: true });
    banner(c, 'phoenix', '#ffcf70');
  }
}

/** Body-contact damage from `att` to `def`. */
export function contact(c: Ctx, att: Fighter, def: Fighter) {
  const C = cls(c, att),
    P = c.B.engine.passives;
  let d = C.dmg * att.m;
  if (att.cls === 'rage') {
    d += att.rageBonus;
    if (att.buffT > 0) d *= P.rage.buffDmg;
    att.rageBonus += c.B.game.CLASSES.rage.p.bonus * att.m;
  }
  if (att.cls === 'tank' && att.invulnT > 0) d *= P.tank.invulnHitMul;
  if (att.cls === 'poison') def.poison = Math.min(c.R.poisonMax, def.poison + 1);
  if (att.cls === 'frost') def.slowT = Math.max(def.slowT, c.B.game.CLASSES.frost.p.slow);
  if (att.cls === 'whirlwind')
    d = (C.dmg + hypot(att.vx, att.vy) / c.B.game.CLASSES.whirlwind.p.per) * att.m;
  if (att.cls === 'ghost' && att.ghostNext) {
    d *= P.ghost.nextMul;
    att.ghostNext = false;
    att.invisT = 0;
  }
  if (att.cls === 'mooncat' && rand(c) < c.B.game.CLASSES.mooncat.p.crit) {
    d *= P.mooncat.critMul;
    emit(c, { e: 'text', x: att.x, y: att.y - att.r - 16, key: 'crit', c: '#c7d2fe' });
  }
  if (att.cls === 'unicorn') {
    att.hits++;
    if (att.hits % P.unicorn.every === 0) {
      d += c.B.game.CLASSES.unicorn.p.horn * att.m;
      ring(c, def.x, def.y, def.r, '#f5d0fe', 0.4, 4, 30);
    }
    if (att.healHitT > 0) att.hp = Math.min(att.maxHp, att.hp + P.unicorn.healHit * att.m);
  }
  if (att.cls === 'gordafarid') {
    d *= 1 + c.B.game.CLASSES.gordafarid.p.low * (1 - att.hp / att.maxHp);
    if (att.warT > 0) d *= P.gordafarid.warMul;
  }
  if (att.nextBonus) {
    d += att.nextBonus;
    att.nextBonus = 0;
  }
  if (att.spikyT > 0) d += P.spiky.bonus * att.m;
  if (att.boostT > 0) {
    d *= c.R.boostHitMul;
    emit(c, { e: 'text', x: att.x, y: att.y - att.r - 16, key: 'boostHit', c: '#ffffff' });
  }
  hurt(c, def, d, att);
}

export interface FireOpts {
  dmg?: number;
  spd?: number;
  life?: number;
  kind?: ProjectileKind;
  home?: number;
  slow?: number;
  knock?: number;
  explode?: { dmg: number; R: number };
  rad?: number;
  bleed?: { t: number; dps: number };
}

export function fire(c: Ctx, f: Fighter, a: number, o: FireOpts = {}) {
  const sp = o.spd ?? c.R.arrowSpeed;
  c.s.arrows.push({
    x: f.x + cos(a) * f.r,
    y: f.y + sin(a) * f.r,
    vx: cos(a) * sp,
    vy: sin(a) * sp,
    owner: f.id,
    dmg: (o.dmg ?? c.B.game.CLASSES.archer.p.arrow) * f.m,
    life: o.life || c.R.arrowLife,
    kind: o.kind || 'arrow',
    home: o.home || 0,
    slow: o.slow || 0,
    knock: o.knock || 0,
    explode: o.explode || null,
    rad: o.rad || 0,
    bleed: o.bleed || null,
    ported: false,
    done: false,
  });
}

export function spines(c: Ctx, f: Fighter, n: number) {
  const off = rand(c) * TAU,
    P = c.B.engine.passives.porcupine;
  for (let i = 0; i < n; i++)
    fire(c, f, off + (i / n) * TAU, {
      dmg: c.B.game.CLASSES.porcupine.p.spine,
      spd: P.spd,
      life: P.life,
      kind: 'spine',
    });
}

export function zap(c: Ctx, f: Fighter, d: number) {
  const e = other(c, f);
  sfx(c, 'zapS');
  emit(c, { e: 'bolt', a: f.id, b: e.id, ax: f.x, ay: f.y });
  hurt(c, e, d * f.m, f, '#c7d2fe');
}

export function dropMine(c: Ctx, f: Fighter, x: number, y: number, o: Partial<Mine> = {}) {
  const own = c.s.mines.filter((m) => m.owner === f.id);
  if (own.length >= c.R.mineCap) c.s.mines.splice(c.s.mines.indexOf(own[0]!), 1);
  c.s.mines.push({ x, y, owner: f.id, arm: c.R.mineArm, t: 0, ...o });
}

function push(c: Ctx, e: Fighter, dx: number, dy: number, k: number, t: number) {
  if (e.stoneT > 0) return;
  const d = hypot(dx, dy) || 1,
    s = cls(c, e).speed;
  e.vx = (dx / d) * s * k;
  e.vy = (dy / d) * s * k;
  e.kbT = t;
}
export const pull = (c: Ctx, f: Fighter, e: Fighter, k: number) =>
  push(c, e, f.x - e.x, f.y - e.y, k, c.R.kbT);
export const knock = (c: Ctx, f: Fighter, e: Fighter, k: number) =>
  push(c, e, e.x - f.x, e.y - f.y, k, c.R.kbT);
export const knockDir = (c: Ctx, e: Fighter, vx: number, vy: number, k: number) =>
  push(c, e, vx, vy, k, c.R.knockDirT);

export function explode(
  c: Ctx,
  owner: Fighter,
  x: number,
  y: number,
  dmg: number,
  R: number,
  col = '#ffb347',
) {
  for (const e of foesOf(c, owner)) if (hypot(e.x - x, e.y - y) < R + e.r) hurt(c, e, dmg, owner);
  burst(c, x, y, col, 26, 1.3);
  ring(c, x, y, 8, col, 0.45, 5, R);
  sfx(c, 'boomS');
  shake(c, 7);
}
