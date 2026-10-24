import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', 'prototype/**', '**/node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Engine must stay pure and deterministic (CLAUDE.md rule 3).
    files: ['packages/engine/src/**/*.ts'],
    ignores: ['packages/engine/src/**/*.test.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded Rng.' },
      ],
      'no-restricted-globals': [
        'error',
        'Date',
        'performance',
        'setTimeout',
        'setInterval',
        'window',
        'document',
      ],
      'no-restricted-imports': [
        'error',
        { patterns: ['@chakachak/client*', '@chakachak/server*'] },
      ],
    },
  },
);
