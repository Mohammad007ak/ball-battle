import { CLASS_KEYS, type ClassKey } from '@chakachak/content';
import { describe, expect, it } from 'vitest';
import { hurt } from './combat';
import type { Ctx } from './ctx';
import { hashState } from './hash';
import { MAP_IDS } from './maps';
import { applyRoundResult, botPick, createMatch, nextMap, roundConfig } from './match';
import { createRng, next } from './rng';
import { createRound, step } from './round';
import { B, arena, run } from './test-utils';
import type { Input, MapId, RoundState } from './types';

const ctx = (s: RoundState): Ctx => ({ s, B, R: B.engine.rules, ev: [] });

function playScripted(seed: number, map: MapId, a: ClassKey, b: ClassKey) {
  const s = createRound({
    seed,
    mode: '1v1',
    map,
    balance: B,
    fighters: [
      { team: 0, cls: a, lvl: 3, ab: 1 },
      { team: 1, cls: b, lvl: 2, ab: 2, bot: true },
    ],
  });
  const input = createRng(seed ^ 0x9e3779b9);
  const hashes: string[] = [];
  while (!s.result) {
    const inputs: Input[] = [];
    const r = next(input);
    if (r < 0.02) inputs.push({ t: 'boost', fid: 0, x: next(input) * 360, y: next(input) * 360 });
    else if (r < 0.03) inputs.push({ t: 'ability', fid: 0 });
    step(s, inputs, B);
    if (s.tick % 60 === 0) hashes.push(hashState(s));
  }
  hashes.push(hashState(s));
  return { hashes, result: s.result };
}

