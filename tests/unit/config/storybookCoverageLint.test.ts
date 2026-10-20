import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const lintConfigPath = path.resolve(
  import.meta.dirname,
  '../../../scripts/storybook-coverage-eslint.config.mjs'
);

const createLinter = () =>
  new ESLint({
    overrideConfigFile: lintConfigPath,
  });

describe('Storybook coverage script lint contract', () => {
  it('loads the task-scoped ESM lint configuration for coverage scripts', async () => {
    const linter = createLinter();
    const [result] = await linter.lintText(
      'const value = 1;\nconsole.error(value);\n',
      { filePath: 'scripts/storybook-closure.mjs' }
    );

    if (!result) throw new Error('ESLint returned no result');
    expect(result.messages).toEqual([]);
  });

  it('reports undefined identifiers instead of silently accepting them', async () => {
    const linter = createLinter();
    const [result] = await linter.lintText('console.error(unknownValue);', {
      filePath: 'scripts/storybook-closure.mjs',
    });

    if (!result) throw new Error('ESLint returned no result');
    expect(result.messages.map(({ ruleId }) => ruleId)).toContain('no-undef');
  });
});
