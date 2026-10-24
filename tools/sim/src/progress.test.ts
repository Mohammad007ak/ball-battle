import { defaultBalance as B } from '@chakachak/content';
import { expect, it } from 'vitest';
import { simulateProgress } from './progress';

// Progression gate: a free player should progress over weeks and months, not days.
it('progression is paced over time', () => {
  const r = simulateProgress(B, 240, 1);
  expect(r.teamLevelDay[2]).toBe(1); // first upgrade on day one
  expect(r.teamLevelDay[5]!).toBeGreaterThanOrEqual(5);
  expect(r.teamLevelDay[7]!).toBeGreaterThanOrEqual(60);
  expect(r.teamLevelDay[8] ?? 999).toBeGreaterThanOrEqual(150);
  expect(r.owned[30]!).toBeLessThanOrEqual(12);
});
