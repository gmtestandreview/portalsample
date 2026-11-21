import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

type VscodeSettings = Record<string, unknown>;

const settings = JSON.parse(
  readFileSync('.vscode/settings.json', 'utf8'),
) as VscodeSettings;

const oxfmtLanguageIds = [
  'typescript',
  'typescriptreact',
  'javascript',
  'javascriptreact',
  'json',
  'jsonc',
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

const formatOnSaveLanguageIds = [
  'json',
  'jsonc',
  'scss',
  'markdown',
  'mdx',
  'yaml',
  'css',
  'html',
  'graphql',
];

describe('vS Code formatting configuration', () => {
  it('uses Oxfmt on save for every repository formatter language', () => {
    // Literal count required by vitest/prefer-expect-assertions; must equal
    // oxfmtLanguageIds.length (one assertion per language).
    expect.assertions(13);

    for (const languageId of oxfmtLanguageIds) {
      const languageSettings = settings[`[${languageId}]`] as Record<
        string,
        unknown
      >;

      expect(languageSettings['editor.defaultFormatter']).toBe(
        'oxc.oxc-vscode',
      );
    }
  });

  it('formats non-ESLint languages on save', () => {
    // Literal count required by vitest/prefer-expect-assertions; must equal
    // formatOnSaveLanguageIds.length * 2 (two assertions per language).
    expect.assertions(18);

    for (const languageId of formatOnSaveLanguageIds) {
      const languageSettings = settings[`[${languageId}]`] as Record<
        string,
        unknown
      >;

      expect(languageSettings['editor.formatOnSave']).toBe(true);
      expect(languageSettings['editor.formatOnSaveMode']).toBe('file');
    }
  });

  it('keeps workspace settings portable', () => {
    expect.assertions(4);

    expect(settings['python.defaultInterpreterPath']).toBeUndefined();
    expect(settings['codeQL.createQuery.qlPackLocation']).toBeUndefined();
    expect(settings['vitest.workspaceConfig']).toBeUndefined();
    expect(settings['vitest.vitestPackagePath']).toBeUndefined();
  });

  it('enables explicit ESLint fixes for every ESLint language', () => {
    // Literal count required by vitest/prefer-expect-assertions; must equal
    // eslintLanguageIds.length * 2 (two assertions per language).
    expect.assertions(8);

    for (const languageId of eslintLanguageIds) {
      const languageSettings = settings[`[${languageId}]`] as Record<
        string,
        unknown
      >;

      expect(languageSettings['editor.formatOnSave']).toBe(false);
      expect(languageSettings['editor.codeActionsOnSave']).toStrictEqual({
        'source.format.oxc': 'always',
        'source.fixAll.eslint': 'explicit',
      });
    }
  });
});
