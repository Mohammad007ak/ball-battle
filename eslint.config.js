import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      'prototype/**',
      '**/node_modules/**',
      'apps/client/src/legacy/**',
      'apps/client/android/**',
    ],
  },
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
        {
          object: 'Math',
          property: 'sin',
          message: 'Not bit-identical across JS engines; use ./dmath.',
        },
        {
          object: 'Math',
          property: 'cos',
          message: 'Not bit-identical across JS engines; use ./dmath.',
        },
        {
          object: 'Math',
          property: 'tan',
          message: 'Not bit-identical across JS engines; use ./dmath.',
        },
        {
          object: 'Math',
          property: 'atan',
          message: 'Not bit-identical across JS engines; use ./dmath.',
        },
        {
          object: 'Math',
          property: 'atan2',
          message: 'Not bit-identical across JS engines; use ./dmath.',
        },
        {
          object: 'Math',
          property: 'asin',
          message: 'Not bit-identical across JS engines; use ./dmath.',
        },
        {
          object: 'Math',
          property: 'acos',
          message: 'Not bit-identical across JS engines; use ./dmath.',
        },
        {
          object: 'Math',
          property: 'hypot',
          message: 'Not bit-identical across JS engines; use ./dmath.',
        },
        {
          object: 'Math',
          property: 'exp',
          message: 'Not bit-identical across JS engines; use ./dmath.',
        },
        {
          object: 'Math',
          property: 'log',
          message: 'Not bit-identical across JS engines; use ./dmath.',
        },
        {
          object: 'Math',
          property: 'pow',
          message: 'Not bit-identical across JS engines; use ./dmath.',
        },
        {
          object: 'Math',
          property: 'cbrt',
          message: 'Not bit-identical across JS engines; use ./dmath.',
        },
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
