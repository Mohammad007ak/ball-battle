import type { Balance, ClassKey } from '@chakachak/content';
import { MAP_IDS } from './maps';
import { createRng, next, type Rng } from './rng';
import type { FighterSpec, MapId, Mode, RoundConfig, RoundResult } from './types';
import { levelMult } from './fighter';

/** A character a player brings to the match, with hp carried between rounds. */
export interface RosterEntry {
  cls: ClassKey;
  lvl: number;
  ab: 0 | 1 | 2;
  hp: number;
  maxHp: number;
  alive: boolean;
  revived: boolean;
  bot: boolean;
}

export interface MatchState {
  mode: Mode;
  rng: Rng;
  round: number;
  score: [number, number];
  hist: (0 | 1)[];
  teams: [RosterEntry[], RosterEntry[]];
  lastMap: MapId | null;
  /** Roster indices fighting in the current 1v1 round. */
  active: [number, number] | null;
  winner: 0 | 1 | null;
}

export interface Pick {
  cls: ClassKey;
  lvl: number;
  ab: 0 | 1 | 2;
  bot?: boolean;
}

/**
 * Match layer shared by offline play and the server.
 * 1v1: each side brings 2 characters, best of 3 rounds, round winner keeps its hp.
 * 2v2: each team has exactly 2 fighters; one round on the classic map.
 */
export function createMatch(
  mode: Mode,
  seed: number,
  teams: [Pick[], Pick[]],
  B: Balance,
): MatchState {
  const entry = (p: Pick): RosterEntry => {
    const maxHp = B.game.CLASSES[p.cls].hp * levelMult(B, p.lvl);
    return {
      cls: p.cls,
      lvl: p.lvl,
      ab: p.ab,
      hp: maxHp,
      maxHp,
      alive: true,
      revived: false,
      bot: !!p.bot,
    };
  };
  return {
    mode,
    rng: createRng(seed),
    round: 0,
    score: [0, 0],
    hist: [],
    teams: [teams[0].map(entry), teams[1].map(entry)],
    lastMap: null,
    active: null,
    winner: null,
  };
}

/** Spin the map wheel: never the same map twice in a row. 2v2 always plays classic. */
export function nextMap(m: MatchState): MapId {
  if (m.mode === '2v2') return 'classic';
  const opts = MAP_IDS.filter((id) => id !== m.lastMap);
  const mp = opts[Math.floor(next(m.rng) * opts.length)]!;
  m.lastMap = mp;
  return mp;
}

/** Bot character choice for a round (prototype `botChoose`): usually the healthiest survivor. */
export function botPick(m: MatchState, team: 0 | 1): number {
  const al = m.teams[team].map((e, i) => ({ e, i })).filter((x) => x.e.alive);
  if (al.length === 1 || next(m.rng) < 0.6)
    return al.sort((a, b) => b.e.hp / b.e.maxHp - a.e.hp / a.e.maxHp)[0]!.i;
  return al[Math.floor(next(m.rng) * al.length)]!.i;
}

const spec = (e: RosterEntry, team: 0 | 1): FighterSpec => ({
  team,
  cls: e.cls,
  lvl: e.lvl,
  ab: e.ab,
  hp: e.hp,
  revived: e.revived,
  bot: e.bot,
});

/** Build the next round. `picks` are roster indices per team (ignored in 2v2). */
export function roundConfig(
  m: MatchState,
  map: MapId,
  picks: [number, number],
  B: Balance,
  opts: { botLevel?: number; fx?: boolean } = {},
): RoundConfig {
  m.round++;
  const fighters =
    m.mode === '2v2'
      ? [...m.teams[0].map((e) => spec(e, 0)), ...m.teams[1].map((e) => spec(e, 1))]
      : [spec(m.teams[0][picks[0]]!, 0), spec(m.teams[1][picks[1]]!, 1)];
  if (m.mode === '1v1') m.active = picks;
  return {
    seed: Math.floor(next(m.rng) * 4294967296),
    mode: m.mode,
    map,
    fighters,
    balance: B,
    ...opts,
  };
}

/** Record a finished round. Returns the match winner once decided. */
export function applyRoundResult(m: MatchState, r: RoundResult): 0 | 1 | null {
  const w = r.winner,
    l = (1 - w) as 0 | 1;
  if (r.surrender || m.mode === '2v2') {
    m.score[w]++;
    m.hist.push(w);
    m.winner = w;
    return w;
  }
  const [a0, a1] = m.active!;
  const idx = [a0, a1];
  const we = m.teams[w][idx[w]!]!,
    le = m.teams[l][idx[l]!]!,
    wf = r.fighters[w]!;
  we.hp = Math.max(1, wf.hp);
  we.revived = wf.revived;
  le.hp = 0;
  le.alive = false;
  m.score[w]++;
  m.hist.push(w);
  if (m.score[w] >= 2 || !m.teams[l].some((e) => e.alive)) m.winner = w;
  return m.winner;
}
