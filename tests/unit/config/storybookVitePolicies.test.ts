import { describe, expect, it } from 'vitest';

import {
  APPLICATION_VENDOR_CHUNK_GROUPS,
  SASS_DEPRECATIONS_TO_SILENCE,
  SASS_PREPROCESSOR_OPTIONS,
} from '../../../storybook-vite-policies';

describe('shared Storybook and Vite policies', () => {
  it('defines one complete Sass deprecation policy', () => {
    expect.assertions(3);

    expect(SASS_PREPROCESSOR_OPTIONS.quietDeps).toBe(true);

    expect([...SASS_DEPRECATIONS_TO_SILENCE]).toStrictEqual([
      'import',
      'global-builtin',
      'color-functions',
      'if-function',
    ]);

    expect(new Set(SASS_DEPRECATIONS_TO_SILENCE).size).toBe(
      SASS_DEPRECATIONS_TO_SILENCE.length,
    );
  });

  it('defines one cross-platform application vendor chunk policy', () => {
    expect.assertions(2);

    expect(
      APPLICATION_VENDOR_CHUNK_GROUPS.map(({ name }) => name),
    ).toStrictEqual(['react-runtime', 'auth', 'forms', 'ui', 'utilities']);

    expect(
      APPLICATION_VENDOR_CHUNK_GROUPS.every(({ test: groupMatcher }) =>
        groupMatcher.source.includes('[\\\\/]node_modules[\\\\/]'),
      ),
    ).toBe(true);
  });
});
