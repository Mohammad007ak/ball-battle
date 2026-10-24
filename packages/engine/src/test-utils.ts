import { defaultBalance, type ClassKey } from '@chakachak/content';
import { createRound, step } from './round';
import type { Fighter, Input, MapId, RoundState } from './types';

export const B = defaultBalance;

/** A round already past the countdown, fighters placed facing each other. */
export function arena(
  a: ClassKey,
  ab: 0 | 1 | 2,
  b: ClassKey = 'frost',
  opts: { seed?: number; map?: MapId; dist?: number; still?: boolean } = {},
): RoundState {
  const s = createRound({
    seed: opts.seed ?? 7,
    mode: '1v1',
    map: opts.map ?? 'classic',
    balance: B,
    fighters: [
      { team: 0, cls: a, lvl: 1, ab },
      { team: 1, cls: b, lvl: 1, ab: 0 },
    ],
  });
  while (s.phase === 'count') step(s, [], B);
  const d = opts.dist ?? 110;
  place(s.f[0]!, 180 - d / 2, 180, 1);
  place(s.f[1]!, 180 + d / 2, 180, -1);
  for (const f of s.f) f.abilityCd = 0;
  if (opts.still) s.f[1]!.freezeT = 99;
  return s;
}

function place(f: Fighter, x: number, y: number, dir: number) {
  f.x = x;
  f.y = y;
  f.vx = 0;
  f.vy = dir * 200;
}

export const run = (s: RoundState, ticks: number, first: Input[] = []) => {
  for (let i = 0; i < ticks && !s.result; i++) step(s, i === 0 ? first : [], B);
  return s;
};

/** Same round twice: once using the ability on the first tick, once not. */
export function compare(
  a: ClassKey,
  ab: 0 | 1 | 2,
  ticks: number,
  opts: { still?: boolean } = {},
  b: ClassKey = 'frost',
) {
  const used = arena(a, ab, b, opts),
    base = arena(a, ab, b, opts);
  run(used, ticks, [{ t: 'ability', fid: 0 }]);
  run(base, ticks);
  return { used, base, A: used.f[0]!, E: used.f[1]!, A0: base.f[0]!, E0: base.f[1]! };
}
