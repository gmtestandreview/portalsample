import { createRequire } from 'node:module';

import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { readTextFileSync } from '../../helpers/safeTestFilesystem';

vi.mock(
  import('@storybook/addon-vitest/vitest-plugin'),
  () =>
    ({
      storybookTest: vi.fn(() => ({ name: 'storybook-test-mock' })),
    }) satisfies __ExactMockModule<__TestMockModule56>,
);

import { storybookVitestRuntimePlugin } from '../../../vitest.storybook.runtime';

import storybookConfig from '../../../vitest.storybook.config';

const requireFrom = createRequire(import.meta.url);

/**
 * `vitest/node` is a re-export shim; the Vitest class - and therefore `init()`
 * and `standalone()` - lives in a hash-named chunk it imports. Follow the
 * binding rather than the file name so a Vitest rebuild that rehashes the chunk
 * does not silently make these assertions vacuous.
 */
const readVitestClassSource = (): string => {
  const shimPath = requireFrom.resolve('vitest/node');
  const shim = readTextFileSync(shimPath, path.dirname(shimPath));

  const bindingLine = shim
    .split('\n')
    .find((line) => /\bas Vitest\b/.test(line) && line.includes('./chunks/'));

  if (bindingLine === undefined) {
    throw new Error(
      'vitest/node no longer imports the Vitest class from a chunk - re-derive this contract test',
    );
  }

  const chunkSpecifier = /from\s*['"](\.\/chunks\/[^'"]+)['"]/.exec(
    bindingLine,
  )?.[1];

  if (chunkSpecifier === undefined) {
    throw new Error(
      `could not extract the Vitest chunk specifier from: ${bindingLine}`,
    );
  }

  return readTextFileSync(
    path.join(path.dirname(shimPath), chunkSpecifier),
    path.dirname(shimPath),
  );
};

/**
 * @storybook/addon-vitest does not export its node entry point, so
 * `require.resolve` on the deep path throws ERR_PACKAGE_PATH_NOT_EXPORTED.
 * Resolve the package root - which every package exports - and join from there.
 */
const readAddonSource = (): string =>
  readTextFileSync(
    path.join(
      path.dirname(requireFrom.resolve('@storybook/addon-vitest/package.json')),
      'dist/node/vitest.js',
    ),
    path.dirname(requireFrom.resolve('@storybook/addon-vitest/package.json')),
  );

const vitestNodeSource = readVitestClassSource();

const addonSource = readAddonSource();

describe('storybook/Vitest runtime bridge contract', () => {
  it('still has a dependency-owned deprecated call to bridge', () => {
    expect.assertions(1);
    // When this fails, Storybook has moved off init(): delete the init
    // assignment in vitest.storybook.runtime.ts and this test with it.
    expect(addonSource).toContain('this.vitest.init()');
  });
});

describe('storybook/Vitest runtime bridge contract', () => {
  it('wires the runtime compatibility plugin into the Storybook Vitest config', () => {
    expect.assertions(1);
    expect(storybookConfig.plugins).toContain(storybookVitestRuntimePlugin);
  });
});

describe('storybook/Vitest runtime bridge contract', () => {
  it('bridges to an API that Vitest still exposes as the supported replacement', () => {
    expect.assertions(1);
    expect(vitestNodeSource).toMatch(/async standalone\(\)/);
  });
});

describe('storybook/Vitest runtime bridge contract', () => {
  it('bridges to an API that is behaviourally identical to the deprecated one', () => {
    expect.assertions(1);
    // Vitest's own init() is a deprecation log plus a delegation to standalone(),
    // which is what makes the bridge a no-op in behaviour rather than a change.
    expect(vitestNodeSource).toMatch(
      /init\(\)\s*\{[^}]*deprecate[^}]*return this\.standalone\(\)/s,
    );
  });
});
