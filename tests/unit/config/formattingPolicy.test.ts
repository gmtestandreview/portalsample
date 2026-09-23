import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type PackageJson = {
  scripts: Record<string, string>;
  devDependencies: Record<string, string>;
};

const packageJson = JSON.parse(
  readFileSync('package.json', 'utf8')
) as PackageJson;
const prettierIgnore = readFileSync('.prettierignore', 'utf8');

describe('formatter tooling policy', () => {
  it.each([
    'prettier',
    'prettier-eslint',
    'prettier-eslint-cli',
    'eslint-config-prettier',
    'eslint-plugin-prettier',
  ])('keeps %s installed as an explicit development dependency', (name) => {
    expect(packageJson.devDependencies[name]).toBeTruthy();
  });

  it('exposes a read-only prettier-eslint check before the write command', () => {
    expect(packageJson.scripts['format:eslint:check']).toContain(
      'prettier-eslint --list-different'
    );
    expect(packageJson.scripts['format:eslint:fix']).toContain(
      'prettier-eslint --write'
    );
  });

  it('keeps the Prettier and prettier-eslint script scopes aligned', () => {
    const prettierCheck = packageJson.scripts['format:check'];
    const prettierEslintCheck = packageJson.scripts['format:eslint:check'];

    for (const scope of [
      'eslint.config.mjs',
      '*.config.{ts,js}',
      'vitest*.{ts,js}',
      'tests/**/*.{ts,tsx}',
    ]) {
      expect(prettierCheck).toContain(scope);
      expect(prettierEslintCheck).toContain(scope);
    }

    expect(prettierCheck).toContain('.storybook/**/*.{ts,tsx,js,jsx,mdx}');
    expect(prettierEslintCheck).toContain('.storybook/**/*.{ts,tsx,js,jsx}');
    expect(prettierCheck).toContain('ClientApp/src/**/*.{ts,tsx,scss,mdx}');
    expect(prettierEslintCheck).toContain('ClientApp/src/**/*.{ts,tsx}');
  });

  it('checks the ESLint configuration for rules that fight Prettier', () => {
    expect(packageJson.scripts['lint:prettier-config']).toContain(
      'eslint-config-prettier'
    );
    expect(packageJson.scripts['lint:prettier-config']).toContain(
      'ClientApp/src/components/Footer/Footer.tsx'
    );
  });
});

describe('formatter ignore policy', () => {
  it.each([
    'ClientApp/media',
    'ClientApp/src/api/web-api-client.ts',
    'ClientApp/src/external',
    'ClientApp/source-map-http-downloads',
    'ClientApp/webpack',
    'package-lock.json',
  ])('keeps %s out of Prettier traversal', (path) => {
    expect(prettierIgnore).toContain(path);
  });
});