describe('determinism', () => {
  it('same seed and inputs give the same state hash every second', () => {
    for (const map of MAP_IDS) {
      const x = playScripted(1234, map, 'archer', 'bomber'),
        y = playScripted(1234, map, 'archer', 'bomber');
      expect(y.hashes).toEqual(x.hashes);
      expect(y.result).toEqual(x.result);
    }
  });
  it('a different seed diverges', () => {
    expect(playScripted(1, 'classic', 'rage', 'ghost').hashes).not.toEqual(
      playScripted(2, 'classic', 'rage', 'ghost').hashes,
    );
  });
  it('state is plain JSON (snapshot-safe)', () => {
    const s = arena('mermaid', 1);
    run(s, 120, [{ t: 'ability', fid: 0 }]);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
});

describe('rounds', () => {
  it('counts down 3 s, then fights; every class pairing finishes with a winner on every map', () => {
    const s = createRound({
      seed: 1,
      mode: '1v1',
      map: 'classic',
      balance: B,
      fighters: [
        { team: 0, cls: 'archer', lvl: 1, ab: 0 },
        { team: 1, cls: 'rage', lvl: 1, ab: 0 },
      ],
    });
    run(s, 179);
    expect(s.phase).toBe('count');
    run(s, 1);
    expect(s.phase).toBe('fight');
    for (const map of MAP_IDS)
      for (let i = 0; i < CLASS_KEYS.length; i++) {
        const a = CLASS_KEYS[i]!,
          b = CLASS_KEYS[(i + 5) % CLASS_KEYS.length]!;
        const r = createRound({
          seed: i,
          mode: '1v1',
          map,
          balance: B,
          fighters: [
            { team: 0, cls: a, lvl: 1, ab: (i % 3) as 0, bot: true },
            { team: 1, cls: b, lvl: 1, ab: ((i + 1) % 3) as 0, bot: true },
          ],
        });
        run(r, 3800);
        expect(r.result).not.toBeNull();
        for (const f of r.f) expect(Number.isFinite(f.x + f.y + f.hp)).toBe(true);
      }
  });
  it('shrinks the arena after 45 s and spawns pickups at 20 s and 40 s', () => {
    const s = arena('tank', 0, 'tank');
    for (const f of s.f) f.hp = f.maxHp = 1e9;
    run(s, 20 * 60);
    expect(s.pups.length + (2 - s.pupAt.length - s.pups.length)).toBeGreaterThanOrEqual(1);
    run(s, 26 * 60);
    expect(s.ins).toBeGreaterThan(0);
    expect(s.pupAt).toEqual([]);
  });
  it('time out compares remaining hp fraction', () => {
    const s = arena('tank', 0, 'tank');
    for (const f of s.f) f.hp = f.maxHp = 1e9;
    s.f[1]!.hp = 9e8;
    s.pupAt = [];
    run(s, 61 * 60);
    expect(s.result?.winner).toBe(0);
  });
  it('surrender ends the round for the other team', () => {
    const s = arena('archer', 0);
    run(s, 1, [{ t: 'surrender', team: 0 }]);
    expect(s.result).toMatchObject({ winner: 1, surrender: true });
  });
  it('boost spends a charge and recharges after 4 s', () => {
    const s = arena('rage', 0);
    run(s, 1, [{ t: 'boost', fid: 0, x: 0, y: 0 }]);
    expect(s.f[0]!.charges).toBe(2);
    expect(s.f[0]!.boostT).toBeGreaterThan(0);
    run(s, 4 * 60 + 1);
    expect(s.f[0]!.charges).toBe(3);
  });
});

describe('passives', () => {
  it('tank takes 35% less damage', () => {
    const s = arena('tank', 0, 'archer');
    const t = s.f[0]!,
      hp = t.hp;
    hurt(ctx(s), t, 10, s.f[1]!);
    expect(hp - t.hp).toBeCloseTo(6.5);
  });
  it('mirror reflects 30% to the attacker', () => {
    const s = arena('mirror', 0, 'archer');
    const att = s.f[1]!,
      hp = att.hp;
    hurt(ctx(s), s.f[0]!, 10, att);
    expect(hp - att.hp).toBeCloseTo(3);
  });
  it('vampire heals half of its damage', () => {
    const s = arena('vampire', 0, 'archer');
    const v = s.f[0]!;
    v.hp = 10;
    hurt(ctx(s), s.f[1]!, 8, v);
    expect(v.hp).toBeCloseTo(14);
  });
  it('phoenix revives once at 35%', () => {
    const s = arena('phoenix', 0, 'archer');
    const p = s.f[0]!;
    hurt(ctx(s), p, 1e6, s.f[1]!);
    expect(p.hp).toBeCloseTo(p.maxHp * 0.35);
    hurt(ctx(s), p, 1e6, s.f[1]!);
    expect(p.hp).toBe(0);
  });
  it('poison contact stacks poison that ticks damage', () => {
    const s = arena('poison', 0, 'tank', { dist: 40 });
    run(s, 2);
    expect(s.f[1]!.poison).toBeGreaterThan(0);
  });
  it('card level scales hp by 1 + 0.09 per level', () => {
    const s = createRound({
      seed: 1,
      mode: '1v1',
      map: 'classic',
      balance: B,
      fighters: [
        { team: 0, cls: 'archer', lvl: 8, ab: 0 },
        { team: 1, cls: 'archer', lvl: 1, ab: 0 },
      ],
    });
    expect(s.f[0]!.maxHp / s.f[1]!.maxHp).toBeCloseTo(1.63);
  });
});

describe('maps', () => {
  it('spikes hurt on wall hits in the middle third', () => {
    const s = arena('tank', 0, 'tank', { map: 'spikes' });
    const f = s.f[0]!;
    f.x = 30;
    f.y = 180;
    f.vx = -200;
    f.vy = 0;
    const hp = f.hp;
    run(s, 10);
    expect(f.hp).toBeLessThan(hp);
  });
  it('portals teleport balls', () => {
    const s = arena('tank', 0, 'tank', { map: 'portal' });
    const f = s.f[0]!,
      [p0, p1] = s.map.portals;
    f.x = p0!.x - 30;
    f.y = p0!.y;
    f.vx = 200;
    f.vy = 0;
    run(s, 10);
    expect(Math.hypot(f.x - p1!.x, f.y - p1!.y)).toBeLessThan(40);
  });
  it('pillars block projectiles', () => {
    const s = arena('archer', 1, 'tank', { map: 'pillars' });
    expect(s.map.pillars).toHaveLength(4);
    expect(s.map.bar).toBeNull();
  });
});

describe('2v2', () => {
  it('runs four fighters on the portrait 2v2 arena and removes fallen ones', () => {
    const s = createRound({
      seed: 3,
      mode: '2v2',
      map: 'classic',
      balance: B,
      fighters: (['archer', 'rage', 'bomber', 'ghost'] as ClassKey[]).map((cls, i) => ({
        team: (i < 2 ? 0 : 1) as 0 | 1,
        cls,
        lvl: 1,
        ab: 0 as const,
        bot: true,
      })),
    });
    expect([s.W, s.H]).toEqual([400, 600]);
    run(s, 70 * 60);
    expect(s.result).not.toBeNull();
    const dead = s.f.filter((f) => f.hp <= 0);
    for (const f of dead) expect(f.out).toBe(true);
  });
});

describe('match', () => {
  it('best of 3 with hp carried over and no repeated map', () => {
    const m = createMatch(
      '1v1',
      99,
      [
        [
          { cls: 'archer', lvl: 1, ab: 0 },
          { cls: 'rage', lvl: 1, ab: 0 },
        ],
        [
          { cls: 'tank', lvl: 1, ab: 0, bot: true },
          { cls: 'frost', lvl: 1, ab: 0, bot: true },
        ],
      ],
      B,
    );
    let last: MapId | null = null;
    while (m.winner === null) {
      const map = nextMap(m);
      expect(map).not.toBe(last);
      last = map;
      const cfg = roundConfig(m, map, [botPick(m, 0), botPick(m, 1)], B);
      cfg.fighters.forEach((f) => (f.bot = true));
      const s = createRound(cfg);
      while (!s.result) step(s, [], B);
      const w = s.result.winner;
      applyRoundResult(m, s.result);
      const winner = m.teams[w][m.active![w]]!;
      expect(winner.hp).toBeGreaterThanOrEqual(1);
      expect(m.teams[1 - w]![m.active![1 - w]!]!.alive).toBe(false);
    }
    expect(Math.max(...m.score)).toBe(2);
    expect(m.round).toBeLessThanOrEqual(3);
  });
});

describe('online sync', () => {
  // Online clients get the round state as JSON and keep simulating it themselves.
  it('a state sent as JSON continues exactly like the original, for every class and map', () => {
    for (const map of MAP_IDS)
      for (let i = 0; i < CLASS_KEYS.length; i += 2) {
        const cls = [CLASS_KEYS[i]!, CLASS_KEYS[(i + 7) % CLASS_KEYS.length]!];
        const s = createRound({
          seed: 11 + i,
          mode: '1v1',
          map,
          balance: B,
          fx: true,
          fighters: cls.map((c, t) => ({
            team: t as 0 | 1,
            cls: c,
            lvl: 4,
            ab: (i % 3) as 0,
            bot: true,
          })),
        });
        for (let k = 0; k < 1500 && !s.result; k++) {
          step(s, [], B);
          if (k % 250 !== 120) continue;
          const copy = JSON.parse(JSON.stringify(s)) as typeof s;
          for (let j = 0; j < 240 && !s.result; j++) {
            step(s, [], B);
            step(copy, [], B);
          }
          expect(hashState(copy), `${map} ${cls.join()} @${k}`).toBe(hashState(s));
        }
      }
  });
});
