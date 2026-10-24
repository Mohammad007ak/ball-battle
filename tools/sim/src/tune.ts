import type { Balance } from '@chakachak/content';
import type { Rates } from './run';

export interface Change {
  path: string;
  from: number;
  to: number;
}

const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;

/**
 * One auto-tuner step (port of the prototype's idea): nudge hp of classes outside the band and
 * cooldowns of abilities outside the band toward 50%. Returns a new balance and the list of changes.
 */
export function tuneStep(
  B: Balance,
  rates: Rates,
  band: [number, number],
  gain = 0.6,
): { balance: Balance; changes: Change[] } {
  const next: Balance = structuredClone(B);
  const changes: Change[] = [];
  const C = next.game.CLASSES as Record<string, { hp: number; ab: { cd: number }[] }>;
  for (const [k, r] of Object.entries(rates.classes)) {
    if (r.rate >= band[0] && r.rate <= band[1]) continue;
    const c = C[k]!,
      to = round(c.hp * (1 + (0.5 - r.rate) * gain), 0);
    if (to !== c.hp) changes.push({ path: `CLASSES.${k}.hp`, from: c.hp, to });
    c.hp = to;
  }
  for (const [key, r] of Object.entries(rates.abilities)) {
    if (r.rate >= band[0] && r.rate <= band[1]) continue;
    const k = key.slice(0, -1),
      i = Number(key.slice(-1)),
      ab = C[k]!.ab[i]!,
      to = round(ab.cd * (1 + (r.rate - 0.5) * gain * 1.5), 1);
    if (to !== ab.cd) changes.push({ path: `CLASSES.${k}.ab[${i}].cd`, from: ab.cd, to });
    ab.cd = to;
  }
  return { balance: next, changes };
}
