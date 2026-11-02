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
    expect.hasAssertions();

    const settings = readJson<Record<string, unknown>>('.vscode/settings.json');

    expect({
      focusOnNewCode: settings['sonarlint.focusOnNewCode'],
      eslintEnabled: settings['eslint.enable'],
      lintTaskEnabled: settings['eslint.lintTask.enable'],
      workingDirectories: settings['eslint.workingDirectories'],
      validate: settings['eslint.validate'],
      tsdkPath: settings['js/ts.tsdk.path'],
    }).toStrictEqual({
      focusOnNewCode: true,
      eslintEnabled: true,
      lintTaskEnabled: true,
      workingDirectories: [{ mode: 'location' }],
      validate: [
        'javascript',
        'javascriptreact',
        'typescript',
        'typescriptreact',
      ],
      tsdkPath: './node_modules/typescript/lib',
    });
  });

  it('recommends extensions that contribute repository diagnostics', () => {
    expect.hasAssertions();

    const extensions = readJson<{ recommendations: string[] }>(
      '.vscode/extensions.json',
    );

    expect(extensions.recommendations).toStrictEqual(
      expect.arrayContaining([
        'ms-playwright.playwright',
        'alexkrechik.cucumberautocomplete',
        'charliermarsh.ruff',
        'dbaeumer.vscode-eslint',
        'sonarsource.sonarlint-vscode',
      ]),
    );
  });

  it('has a VS Code rule-citation adapter script', () => {
    expect.hasAssertions();

    const script = readTextFileSync(
      path.join(repoRoot, 'scripts/vscode-rule-citation-problems.mjs'),
      repoRoot,
    );

    expect(script).toContain('verify-rule-citations.mjs');
    expect(script).toContain('formatProblem');
    expect(script).toContain('MISCITED');
    expect(script).toContain('UNRESOLVED');
  });

  it('the rule-citation adapter emits no false diagnostics for a clean citation report', () => {
    expect.hasAssertions();

    const result = spawnSync(
      process.execPath,
      ['scripts/vscode-rule-citation-problems.mjs'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
      },
    );

    // The repository citation report is currently clean. The adapter must
    // preserve that clean status rather than inventing VS Code Problems.
    expect(result.status).toBe(0);

    const diagnosticLines = result.stdout
      .split(/\r?\n/)
      .filter(
        (line) => line.includes('): warning ') || line.includes('): error '),
      );

    expect(diagnosticLines).toStrictEqual([]);
  });

  it('keeps formatted detail citations visible in machine-readable output', () => {
    expect.hasAssertions();

    const result = spawnSync(
      process.execPath,
      ['scripts/verify-rule-citations.mjs', '--json'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
      },
    );

    // The JSON report remains valid even when the checker reports unresolved
    // citations; callers need the report to display those diagnostics.
    expect(result.status).not.toBeNull();

    const report = JSON.parse(result.stdout) as {
      results: Array<{ where: string; cited: number | null }>;
    };

    expect(
      report.results.some(
        (result) =>
          result.where === 'detail' && typeof result.cited === 'number',
      ),
    ).toBe(true);
  });

  it('defines VS Code tasks that feed diagnostics into Problems', () => {
    expect.hasAssertions();

    const tasks = readJson<{
      version: string;
      tasks: Array<{
        label: string;
        type?: string;
        script?: string;
        command?: string;
        args?: string[];
        dependsOn?: string[];
        dependsOrder?: string;
        problemMatcher?: unknown;
      }>;
    }>('.vscode/tasks.json');

    const byLabel = new Map(tasks.tasks.map((task) => [task.label, task]));

    expect(byLabel.get('diagnostics: type-check')).toMatchObject({
      type: 'npm',
      script: 'type-check',
      problemMatcher: ['$tsc'],
    });
    expect(byLabel.get('diagnostics: eslint')).toMatchObject({
      type: 'npm',
      script: 'lint',
      problemMatcher: ['$eslint-stylish'],
    });
    expect(byLabel.get('diagnostics: rule citations')).toMatchObject({
      type: 'process',
      command: 'node',
      args: ['scripts/vscode-rule-citation-problems.mjs'],
    });
    expect(byLabel.get('diagnostics: all')?.dependsOn).toStrictEqual([
      'diagnostics: type-check',
      'diagnostics: eslint',
      'diagnostics: rule citations',
      'diagnostics: sonar backlog',
    ]);
    expect(byLabel.get('diagnostics: all')?.dependsOrder).not.toBe('sequence');
  });

  it('rED: the combined diagnostics task does not fail fast before later problem sources run', () => {
    expect.hasAssertions();

    const tasks = readJson<{
      tasks: Array<{
        label: string;
        dependsOn?: string[];
        dependsOrder?: string;
      }>;
    }>('.vscode/tasks.json');

    const allDiagnostics = tasks.tasks.find(
      (task) => task.label === 'diagnostics: all',
    );

    expect(allDiagnostics?.dependsOn).toStrictEqual([
      'diagnostics: type-check',
      'diagnostics: eslint',
      'diagnostics: rule citations',
      'diagnostics: sonar backlog',
    ]);
    expect(allDiagnostics?.dependsOrder).not.toBe('sequence');
  });

  it('gREEN: exposes every repository diagnostic source as a runnable VS Code task', () => {
    expect.hasAssertions();

    const tasks = readJson<{ tasks: Array<{ label: string }> }>(
      '.vscode/tasks.json',
    );
    const labels = tasks.tasks.map((task) => task.label);

    expect(labels).toStrictEqual(
      expect.arrayContaining([
        'diagnostics: type-check',
        'diagnostics: eslint',
        'diagnostics: rule citations',
        'diagnostics: sonar backlog',
        'diagnostics: all',
      ]),
    );
  });

  it('aMBER: keeps Sonar editor Problems clean-code focused while requiring a full backlog task', () => {
    expect.hasAssertions();

    const settings = readJson<Record<string, unknown>>('.vscode/settings.json');
    const tasks = readJson<{ tasks: Array<{ label: string }> }>(
      '.vscode/tasks.json',
    );

    expect(settings['sonarlint.focusOnNewCode']).toBe(true);
    expect(
      tasks.tasks.some((task) => task.label === 'diagnostics: sonar backlog'),
    ).toBe(true);
  });
});
