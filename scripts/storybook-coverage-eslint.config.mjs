import js from '@eslint/js';
import globals from 'globals';

import baseConfig from '../eslint.config.mjs';

export default [
  ...baseConfig,
  js.configs.recommended,
  {
    name: 'nmi/storybook-coverage-mjs',
    files: [
      'scripts/storybook-coverage.mjs',
      'scripts/storybook-coverage-worklist.mjs',
      'scripts/verify-storybook-docs.mjs',
      'scripts/storybook-closure.mjs',
    ],
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
];
