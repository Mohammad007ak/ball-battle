import { CLASS_KEYS, defaultBalance, type Balance } from '@chakachak/content';
import { MAP_IDS, createRound, step } from '@chakachak/engine';

/** Win rate of a bot at skill `hi` against the same character at skill `lo` (mirror matches). */
export function skillWinRate(
  hi: number,
  lo: number,
  seeds = 2,
  B: Balance = defaultBalance,
): number {
  let wins = 0,
    games = 0;
  for (const cls of CLASS_KEYS)
    for (const map of MAP_IDS)
      for (let side = 0; side < 2; side++)
        for (let k = 0; k < seeds; k++) {
          const ab = ((games + k) % 3) as 0 | 1 | 2;
          const s = createRound({
            seed: games * 7919 + 1,
            mode: '1v1',
            map,
            balance: B,
            fighters: [
              { team: 0, cls, lvl: 1, ab, bot: true, skill: side ? lo : hi },
              { team: 1, cls, lvl: 1, ab, bot: true, skill: side ? hi : lo },
            ],
          });
          while (!s.result) step(s, [], B);
          if ((s.result.winner === 0) === !side) wins++;
          games++;
        }
  return wins / games;
}
