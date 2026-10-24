import { CLASS_KEYS, type Balance, type ClassKey } from '@chakachak/content';
import * as EC from '@chakachak/economy';

/**
 * Progression simulator: a free player who plays two sessions a day (08:00 and 20:00, 30 min each,
 * one match every 3 min, 50% wins), opens every ready chest, keeps one chest unlocking (the
 * longest one when leaving), never spends gems, and upgrades whatever it can (team first).
 */
export interface Milestones {
  /** Day the team's best card reached each level (index = level). */
  teamLevelDay: (number | null)[];
  /** Cards owned at the end of days 1, 7, 30, 90. */
  owned: Record<number, number>;
  /** Gems at the end of days 1, 7, 30, 90. */
  gems: Record<number, number>;
  trophiesDay90: number;
}

export function simulateProgress(B: Balance, days: number, seed = 1): Milestones {
  let x = seed;
  const rand = () => (x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296;
  const S = EC.freshProfile(B);
  const out: Milestones = {
    teamLevelDay: Array(B.game.MAXLVL + 1).fill(null),
    owned: {},
    gems: {},
    trophiesDay90: 0,
  };
  const H = 3600_000,
    D = 24 * H,
    sec = (s: EC.ChestSlot) => B.game.CHESTS[s.tier]!.sec;
  const openReady = (now: number) =>
    S.slots.forEach((s, i) => EC.slotState(s, now) === 'ready' && EC.openSlot(B, S, i, now, rand));
  const startUnlock = (now: number, longest: boolean) => {
    if (S.slots.some((s) => EC.slotState(s, now) === 'unlocking')) return;
    const locked = S.slots
      .map((s, i) => [s, i] as const)
      .filter(([s]) => EC.slotState(s, now) === 'locked');
    if (!locked.length) return;
    locked.sort(([a], [b]) => (longest ? sec(b!) - sec(a!) : sec(a!) - sec(b!)));
    EC.unlockSlot(B, S, locked[0]![1], now);
  };
  const upgradeAll = () => {
    let again = true;
    while (again) {
      again = false;
      for (const k of [...S.team, ...CLASS_KEYS] as ClassKey[])
        if (EC.canUpgrade(B, S, k)) {
          EC.upgrade(B, S, k);
          again = true;
        }
    }
  };
  for (let d = 0; d < days; d++) {
    for (const hour of [8, 20]) {
      for (let m = 0; m < 30; m++) {
        const now = d * D + hour * H + m * 60_000;
        openReady(now);
        startUnlock(now, false);
        if (m % 3 === 0 && S.slots.some((s) => !s)) EC.matchResult(B, S, rand() < 0.5, '1v1');
        upgradeAll();
      }
      startUnlock(d * D + hour * H + 30 * 60_000, true);
    }
    const best = Math.max(...S.team.map((k) => S.lv[k]));
    for (let l = 1; l <= best; l++) out.teamLevelDay[l] ??= d + 1;
    if ([1, 7, 30, 90].includes(d + 1)) {
      out.owned[d + 1] = CLASS_KEYS.filter((k) => S.lv[k]).length;
      out.gems[d + 1] = S.gems;
    }
    if (d + 1 === 90) out.trophiesDay90 = S.trophies;
  }
  return out;
}
