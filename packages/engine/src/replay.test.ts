import { defaultBalance as B } from '@chakachak/content';
import { describe, expect, it } from 'vitest';
import { applyRoundResult, botPick, nextMap, roundConfig } from './match';
import { matchFromSetup, replayMatch, type MatchLog, type MatchSetup } from './replay';
import { createRng, next } from './rng';
import { createRound, step } from './round';
import type { Input } from './types';

const setup1: MatchSetup = {
  mode: '1v1',
  seed: 4242,
  botSkill: 0.5,
  teams: [
    [
      { cls: 'archer', lvl: 2, ab: 0 },
      { cls: 'rage', lvl: 1, ab: 0 },
    ],
    [
      { cls: 'tank', lvl: 2, ab: 1, bot: true },
      { cls: 'frost', lvl: 1, ab: 0, bot: true },
    ],
  ],
};

/** Plays like the client: random taps/abilities, recording the inputs. */
function playLikeClient(setup: MatchSetup, seed: number) {
  const m = matchFromSetup(setup, B);
  const r = createRng(seed),
    log: MatchLog = { rounds: [] };
  while (m.winner === null) {
    const map = nextMap(m);
    const pick = m.teams[0].findIndex((e) => e.alive);
    const bi = botPick(m, 1);
    const cfg = roundConfig(m, map, [pick, bi], B, { botSkill: setup.botSkill });
    const s = createRound(cfg),
      inputs: [number, Input[]][] = [];
    while (!s.result) {
      const x = next(r);
      const inp: Input[] =
        x < 0.02
          ? [{ t: 'boost', fid: 0, x: next(r) * 360, y: next(r) * 360 }]
          : x < 0.03
            ? [{ t: 'ability', fid: 0 }]
            : [];
      if (inp.length) inputs.push([s.tick, inp]);
      step(s, inp, B);
    }
    log.rounds.push({ pick, inputs });
    applyRoundResult(m, s.result);
  }
  return { log, win: m.winner === 0 };
}

describe('replay', () => {
  it('reproduces the client result from the input log', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const { log, win } = playLikeClient(setup1, seed);
      expect(replayMatch(setup1, log, B).win).toBe(win);
    }
  });
  it('rejects forged logs', () => {
    const { log } = playLikeClient(setup1, 1);
    const bad = structuredClone(log);
    bad.rounds[0]!.inputs.unshift([5, [{ t: 'ability', fid: 1 }]]);
    expect(() => replayMatch(setup1, bad, B)).toThrow();
    expect(() => replayMatch(setup1, { rounds: [] }, B)).toThrow();
    expect(replayMatch(setup1, { rounds: [], surrender: true }, B).win).toBe(false);
  });
  it('a truncated log cannot claim a win', () => {
    const { log } = playLikeClient(setup1, 2);
    expect(() => replayMatch(setup1, { rounds: log.rounds.slice(0, 1) }, B)).toThrow();
  });
});
