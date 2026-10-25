import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

type PackageManifest = {
  scripts: Record<string, string>;
};

const scripts = (
  JSON.parse(readFileSync('package.json', 'utf8')) as PackageManifest
).scripts;

describe('package formatting scripts', () => {
  it('defines repo-wide formatting commands', () => {
    expect.assertions(3);

    expect(scripts.format).toBe('prettier --write .');
    expect(scripts['format:check']).toBe('prettier --check .');
    expect(scripts['lint:prettier']).toBe('npm run format:check');
  });

  it('runs ESLint before formatting in the quality scripts', () => {
    expect.assertions(3);

    expect(scripts['lint:eslint']).toContain('eslint ');
    expect(scripts.lint).toBe('npm run lint:eslint && npm run format:check');
    expect(scripts['lint:fix']).toBe(
      'npm run lint:eslint -- --fix && npm run format',
    );
  });

  it('includes Storybook JavaScript sources in the ESLint glob', () => {
    expect.assertions(1);

    expect(scripts['lint:eslint']).toContain(
      '.storybook/**/*.{ts,tsx,js,jsx,mjs}',
    );
  });

  it('routes migration-check through the Storybook build wrapper', () => {
    expect.assertions(3);

    expect(scripts['build-storybook']).toContain(
      'scripts/run-storybook-build.mjs build',
    );
    expect(scripts['migration-check']).toContain('npm run build-storybook');
    expect(scripts['migration-check']).not.toContain(
      './node_modules/storybook/dist/bin/dispatcher.js build',
    );
  });
});
