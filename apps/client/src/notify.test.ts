import { describe, expect, it } from 'vitest';
import { plan } from './notify';

const names = ['چوبی', 'نقره‌ای'];

describe('chest notifications', () => {
  it('one per unlocking chest, on the phone clock', () => {
    const p = plan(
      [{ tier: 1, end: 10_000 }, null, { tier: 0, end: null }, null],
      names,
      4_000,
      1_000,
    );
    expect(p[0]).toMatchObject({ id: 100, at: 9_000 });
    expect(p[0]!.body).toContain('نقره‌ای');
    expect(p.filter((n) => n.id >= 100)).toHaveLength(1);
  });

  it('skips chests already ready; idle reminder a day later', () => {
    const p = plan([{ tier: 0, end: 3_000 }, null, null, null], names, 4_000, 0);
    expect(p).toHaveLength(1);
    expect(p[0]).toMatchObject({ id: 1, at: 4_000 + 24 * 3600_000 });
  });

  it('nudges to unlock when chests sit locked', () => {
    const p = plan([{ tier: 0, end: null }, null, null, null], names, 0, 0);
    expect(p[0]!.body).toContain('قفل');
  });
});
