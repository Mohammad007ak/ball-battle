import { describe, expect, it } from 'vitest';
import { defaultGameData } from './index';

describe('content', () => {
  it('has 21 characters with 3 abilities each', () => {
    const classes = Object.values(defaultGameData.CLASSES);
    expect(classes).toHaveLength(21);
    for (const c of classes) expect(c.ab).toHaveLength(3);
  });
});
