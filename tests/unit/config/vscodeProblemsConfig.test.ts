import { spawnSync } from 'node:child_process';

import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { readTextFileSync } from '../../helpers/safeTestFilesystem';

const repoRoot = path.resolve(__dirname, '../../..');

function readJson<T>(relativePath: string): T {
  return JSON.parse(
    readTextFileSync(path.join(repoRoot, relativePath), repoRoot),
  ) as T;
}

describe('vS Code Problems configuration', () => {
  it('keeps workspace diagnostics aligned with clean-code Problems visibility', () => {
    expect.assertions(1);
    const settings = readJson<Record<string, unknown>>('.vscode/settings.json');
    expect(settings['sonarlint.focusOnNewCode']).toBe(true);
  });
});

describe('vS Code Problems configuration', () => {
  it('keeps workspace diagnostics aligned with clean-code Problems visibility', () => {
    expect.assertions(1);
    const settings = readJson<Record<string, unknown>>('.vscode/settings.json');
    expect(settings['eslint.enable']).toBe(true);
  });
});

describe('vS Code Problems configuration', () => {
  it('keeps workspace diagnostics aligned with clean-code Problems visibility', () => {
    expect.assertions(1);
    const settings = readJson<Record<string, unknown>>('.vscode/settings.json');
    expect(settings['eslint.lintTask.enable']).toBe(true);
  });
});

describe('vS Code Problems configuration', () => {
  it('keeps workspace diagnostics aligned with clean-code Problems visibility', () => {
    expect.assertions(1);
    const settings = readJson<Record<string, unknown>>('.vscode/settings.json');
    expect(settings['eslint.workingDirectories']).toEqual([
      { mode: 'location' },
    ]);
  });
});

describe('vS Code Problems configuration', () => {
  it('keeps workspace diagnostics aligned with clean-code Problems visibility', () => {
    expect.assertions(1);
    const settings = readJson<Record<string, unknown>>('.vscode/settings.json');
    expect(settings['eslint.validate']).toEqual([
      'javascript',
      'javascriptreact',
      'typescript',
      'typescriptreact',
    ]);
  });
});
