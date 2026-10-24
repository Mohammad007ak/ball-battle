import { CLASS_KEYS } from '@chakachak/content';
import { describe, expect, it } from 'vitest';
import { compare } from './test-utils';
import type { RoundState } from './types';

type R = ReturnType<typeof compare>;
const arrows = (s: RoundState, kind: string) => s.arrows.filter((a) => a.kind === kind).length;
const zones = (s: RoundState, kind: string) => s.zones.filter((z) => z.kind === kind).length;
const moreArrows = (kind: string, n: number) => (r: R) =>
  arrows(r.used, kind) - arrows(r.base, kind) >= n;
const moreZones = (kind: string, n: number) => (r: R) =>
  zones(r.used, kind) - zones(r.base, kind) >= n;
const hurtsFoe = (r: R) => r.E.hp < r.E0.hp - 0.5;

/** [ability, ticks after use, expectation]. Each case is compared with the same seed without the ability. */
const CASES: [string, number, (r: R) => boolean, { still?: boolean }?][] = [
  ['archer0', 1, moreArrows('arrow', 9)],
  ['archer1', 1, moreArrows('heavy', 1)],
  ['archer2', 1, (r) => r.A.rapidT > 0],
  ['rage0', 1, (r) => r.A.buffT > 0],
  ['rage1', 1, (r) => r.A.nextBonus > 0 && r.A.boostT > 0],
  ['rage2', 1, hurtsFoe],
  ['vampire0', 1, hurtsFoe],
  ['vampire1', 1, moreArrows('bat', 5)],
  ['vampire2', 1, (r) => r.A.thirstT > 0],
  ['tank0', 1, (r) => r.A.invulnT > 0],
  ['tank1', 1, (r) => hurtsFoe(r) && r.E.slowT > 0 && r.E.kbT > 0],
  ['tank2', 1, (r) => r.A.dmgRedT > 0],
  ['poison0', 1, (r) => r.E.poison >= 2],
  ['poison1', 1, moreZones('acid', 1)],
  ['poison2', 1, hurtsFoe],
  ['frost0', 1, (r) => hurtsFoe(r) && r.E.freezeT > 0],
  ['frost1', 1, (r) => r.A.aura?.kind === 'snow' && r.E.slowT > 0],
  ['frost2', 1, moreArrows('ice', 3)],
  ['bomber0', 1, (r) => hurtsFoe(r) && r.used.mines.length - r.base.mines.length >= 3],
  ['bomber1', 1, (r) => r.used.mines.length - r.base.mines.length === 4],
  // The grenade flies to where the foe was, so the foe stands still here.
  ['bomber2', 60, hurtsFoe, { still: true }],
  ['lightning0', 60, (r) => hurtsFoe(r) && r.A.zapQ === 0],
  ['lightning1', 1, (r) => r.A.aura?.kind === 'elec'],
  ['lightning2', 1, (r) => r.A.zapFastT > 0],
  ['mirror0', 1, (r) => r.A.reflectT > 0],
  ['mirror1', 1, moreArrows('shard', 10)],
  ['mirror2', 1, (r) => r.A.x > r.E.x && r.E.slowT > 0],
  ['ghost0', 1, (r) => r.A.invisT > 0 && r.A.ghostNext],
  ['ghost1', 1, (r) => r.A.ghostNext && Math.hypot(r.A.x - r.E.x, r.A.y - r.E.y) < 60],
  ['ghost2', 1, (r) => hurtsFoe(r) && r.E.kbT > 0],
  ['dragon0', 1, moreZones('fire', 9)],
  ['dragon1', 1, moreZones('fire', 12)],
  ['dragon2', 1, (r) => r.A.buffT > 0],
  ['porcupine0', 1, moreArrows('spine', 20)],
  ['porcupine1', 1, (r) => r.A.spikyT > 0],
  ['porcupine2', 1, moreArrows('spine', 5)],
  ['whirlwind0', 1, (r) => r.A.buffT > 0 && r.E.kbT > 0],
  ['whirlwind1', 1, (r) => hurtsFoe(r) && r.E.kbT > 0],
  ['whirlwind2', 1, moreZones('tornado', 1)],
  ['phoenix0', 1, hurtsFoe],
  ['phoenix1', 1, moreArrows('feather', 6)],
  ['phoenix2', 1, (r) => r.A.aura?.kind === 'sun'],
  ['giant0', 1, (r) => hurtsFoe(r) && r.E.kbT > 0],
  ['giant1', 1, moreArrows('rock', 1)],
  ['giant2', 1, (r) => r.A.stoneT > 0],
  ['fairy0', 1, (r) => r.A.aura?.kind === 'petal'],
  ['fairy1', 1, (r) => hurtsFoe(r) && r.E.rootT > 0],
  ['fairy2', 1, (r) => r.used.mines.filter((m) => m.kind === 'flower').length === 3],
  ['mooncat0', 1, (r) => r.A.nextBonus > 0 && r.A.invulnT > 0],
  ['mooncat1', 1, moreArrows('claw', 3)],
  ['mooncat2', 1, (r) => r.A.lifeT > 0],
  ['mermaid0', 1, (r) => hurtsFoe(r) && r.E.kbT > 0],
  ['mermaid1', 1, (r) => r.E.charmT > 0 && r.E.charmBy === 0],
  ['mermaid2', 1, (r) => r.A.bubbleT > 0],
  ['unicorn0', 1, (r) => r.A.rainbowT > 0 && r.A.buffT > 0],
  ['unicorn1', 1, (r) => r.A.healHitT > 0],
  ['unicorn2', 1, (r) => r.used.drops.length === 6],
  ['gordafarid0', 1, moreArrows('spear', 1)],
  ['gordafarid1', 1, (r) => hurtsFoe(r) && r.A.nextBonus > 0],
  ['gordafarid2', 1, (r) => r.A.warT > 0],
  ['butterfly0', 1, moreZones('dust', 1)],
  ['butterfly1', 1, (r) => r.A.invulnT > 0 && r.A.cocoonT > 0],
  ['butterfly2', 1, moreArrows('bfly', 6)],
];

describe('abilities', () => {
  it('covers all 63 abilities', () => {
    expect(CASES.map((c) => c[0]).sort()).toEqual(
      CLASS_KEYS.flatMap((k) => [0, 1, 2].map((i) => k + i)).sort(),
    );
  });
  for (const [key, ticks, check, opts] of CASES)
    it(key, () => {
      const cls = key.slice(0, -1) as (typeof CLASS_KEYS)[number],
        ab = Number(key.slice(-1)) as 0 | 1 | 2;
      const r = compare(cls, ab, ticks, opts);
      expect(r.A.abilityCd).toBeGreaterThan(0);
      expect(check(r)).toBe(true);
    });
});
