import { describe, expect, it } from 'vitest';
import { atan2, cos, hypot, sin } from './dmath';

describe('deterministic math', () => {
  it('matches Math to ~1e-15 over the angles and vectors a match produces', () => {
    for (let i = -4000; i <= 4000; i++) {
      const x = i * 0.0137;
      expect(Math.abs(sin(x) - Math.sin(x))).toBeLessThan(2e-15);
      expect(Math.abs(cos(x) - Math.cos(x))).toBeLessThan(2e-15);
      const y = Math.sin(i * 0.31) * 400,
        z = Math.cos(i * 0.17) * 400;
      expect(Math.abs(atan2(y, z) - Math.atan2(y, z))).toBeLessThan(2e-15);
      expect(Math.abs(hypot(y, z) - Math.hypot(y, z))).toBeLessThan(1e-12);
    }
    expect([atan2(0, 0), atan2(1, 0), atan2(-1, 0), atan2(0, -1)]).toEqual([
      0,
      Math.PI / 2,
      -Math.PI / 2,
      Math.PI,
    ]);
  });
});
