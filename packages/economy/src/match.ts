import { CLASS_KEYS, type Balance, type ClassKey } from '@chakachak/content';
import {
  botSkillFor,
  replayMatch,
  type MatchLog,
  type MatchSetup,
  type Pick,
} from '@chakachak/engine';
import { EconomyError, leagueOf, matchResult, type Profile, type Rand } from './index';

/* ---------- matches against bots: the server sets them up and verifies them by replay ---------- */

const pickOf = <T>(a: T[], rand: Rand) => a[Math.floor(rand() * a.length)]!;

/** Bot opponent card at the player's league (prototype `startMatch`: level ≈ 1 + 1.6 × league). */
function botCard(B: Balance, k: ClassKey, li: number, rand: Rand): Pick {
  const G = B.game,
    lvl = Math.max(1, Math.min(G.MAXLVL, Math.round(1 + li * 1.6 + (rand() * 1.6 - 0.6)))),
    abs = [0, 1, 2].filter((i) => lvl >= G.AB_REQ[i]!) as (0 | 1 | 2)[];
  return { cls: k, lvl, ab: pickOf(abs, rand), bot: true };
}

/** Rosters and seed for a new match. */
export function matchSetup(B: Balance, S: Profile, mode: '1v1' | '2v2', rand: Rand): MatchSetup {
  const li = leagueOf(B, S.trophies);
  const mine: Pick[] = S.team.map((k) => ({
    cls: k,
    lvl: S.lv[k],
    ab: (S.lv[k] >= B.game.AB_REQ[S.ab[k]]! ? S.ab[k] : 0) as 0 | 1 | 2,
  }));
  const pool = CLASS_KEYS.filter((k) => mode === '1v1' || !S.team.includes(k));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  const bots = pool.slice(0, mode === '1v1' ? 2 : 3).map((k) => botCard(B, k, li, rand));
  return {
    mode,
    seed: Math.floor(rand() * 4294967296),
    teams: [mine, bots],
    botSkill: botSkillFor(B, S.trophies),
  };
}

/** Verify a finished match by replaying its log, then grant trophies and chest. */
export function matchFinish(B: Balance, S: Profile, setup: MatchSetup, log: MatchLog) {
  let r;
  try {
    r = replayMatch(setup, log, B);
  } catch {
    throw new EconomyError('badLog');
  }
  return { win: r.win, score: r.score, ...matchResult(B, S, r.win, setup.mode) };
}
