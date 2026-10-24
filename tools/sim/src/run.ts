import { CLASS_KEYS, type Balance, type ClassKey } from '@chakachak/content';
import { MAP_IDS, createRound, step, type MapId } from '@chakachak/engine';

/** One simulated round: both sides are level-1 bots. */
export interface Job {
  a: ClassKey;
  b: ClassKey;
  abA: 0 | 1 | 2;
  abB: 0 | 1 | 2;
  map: MapId;
  seed: number;
}

/** Wins are counted for the class in slot `a`; 0.5 for a draw-by-timeout tie is not possible (ties go to team 0). */
export interface Outcome {
  job: Job;
  winA: boolean;
  ticks: number;
}

export function runJob(j: Job, B: Balance): Outcome {
  const s = createRound({
    seed: j.seed,
    mode: '1v1',
    map: j.map,
    balance: B,
    fighters: [
      { team: 0, cls: j.a, lvl: 1, ab: j.abA, bot: true },
      { team: 1, cls: j.b, lvl: 1, ab: j.abB, bot: true },
    ],
  });
  while (!s.result) step(s, [], B);
  return { job: j, winA: s.result.winner === 0, ticks: s.tick };
}

/**
 * Round-robin plan: every ordered pair of different classes (so each side/spawn is played by both),
 * on every map. `full` plays all 9 ability pairings; otherwise each pairing gets one random ability pair.
 */
export function plan(opts: { full: boolean; samples: number; seed: number }): Job[] {
  const jobs: Job[] = [];
  let seed = opts.seed;
  const r = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };
  for (let n = 0; n < opts.samples; n++)
    for (const a of CLASS_KEYS)
      for (const b of CLASS_KEYS) {
        if (a === b) continue;
        for (const map of MAP_IDS) {
          if (opts.full) {
            for (const abA of [0, 1, 2] as const)
              for (const abB of [0, 1, 2] as const) jobs.push({ a, b, abA, abB, map, seed: r() });
          } else {
            const x = r();
            jobs.push({
              a,
              b,
              abA: (x % 3) as 0 | 1 | 2,
              abB: (Math.floor(x / 3) % 3) as 0 | 1 | 2,
              map,
              seed: r(),
            });
          }
        }
      }
  return jobs;
}

export interface Rates {
  classes: Record<string, { games: number; wins: number; rate: number }>;
  abilities: Record<string, { games: number; wins: number; rate: number }>;
  maps: Record<string, number>;
  avgSeconds: number;
  rounds: number;
}

export function summarize(out: Outcome[]): Rates {
  const classes: Rates['classes'] = {},
    abilities: Rates['abilities'] = {},
    timeouts: Record<string, number> = {};
  const add = (t: Rates['classes'], k: string, win: boolean) => {
    const e = (t[k] ??= { games: 0, wins: 0, rate: 0 });
    e.games++;
    if (win) e.wins++;
  };
  let ticks = 0;
  for (const o of out) {
    const { a, b, abA, abB } = o.job;
    add(classes, a, o.winA);
    add(classes, b, !o.winA);
    add(abilities, a + abA, o.winA);
    add(abilities, b + abB, !o.winA);
    ticks += o.ticks;
    timeouts[o.job.map] = (timeouts[o.job.map] ?? 0) + o.ticks;
  }
  for (const t of [classes, abilities]) for (const e of Object.values(t)) e.rate = e.wins / e.games;
  const perMap = out.length / MAP_IDS.length;
  const maps = Object.fromEntries(Object.entries(timeouts).map(([k, v]) => [k, v / perMap / 60]));
  return { classes, abilities, maps, avgSeconds: ticks / out.length / 60, rounds: out.length };
}
