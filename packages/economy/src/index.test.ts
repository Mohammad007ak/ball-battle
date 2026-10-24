import { defaultBalance as B } from '@chakachak/content';
import { describe, expect, it } from 'vitest';
import {
  EconomyError,
  buyChest,
  dailySkins,
  fixProfile,
  freshProfile,
  matchResult,
  openSlot,
  rollChest,
  setTeam,
  unlockSlot,
  upgrade,
} from './index';

const seq = (seed = 1) => {
  let x = seed;
  return () => (x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296;
};

describe('economy', () => {
  it('fresh profile matches the prototype', () => {
    const S = freshProfile(B);
    expect(S).toMatchObject({ coins: 100, gems: 120, team: ['archer', 'rage'] });
    expect(S.lv.archer).toBe(1);
    expect(S.slots.filter(Boolean)).toHaveLength(3);
  });
  it('chest unlock takes real time, one at a time, and can be skipped with gems', () => {
    const S = freshProfile(B),
      t = 1_000_000;
    unlockSlot(B, S, 0, t);
    expect(() => unlockSlot(B, S, 1, t)).toThrow(EconomyError);
    expect(() => openSlot(B, S, 1, t, seq())).toThrow(EconomyError);
    const gems = S.gems;
    openSlot(B, S, 0, t + 1000, seq()); // 4 s left → 1 gem
    expect(S.gems).toBeLessThanOrEqual(gems - 1 + 2);
    expect(S.slots[0]).toBeNull();
  });
  it('opening a chest twice fails (no double reward)', () => {
    const S = freshProfile(B);
    unlockSlot(B, S, 0, 0);
    openSlot(B, S, 0, 10_000, seq());
    expect(() => openSlot(B, S, 0, 10_000, seq())).toThrow(EconomyError);
  });
  it('rollChest grants coins and owned-card stacks; legendary chest can unlock new cards', () => {
    const S = freshProfile(B);
    const items = rollChest(B, S, 4, seq(3));
    expect(items[0]).toMatchObject({ type: 'coins' });
    expect(items.some((i) => i.type === 'card' && i.isNew)).toBe(true);
  });
  it('buying needs gems and never goes negative', () => {
    const S = freshProfile(B);
    S.gems = 10;
    expect(() => buyChest(B, S, 1, seq())).toThrow(EconomyError);
    expect(S.gems).toBe(10);
  });
  it('upgrade spends cards and coins', () => {
    const S = freshProfile(B);
    S.cards.archer = 2;
    upgrade(B, S, 'archer');
    expect(S).toMatchObject({ coins: 80 });
    expect(S.lv.archer).toBe(2);
    expect(() => upgrade(B, S, 'archer')).toThrow(EconomyError);
  });
  it('match result: +30 / −20 trophies, chest from the cycle into a free slot', () => {
    const S = freshProfile(B);
    const r = matchResult(B, S, true, '1v1');
    expect(r).toMatchObject({ trophies: 30, tier: 0, slot: 3 });
    expect(matchResult(B, S, false, '1v1').trophies).toBe(-20);
    expect(matchResult(B, S, true, '2v2').trophies).toBe(0);
  });
  it('team swap and profile repair', () => {
    const S = freshProfile(B);
    expect(() => setTeam(S, 0, 'dragon')).toThrow(EconomyError);
    setTeam(S, 0, 'rage');
    expect(S.team).toEqual(['rage', 'archer']);
    const fixed = fixProfile(B, { team: ['dragon' as never], lv: { archer: 99 } as never });
    expect(fixed.lv.archer).toBe(8);
    expect(fixed.team).toEqual(['archer', 'rage']);
  });
  it('daily skins are deterministic per day, one per character', () => {
    const a = dailySkins(B, 20261024);
    expect(dailySkins(B, 20261024)).toEqual(a);
    expect(new Set(a.map((x) => x[0])).size).toBe(3);
  });
});
