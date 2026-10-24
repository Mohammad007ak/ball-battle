import type { Balance } from '@chakachak/content';
import { applyRoundResult, botPick, createMatch, nextMap, roundConfig, type Pick } from './match';
import { createRound, step } from './round';
import type { Input, Mode } from './types';

/**
 * Matches against bots run on the phone; the server only verifies them. The server hands out a
 * `MatchSetup` (seed + both rosters), the client plays and records a `MatchLog`, and the server
 * replays the log with the same engine to decide the winner. Same seed + inputs ⇒ same result.
 */
export interface MatchSetup {
  mode: Mode;
  seed: number;
  /** 1v1: [player's 2, bot's 2]. 2v2: [player's 2 options, [ally, foe1, foe2]]. */
  teams: [Pick[], Pick[]];
  botSkill: number;
}

export interface RoundLog {
  /** 1v1: roster index the player sent in. 2v2: which of the two options the player chose. */
  pick: number;
  /** [tick before which the inputs apply, inputs] — the tick is `RoundState.tick` before `step`. */
  inputs: [number, Input[]][];
}

export interface MatchLog {
  rounds: RoundLog[];
  surrender?: boolean;
}

export interface ReplayResult {
  win: boolean;
  score: [number, number];
}

/** Safety cap: countdown + full round + slack, in ticks. */
const MAX_TICKS = 70 * 60;
const MAX_INPUTS = 3000;

/** Build the match exactly as the client does (shared by client and replay). */
export function matchFromSetup(setup: MatchSetup, B: Balance, pick2v2 = 0) {
  if (setup.mode === '1v1') return createMatch('1v1', setup.seed, setup.teams, B);
  const [mine, [ally, ...foes]] = setup.teams;
  return createMatch('2v2', setup.seed, [[mine[pick2v2]!, ally!], foes], B);
}

function validInput(i: Input): boolean {
  if (i.t === 'ability') return i.fid === 0;
  if (i.t === 'boost') return i.fid === 0 && Number.isFinite(i.x) && Number.isFinite(i.y);
  return false;
}

/** Re-run a recorded match. Throws on a malformed log; a surrender is always a loss. */
export function replayMatch(setup: MatchSetup, log: MatchLog, B: Balance): ReplayResult {
  if (log.surrender) return { win: false, score: [0, 0] };
  const first = log.rounds[0];
  if (!first) throw new Error('emptyLog');
  const m = matchFromSetup(setup, B, setup.mode === '2v2' ? first.pick : 0);
  for (const r of log.rounds) {
    if (m.winner !== null) break;
    let cfg;
    if (setup.mode === '1v1') {
      const map = nextMap(m);
      if (!m.teams[0][r.pick]?.alive) throw new Error('badPick');
      const bi = botPick(m, 1);
      cfg = roundConfig(m, map, [r.pick, bi], B, { botSkill: setup.botSkill });
    } else cfg = roundConfig(m, 'classic', [0, 0], B, { botSkill: setup.botSkill });
    cfg.fighters[0]!.bot = false;
    const s = createRound(cfg);
    if (r.inputs.length > MAX_INPUTS) throw new Error('tooManyInputs');
    let k = 0,
      lastTick = -1;
    while (!s.result && s.tick < MAX_TICKS) {
      let inputs: Input[] = [];
      const e = r.inputs[k];
      if (e && e[0] < s.tick) throw new Error('badInput');
      if (e && e[0] === s.tick) {
        if (e[0] <= lastTick || !Array.isArray(e[1]) || e[1].length > 4 || !e[1].every(validInput))
          throw new Error('badInput');
        lastTick = e[0];
        inputs = e[1];
        k++;
      }
      step(s, inputs, B);
    }
    if (!s.result) throw new Error('roundDidNotEnd');
    applyRoundResult(m, s.result);
  }
  if (m.winner === null) throw new Error('matchNotFinished');
  return { win: m.winner === 0, score: [m.score[0], m.score[1]] };
}
