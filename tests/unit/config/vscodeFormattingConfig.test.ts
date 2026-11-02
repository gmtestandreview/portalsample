import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

type VscodeSettings = Record<string, unknown>;

const settings = JSON.parse(
  readFileSync('.vscode/settings.json', 'utf8'),
) as VscodeSettings;

const prettierLanguageIds = [
  'typescript',
  'typescriptreact',
  'javascript',
  'javascriptreact',
  'json',
  'scss',
  'markdown',
  'mdx',
  'yaml',
  'css',
  'html',
  'graphql',
];

const eslintLanguageIds = [
  'typescript',
  'typescriptreact',
  'javascript',
  'javascriptreact',
];

describe('vS Code formatting configuration', () => {
  it('uses Prettier on save for every repository Prettier language', () => {
    expect.assertions(24);

    for (const languageId of prettierLanguageIds) {
      const languageSettings = settings[`[${languageId}]`] as Record<
        string,
        unknown
      >;

      expect(languageSettings?.['editor.defaultFormatter']).toBe(
        'esbenp.prettier-vscode',
      );
      expect(languageSettings?.['editor.formatOnSave']).toBe(true);
    }
  });

  it('keeps workspace settings portable and enables explicit ESLint fixes', () => {
    expect.assertions(8);

    expect(settings['python.defaultInterpreterPath']).toBeUndefined();
    expect(settings['codeQL.createQuery.qlPackLocation']).toBeUndefined();
    expect(settings['vitest.workspaceConfig']).toBeUndefined();
    expect(settings['vitest.vitestPackagePath']).toBeUndefined();

    for (const languageId of eslintLanguageIds) {
      const languageSettings = settings[`[${languageId}]`] as Record<
        string,
        unknown
      >;

      expect(languageSettings?.['editor.codeActionsOnSave']).toStrictEqual({
        'source.fixAll.eslint': 'explicit',
      });
    }
  });
});
