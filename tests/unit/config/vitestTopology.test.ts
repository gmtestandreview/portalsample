import { readFileSync } from 'node:fs';

import type { ViteUserConfig } from 'vitest/config';

import { describe, expect, it, vi } from 'vitest';

vi.mock(
  import('@storybook/addon-vitest/vitest-plugin'),
  () =>
    ({
      storybookTest: vi.fn(async () => []),
    }) satisfies __ExactMockModule<__TestMockModule56>,
);

import rootConfig from '../../../vitest.config';

import storybookConfig from '../../../vitest.storybook.config';

import unitConfig from '../../../vitest.unit.config';

/**
 * Characterization of the committed Vitest topology (fix `0d16927`).
 *
 * Vitest 4 ignores a nested `test.projects` container when that config is itself
 * referenced as a root project, which previously caused unit files to be
 * discovered a second time without jsdom. The root config is composition only;
 * each leaf owns its own environment, coverage, browser and worker settings.
 *
 * A failure here means the committed topology drifted — investigate before
 * editing any Vitest configuration.
 */

type TestOptions = NonNullable<ViteUserConfig['test']>;

type PackageScripts = { scripts: Record<string, string> };

const testOptions = (config: ViteUserConfig, label: string): TestOptions => {
  const options = config.test;

  if (options === undefined) {
    throw new Error(`${label} must declare a test block`);
  }

  return options;
};

const root = testOptions(rootConfig, 'vitest.config.ts');

const storybook = testOptions(storybookConfig, 'vitest.storybook.config.ts');

const unit = testOptions(unitConfig, 'vitest.unit.config.ts');

const packageScripts = (): Record<string, string> =>
  (JSON.parse(readFileSync('package.json', 'utf8')) as PackageScripts).scripts;

const vitestConfigContents: Record<string, string> = {
  'vitest.config.ts': readFileSync('vitest.config.ts', 'utf8'),
  'vitest.unit.config.ts': readFileSync('vitest.unit.config.ts', 'utf8'),
};

/** Paths that belong to Playwright, never to a Vitest leaf. */
const foreignTestPaths = [
  '.github/migration-verifier/tests/runtime/checklist.runtime.spec.ts',
  'tests/e2e/example.feature',
  'tests/e2e/steps/example.steps.ts',
];

describe('root Vitest config is composition only', () => {
  it('declares exactly the two leaf projects in order', () => {
    expect.assertions(1);
    expect(root.projects).toEqual([
      './vitest.unit.config.ts',
      './vitest.storybook.config.ts',
    ]);
  });
});

describe('root Vitest config is composition only', () => {
  it('does not own a worker cap that would starve the browser pool', () => {
    expect.assertions(1);
    expect(root.maxWorkers).toBeUndefined();
  });
});
