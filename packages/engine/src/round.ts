import type { Balance } from '@chakachak/content';
import { useAbility } from './abilities';
import { botThink } from './bot';
import type { Ctx } from './ctx';
import { banner, bounds, burst, clamp, emit, other, ring, sfx, shake } from './ctx';
import type { GameEvent } from './events';
import { makeFighter, nudge } from './fighter';
import { buildMap, mapTick } from './maps';
import { createRng } from './rng';
import { fighterTick } from './tick';
import { spawnPup, worldTick } from './world';
import type { Input, RoundConfig, RoundResult, RoundState } from './types';

/** Fixed simulation timestep (CLAUDE.md rule 3). */
export const DT = 1 / 60;

export function createRound(cfg: RoundConfig): RoundState {
  const B = cfg.balance,
    R = B.engine.rules,
    W = cfg.mode === '2v2' ? R.world2v2 : R.world1v1,
    // Portrait arena (phone screens): height = width × aspect.
    H = Math.round(W * R.aspect),
    rng = createRng(cfg.seed);
  const f = cfg.fighters.map((sp, id) => {
    const spec = { ...sp, skill: sp.skill ?? cfg.botSkill ?? 0 };
    if (cfg.mode === '2v2') {
      const p = R.spawn2v2[id]!;
      return makeFighter(B, rng, id, spec, W * p[0]!, () => H * p[1]!);
    }
    const S = R.spawn1v1;
    return makeFighter(B, rng, id, spec, W * S.x[spec.team]!, (j) => H * (S.y + j * S.yJitter));
  });
  return {
    mode: cfg.mode,
    W,
    H,
    tick: 0,
    phase: 'count',
    count: R.countdown,
    time: 0,
    ins: 0,
    shrinkWarned: false,
    rng,
    map: buildMap(cfg.map, W, H, B.engine.maps),
    f,
    arrows: [],
    zones: [],
    mines: [],
    drops: [],
    pups: [],
    pupAt: [...R.pickups.at],
    fx: !!cfg.fx,
    result: null,
  };
}

function applyInput(c: Ctx, inp: Input) {
  const s = c.s;
  if (inp.t === 'surrender') {
    if (!s.result) end(c, inp.team === 0 ? 1 : 0, true);
    return;
  }
  const f = s.f[inp.fid];
  if (!f) return;
  if (inp.t === 'boost') nudge(c, f, inp.x, inp.y);
  else useAbility(c, f);
}

/** Advance the round by exactly one tick (1/60 s). Mutates `s`; returns cosmetic events. */
export function step(s: RoundState, inputs: readonly Input[], balance: Balance): GameEvent[] {
  const c: Ctx = { s, B: balance, R: balance.engine.rules, ev: [] };
  if (s.phase === 'ended') return c.ev;
  s.tick++;
  const dt = DT,
    G = balance.game;
  for (const inp of inputs) applyInput(c, inp);
  if (s.result) return c.ev;

  if (s.phase === 'count') {
    const pc = Math.ceil(s.count);
    s.count -= dt;
    if (s.count > 0 && Math.ceil(s.count) !== pc) sfx(c, 'count');
    // Epsilon guards float drift so the countdown ends on tick 180, not 181.
    if (s.count <= 1e-9) {
      s.phase = 'fight';
      banner(c, 'start', '#ffc53d');
      sfx(c, 'go');
    }
    return c.ev;
  }

  s.time += dt;
  if (s.time >= G.SHRINK_AT) {
    if (!s.shrinkWarned) {
      s.shrinkWarned = true;
      banner(c, 'shrink', '#ff6b6b');
    }
    const max = (G.SHRINK_MAX * s.W) / c.R.world1v1;
    s.ins = Math.min(max, ((s.time - G.SHRINK_AT) / (G.MATCH_TIME - G.SHRINK_AT)) * max);
  }
  if (s.pupAt.length && s.time >= s.pupAt[0]!) {
    s.pupAt.shift();
    spawnPup(c);
  }
  mapTick(c, dt);
  for (const f of s.f) if (!f.out) fighterTick(c, f, dt);
  s.pups = s.pups.filter((p) => !p.taken);
  const B0 = bounds(c),
    edge = c.R.pickups.edge;
  for (const p of s.pups) {
    p.t += dt;
    p.x = clamp(p.x, B0.x0 + edge, B0.x1 - edge);
    p.y = clamp(p.y, B0.y0 + edge, B0.y1 - edge);
  }
  worldTick(c, dt);

  if (s.mode === '2v2')
    for (const f of s.f)
      if (f.hp <= 0 && !f.out) {
        f.out = true;
        burst(c, f.x, f.y, balance.game.CLASSES[f.cls].c1, 40, 1.5);
        ring(c, f.x, f.y, f.r, '#ffffff', 0.6, 6, 60);
        emit(c, {
          e: 'text',
          x: f.x,
          y: f.y - f.r - 14,
          key: 'out',
          c: f.team ? '#ffc53d' : '#ff6b6b',
          big: true,
          fid: f.id,
        });
        shake(c, 12);
        sfx(c, 'hitBig');
      }
  for (const f of s.f)
    if (f.bot && !f.out) {
      const e = other(c, f);
      if (e && !e.out) botThink(c, f, e, dt);
    }

  const ta = s.f.some((f) => f.team === 0 && f.hp > 0),
    tb = s.f.some((f) => f.team === 1 && f.hp > 0);
  if (!ta || !tb || s.time >= G.MATCH_TIME) end(c, winnerOf(s, ta, tb), false);
  return c.ev;
}

function winnerOf(s: RoundState, ta: boolean, tb: boolean): 0 | 1 {
  if (!tb) return 0;
  if (!ta) return 1;
  // Timeout: compare remaining hp fraction (summed per team in 2v2). Ties go to team 0, as in the prototype.
  const sc = (t: number) =>
    s.f.filter((f) => f.team === t).reduce((q, f) => q + Math.max(0, f.hp) / f.maxHp, 0);
  return sc(0) >= sc(1) ? 0 : 1;
}

function end(c: Ctx, winner: 0 | 1, surrender: boolean) {
  const s = c.s;
  s.phase = 'ended';
  s.result = {
    winner,
    surrender,
    fighters: s.f.map((f) => ({ hp: Math.max(0, f.hp), maxHp: f.maxHp, revived: f.revived })),
  } satisfies RoundResult;
}
