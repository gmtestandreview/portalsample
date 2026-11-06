import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

interface PackageManifest {
  scripts: Record<string, string>;
}

const scripts = (
  JSON.parse(readFileSync('package.json', 'utf8')) as PackageManifest
).scripts;

describe('package formatting scripts', () => {
  it('defines repo-wide formatting commands', () => {
    expect.assertions(2);

    expect(scripts['format']).toBe('node scripts/format-contract.mjs --write');
    expect(scripts['format:check']).toBe(
      'node scripts/format-contract.mjs --check',
    );
  });

  it('runs ESLint before formatting in the quality scripts', () => {
    expect.assertions(3);

    expect(scripts['lint:eslint']).toContain('eslint ');
    expect(scripts['lint']).toBe('npm run lint:eslint && npm run format:check');
    expect(scripts['lint:fix']).toBe(
      'npm run lint:eslint -- --fix && npm run format',
    );
  });

  it('defines scoped formatting and reproducible lint and TypeScript diagnostics', () => {
    expect.assertions(3);

    expect(scripts['type-check:diagnostics']).toBe(
      'node scripts/type-check-diagnostics.mjs --out reports/typescript/diagnostics.json',
    );
    expect(scripts['lint:diagnostics']).toBe(
      'node scripts/lint-diagnostics.mjs --out reports/eslint/diagnostics.json',
    );
    expect(scripts['test:lint:diagnostics']).toBe(
      'node --test scripts/lint-diagnostics.test.mjs',
    );
  });

  it('includes Storybook JavaScript sources in the ESLint glob', () => {
    expect.assertions(1);

    expect(scripts['lint:eslint']).toContain(
      '.storybook/**/*.{ts,tsx,js,jsx,mjs}',
    );
  });

  it('covers maintained root, script, and quality sources in the ESLint contract', () => {
    expect.hasAssertions();

    const lintCommand = scripts['lint:eslint'] ?? '';

    expect(lintCommand).toContain('eslint.config.mjs');
    expect(
      [
        'ClientApp/env.js',
        'remark.config.mjs',
        'test-import.mjs',
        'scripts/**/*.{js,mjs,ts,mts}',
        'quality/**/*.{js,mjs,ts,mts}',
        'storybook-vite-policies.ts',
        'runtime-env-fixtures.ts',
        'vitest.shims.d.ts',
      ].every((fragment) => lintCommand.includes(fragment)),
    ).toBe(true);
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
