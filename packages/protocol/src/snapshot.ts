import type { Fighter, RoundState } from '@chakachak/engine';

/**
 * Online match snapshots (server → client, 20/s). Only what the renderer needs, rounded, as
 * arrays to keep each message small on mobile networks (WebSocket deflate does the rest).
 * Static fighter fields (cls, lvl, team, ab, r…) are sent once when the round starts.
 */
export const F_KEYS = [
  'x', 'y', 'vx', 'vy', 'hp', 'maxHp', 'charges', 'chargeT', 'abilityCd', 'abilityMax', 'boostT',
  'kbT', 'buffT', 'thirstT', 'powT', 'invulnT', 'spikyT', 'stoneT', 'dmgRedT', 'rapidT', 'zapFastT',
  'freezeT', 'slowT', 'rootT', 'dazeT', 'charmT', 'bubbleT', 'cocoonT', 'lifeT', 'warT', 'healHitT',
  'dotT', 'reflectT', 'invisT', 'poison', 'rageBonus',
] as const satisfies readonly (keyof Fighter)[]; // prettier-ignore

const r1 = (v: number) => Math.round(v * 10) / 10;
const r2 = (v: number) => Math.round(v * 100) / 100;

export interface Snapshot {
  tick: number;
  ph: RoundState['phase'];
  c: number;
  tm: number;
  ins: number;
  f: (number | string | null)[][];
  a: (number | string)[][];
  z: (number | string)[][];
  m: (number | string)[][];
  d: number[][];
  p: (number | string)[][];
  map: { ang: number; len: number; obsA: number; hit: number[]; pt: number[][] };
}

export function encodeSnapshot(s: RoundState): Snapshot {
  return {
    tick: s.tick,
    ph: s.phase,
    c: r2(s.count),
    tm: r2(s.time),
    ins: r1(s.ins),
    f: s.f.map((f) => [
      ...F_KEYS.map((k) => r2(f[k] as number)),
      f.out ? 1 : 0,
      f.revived ? 1 : 0,
      f.aura && f.aura.t > 0 ? f.aura.kind : null,
      f.aura ? r1(f.aura.r) : 0,
    ]),
    a: s.arrows.map((a) => [r1(a.x), r1(a.y), r1(a.vx), r1(a.vy), a.kind, a.owner]),
    z: s.zones.map((z) => [r1(z.x), r1(z.y), r1(z.r), r2(z.life), z.max, z.kind, z.owner]),
    m: s.mines.map((m) => [r1(m.x), r1(m.y), r2(m.arm), r2(m.t), m.kind ?? '', m.owner]),
    d: s.drops.map((d) => [r1(d.x), r1(d.y), r2(d.t), d.t0, d.R]),
    p: s.pups.map((p) => [r1(p.x), r1(p.y), p.type, r2(p.t)]),
    map: {
      ang: r2(s.map.bar?.ang ?? 0),
      len: r1(s.map.bar?.len ?? 0),
      obsA: r2(s.map.obsA),
      hit: s.map.bumpers.map((b) => r2(b.hit)),
      pt: s.map.portals.map((p) => [r1(p.x), r1(p.y)]),
    },
  };
}

/**
 * Write a snapshot into a client-side mirror `RoundState` (created from the round-start message),
 * so the existing renderer can draw it exactly like an offline round.
 */
export function applySnapshot(s: RoundState, n: Snapshot) {
  s.tick = n.tick;
  s.phase = n.ph;
  s.count = n.c;
  s.time = n.tm;
  s.ins = n.ins;
  n.f.forEach((row, i) => {
    const f = s.f[i] as unknown as Record<string, unknown>;
    if (!f) return;
    F_KEYS.forEach((k, j) => (f[k] = row[j]));
    const o = F_KEYS.length;
    f.out = row[o] === 1;
    f.revived = row[o + 1] === 1;
    f.aura = row[o + 2] ? { t: 1, r: row[o + 3], dps: 0, kind: row[o + 2] } : null;
  });
  s.arrows = n.a.map(([x, y, vx, vy, kind, owner]) => ({ x, y, vx, vy, kind, owner }) as never);
  s.zones = n.z.map(
    ([x, y, r, life, max, kind, owner]) => ({ x, y, r, life, max, kind, owner }) as never,
  );
  s.mines = n.m.map(
    ([x, y, arm, t, kind, owner]) => ({ x, y, arm, t, owner, ...(kind ? { kind } : {}) }) as never,
  );
  s.drops = n.d.map(([x, y, t, t0, R]) => ({ x, y, t, t0, R }) as never);
  s.pups = n.p.map(([x, y, type, t]) => ({ x, y, type, t }) as never);
  if (s.map.bar) {
    s.map.bar.ang = n.map.ang;
    s.map.bar.len = n.map.len;
  }
  s.map.obsA = n.map.obsA;
  s.map.bumpers.forEach((b, i) => (b.hit = n.map.hit[i] ?? 0));
  s.map.portals.forEach((p, i) => {
    const q = n.map.pt[i];
    if (q) [p.x, p.y] = q as [number, number];
  });
}
