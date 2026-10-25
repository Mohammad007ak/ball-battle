import { defaultBalance as B } from '@chakachak/content';
import { botSkillFor } from '@chakachak/engine';
import { expect, it } from 'vitest';
import { skillWinRate } from './skill';

it('bot skill follows trophies', () => {
  expect(botSkillFor(B, 0)).toBe(-1);
  expect(botSkillFor(B, 400)).toBe(0);
  expect(botSkillFor(B, 1500)).toBeCloseTo(0.5);
  expect(botSkillFor(B, 5000)).toBe(1);
});

it('a max-skill bot beats a skill-0 bot with the same character', () => {
  expect(skillWinRate(1, 0, 1)).toBeGreaterThan(0.56);
}, 60_000);

it('an eased bot (new players) loses clearly to a normal skill-0 bot', () => {
  expect(skillWinRate(0, -1, 1)).toBeGreaterThan(0.65);
}, 60_000);
