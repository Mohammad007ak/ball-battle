import { describe, expect, it } from 'vitest';
import { defaultGameData } from './index';

describe('content', () => {
  it('has 21 characters with 3 abilities each', () => {
    const classes = Object.values(defaultGameData.CLASSES);
    expect(classes).toHaveLength(21);
    for (const c of classes) expect(c.ab).toHaveLength(3);
  });
});

describe('engine data', () => {
  it('has params for every ability', async () => {
    const { defaultEngineData, CLASS_KEYS } = await import('./index');
    for (const k of CLASS_KEYS)
      for (let i = 0; i < 3; i++) expect(defaultEngineData.abilities).toHaveProperty(k + i);
  });
});
