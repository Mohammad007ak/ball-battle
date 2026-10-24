import type { Balance } from '@chakachak/content';
import type { Ctx } from './ctx';
import { TAU, cls, emit, ring } from './ctx';
import { next, type Rng } from './rng';
import type { Fighter, FighterSpec } from './types';

/** Card level multiplier on hp and damage: 1 + 0.09 × (level − 1). */
export const levelMult = (B: Balance, lvl: number) =>
  1 + B.engine.rules.levelStep * (Math.max(1, lvl) - 1);

export function makeFighter(
  B: Balance,
  rng: Rng,
  id: number,
  spec: FighterSpec,
  x: number,
  y: (jitter: number) => number,
): Fighter {
  const C = B.game.CLASSES[spec.cls],
    R = B.engine.rules,
    P = B.engine.passives,
    m = levelMult(B, spec.lvl),
    a = next(rng) * TAU,
    yy = y(next(rng)),
    maxHp = C.hp * m;
  const fighter: Fighter = {
    id,
    cls: spec.cls,
    lvl: spec.lvl,
    m,
    team: spec.team,
    bot: !!spec.bot,
    skill: spec.skill ?? 0,
    botHold: 0,
    out: false,
    ab: spec.ab,
    r: ('r' in C ? (C.r as number) : 0) || R.defaultRadius,
    x,
    y: yy,
    vx: Math.cos(a) * C.speed,
    vy: Math.sin(a) * C.speed,
    hp: spec.hp ?? maxHp,
    maxHp,
    hitCd: 0,
    rageBonus: 0,
    poison: 0,
    poisonAcc: 0,
    poisonDecay: 0,
    arrowT: P.archer.firstT,
    abilityCd: R.startAbilityCd,
    abilityMax: C.ab[spec.ab]!.cd,
    buffT: 0,
    invulnT: 0,
    aiDelay: R.bot.abilityDelay[0]! + next(rng) * R.bot.abilityDelay[1]!,
    charges: B.game.NUDGE_MAX,
    chargeT: 0,
    boostT: 0,
    kbT: 0,
    powT: 0,
    botT: R.bot.firstBoost[0]! + next(rng) * R.bot.firstBoost[1]!,
    spikeCd: 0,
    obsCd: 0,
    barCd: 0,
    portCd: 0,
    slowT: 0,
    freezeT: 0,
    reflectT: 0,
    invisT: 0,
    ghostNext: false,
    revived: !!spec.revived,
    zapT: P.lightning.firstT,
    zapQ: 0,
    zapQT: 0,
    mineT: P.bomber.firstT,
    fireT: 0,
    spineT: P.porcupine.firstT,
    burnAcc: 0,
    aura: null,
    auraAcc: 0,
    rapidT: 0,
    thirstT: 0,
    zapFastT: 0,
    spikyT: 0,
    stoneT: 0,
    dmgRedT: 0,
    nextBonus: 0,
    rootT: 0,
    dazeT: 0,
    charmT: 0,
    charmBy: -1,
    bubbleT: 0,
    cocoonT: 0,
    lifeT: 0,
    warT: 0,
    healHitT: 0,
    rainbowT: 0,
    rbT: 0,
    dotT: 0,
    dotDps: 0,
    dotAcc: 0,
    dotSrc: -1,
    hits: 0,
    shotT: P.mermaid.firstT,
  };
  return fighter;
}

/** Tap boost toward (tx, ty). Spends one charge. */
export function nudge(c: Ctx, f: Fighter, tx: number, ty: number): boolean {
  if (c.s.phase !== 'fight' || f.charges < 1 || f.out || f.hp <= 0) return false;
  f.charges--;
  const a = Math.atan2(ty - f.y, tx - f.x),
    C = cls(c, f);
  f.vx = Math.cos(a) * C.speed;
  f.vy = Math.sin(a) * C.speed;
  f.boostT = c.B.game.BOOST_TIME;
  ring(c, f.x, f.y, f.r, C.c1, 0.35, 3);
  emit(c, { e: 'boost', fid: f.id, a });
  return true;
}
