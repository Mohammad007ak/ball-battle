import { describe, expect, it } from 'vitest';
import { createRng, next } from './rng';

describe('rng', () => {
  it('is deterministic for a seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const xs = Array.from({ length: 100 }, () => next(a));
    expect(Array.from({ length: 100 }, () => next(b))).toEqual(xs);
    for (const x of xs) expect(x >= 0 && x < 1).toBe(true);
  });
});
