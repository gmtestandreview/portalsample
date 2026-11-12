import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { ESLint } from 'eslint';

import {
  collectLintTargets,
  createLintFileAudit,
  createLintReport,
  LINT_PATTERNS,
  main,
  resolveOutputPath,
  runLintDiagnostics,
} from './lint-diagnostics.mjs';
import { readTextFile, writeTextFile } from './safe-file-io.mjs';

test('matches the configured lint target globs', () => {
  assert.deepEqual(LINT_PATTERNS, [
    'ClientApp/env.js',
    'ClientApp/src/**/*.{ts,tsx}',
    '.storybook/**/*.{ts,tsx,js,jsx,mjs}',
    'tests/**/*.{ts,tsx}',
    'scripts/**/*.{js,mjs,ts,mts}',
    'quality/**/*.{js,mjs,ts,mts}',
    '*.config.{ts,mts,js}',
    'eslint.config.mjs',
    'remark.config.mjs',
    'storybook-vite-policies.ts',
    'runtime-env-fixtures.ts',
    'test-import.mjs',
    'vitest.shims.d.ts',
    'vitest*.{ts,js}',
  ]);
});

test('reports missing patterns and transient files instead of filtering them', () => {
  const projectRoot = mkdtempSync(path.join(os.tmpdir(), 'lint-diagnostics-'));

  try {
    const { files, matchesByPattern } = collectLintTargets({
      projectRoot,
      patterns: ['missing/**/*.ts'],
    });

    assert.deepEqual(files, []);
    const missingAudit = createLintFileAudit({
      projectRoot,
      matchesByPattern,
      targetFiles: files,
    });
    assert.deepEqual(missingAudit, {
      missingPatterns: ['missing/**/*.ts'],
      transientFiles: [],
    });
    const transientFile = path.join(projectRoot, 'transient.ts');
    const audit = createLintFileAudit({
      projectRoot,
      matchesByPattern: [{ pattern: 'transient.ts', files: [transientFile] }],
      targetFiles: [transientFile],
      results: [],
    });

    assert.deepEqual(audit, {
      missingPatterns: [],
      transientFiles: ['transient.ts'],
    });
  } finally {
    rmSync(projectRoot, { recursive: true, force: true });
  }
});

test('checks transient paths literally when they contain glob metacharacters', () => {
  const projectRoot = mkdtempSync(path.join(os.tmpdir(), 'lint-literal-'));
  const literalFile = path.join(projectRoot, 'literal[1].ts');

  try {
    writeTextFile(
      literalFile,
      'export const value = 1;\n',
      'utf8',
      projectRoot,
    );

    const audit = createLintFileAudit({
      projectRoot,
      matchesByPattern: [{ pattern: 'literal[1].ts', files: [literalFile] }],
      targetFiles: [literalFile],
    });

    assert.deepEqual(audit, {
      missingPatterns: [],
      transientFiles: [],
    });
  } finally {
    rmSync(projectRoot, { recursive: true, force: true });
  }
});

test('runLintDiagnostics reports missing configured patterns', async () => {
  const report = await runLintDiagnostics({
    projectRoot: process.cwd(),
    patterns: ['missing/**/*.ts'],
  });

  assert.deepEqual(report.fileAudit, {
    missingPatterns: ['missing/**/*.ts'],
    transientFiles: [],
  });
});

test('runLintDiagnostics passes only matched patterns to ESLint', async () => {
  const projectRoot = mkdtempSync(path.join(os.tmpdir(), 'lint-patterns-'));
  const matchedFile = path.join(projectRoot, 'matched.ts');
  const missingPattern = 'missing.ts';
  writeTextFile(
    path.join(projectRoot, 'eslint.config.mjs'),
    'export default [{}];\n',
    undefined,
    projectRoot,
  );
  writeTextFile(
    matchedFile,
    'export const value = 1;\n',
    undefined,
    projectRoot,
  );
  const originalLintFiles = ESLint.prototype.lintFiles;
  let lintedPatterns;
  ESLint.prototype.lintFiles = async (patterns) => {
    lintedPatterns = patterns;
    return [{ filePath: matchedFile, messages: [] }];
  };

  try {
    const report = await runLintDiagnostics({
      projectRoot,
      patterns: ['matched.ts', missingPattern],
    });

    assert.deepEqual(lintedPatterns, ['matched.ts']);
    assert.deepEqual(report.fileAudit, {
      missingPatterns: [missingPattern],
      transientFiles: [],
    });
  } finally {
    ESLint.prototype.lintFiles = originalLintFiles;
    rmSync(projectRoot, { recursive: true, force: true });
  }
});

test('main fails when the diagnostics report contains audit findings', async () => {
  const projectRoot = mkdtempSync(path.join(os.tmpdir(), 'lint-main-audit-'));
  const reportPath = 'diagnostics.json';
  const report = {
    counts: { errors: 0, warnings: 0 },
    fileAudit: { missingPatterns: ['missing/**/*.ts'], transientFiles: [] },
  };

  try {
    const exitCode = await main(['--out', reportPath], {
      projectRoot,
      runDiagnostics: async () => report,
    });

    assert.equal(exitCode, 1);
    assert.deepEqual(
      JSON.parse(readTextFile(path.join(projectRoot, reportPath), projectRoot)),
      report,
    );
  } finally {
    rmSync(projectRoot, { recursive: true, force: true });
  }
});

test('main default wiring fails for a temporary project with missing targets', async () => {
  const projectRoot = mkdtempSync(path.join(os.tmpdir(), 'lint-main-default-'));
  const outputPath = 'diagnostics.json';
  writeTextFile(
    path.join(projectRoot, 'eslint.config.mjs'),
    'export default [{}];\n',
    'utf8',
    projectRoot,
  );

  try {
    const exitCode = await main(['--out', outputPath], { projectRoot });
    const report = JSON.parse(
      readTextFile(path.join(projectRoot, outputPath), projectRoot),
    );

    assert.equal(exitCode, 1);
    assert.ok(report.fileAudit.missingPatterns.length > 0);
    assert.deepEqual(report.fileAudit.transientFiles, []);
  } finally {
    rmSync(projectRoot, { recursive: true, force: true });
  }
});

test('preserves fatal parser diagnostics as errors', () => {
  const report = createLintReport({
    projectRoot: 'fixture-root',
    generatedAt: '2026-01-01T00:00:00.000Z',
    results: [
      {
        filePath: 'broken.ts',
        messages: [
          {
            fatal: true,
            severity: 2,
            ruleId: null,
            message: 'Parsing error: Unexpected token',
          },
        ],
      },
    ],
  });

  assert.equal(report.counts.errors, 1);
  assert.equal(report.counts.fatalErrors, 1);
  assert.deepEqual(report.diagnostics[0], {
    file: 'broken.ts',
    line: undefined,
    column: undefined,
    endLine: undefined,
    endColumn: undefined,
    severity: 'error',
    ruleId: null,
    message: 'Parsing error: Unexpected token',
    nodeType: undefined,
    fatal: true,
    fixable: false,
  });
});

test('orders diagnostics deterministically by file and source location', () => {
  const report = createLintReport({
    projectRoot: 'fixture-root',
    generatedAt: '2026-01-01T00:00:00.000Z',
    results: [
      {
        filePath: 'fixture-b.ts',
        messages: [{ line: 2, column: 1, severity: 2, message: 'second' }],
      },
      {
        filePath: 'fixture-a.ts',
        messages: [
          { line: 3, column: 1, severity: 2, message: 'third' },
          { line: 1, column: 1, severity: 2, message: 'first' },
        ],
      },
    ],
  });

  assert.deepEqual(
    report.diagnostics.map(({ file, line, message }) => [file, line, message]),
    [
      ['fixture-a.ts', 1, 'first'],
      ['fixture-a.ts', 3, 'third'],
      ['fixture-b.ts', 2, 'second'],
    ],
  );
});

test('serializes reports identically regardless of diagnostic input ordering', () => {
  const reportOptions = {
    projectRoot: 'fixture-root',
    generatedAt: '2026-01-01T00:00:00.000Z',
  };
  const nullRuleDiagnostic = {
    line: 1,
    column: 1,
    severity: 2,
    ruleId: null,
    message: 'same diagnostic',
  };
  const omittedRuleDiagnostic = {
    line: 1,
    column: 1,
    severity: 2,
    message: 'same diagnostic',
  };
  const serialize = (messages) =>
    JSON.stringify(
      createLintReport({
        ...reportOptions,
        results: [{ filePath: 'fixture.ts', messages }],
      }),
    );

  assert.equal(
    serialize([nullRuleDiagnostic, omittedRuleDiagnostic]),
    serialize([omittedRuleDiagnostic, nullRuleDiagnostic]),
  );
});

test('keeps output paths inside the repository root', () => {
  const projectRoot = mkdtempSync(path.join(os.tmpdir(), 'lint-output-'));

  try {
    assert.equal(
      resolveOutputPath(projectRoot, 'reports/eslint/diagnostics.json'),
      path.join(projectRoot, 'reports/eslint/diagnostics.json'),
    );
    assert.throws(
      () => resolveOutputPath(projectRoot, '../outside.json'),
      /inside the project root/,
    );
  } finally {
    rmSync(projectRoot, { recursive: true, force: true });
  }
});

test('rejects an escaping output path before linting', async () => {
  const originalLintFiles = ESLint.prototype.lintFiles;
  let lintCalled = false;
  ESLint.prototype.lintFiles = async () => {
    lintCalled = true;
    return [];
  };

  try {
    assert.equal(await main(['--out', '../outside.json']), 2);
    assert.equal(lintCalled, false);
  } finally {
    ESLint.prototype.lintFiles = originalLintFiles;
  }
});

test('groups diagnostics by rule ID and file', () => {
  const report = createLintReport({
    projectRoot: 'fixture-root',
    generatedAt: '2026-01-01T00:00:00.000Z',
    results: [
      {
        filePath: 'fixture-a.ts',
        messages: [
          {
            severity: 2,
            ruleId: 'demo/error',
            message: 'error',
            fix: { range: [0, 1], text: '' },
          },
          {
            severity: 1,
            ruleId: 'demo/warning',
            message: 'warning',
            fix: { range: [1, 2], text: '' },
          },
          { severity: 2, ruleId: 'demo/error', message: 'second error' },
          { severity: 2, ruleId: null, message: 'unscoped' },
        ],
      },
      {
        filePath: 'fixture-b.ts',
        messages: [
          {
            severity: 1,
            ruleId: 'demo/warning',
            message: 'second warning',
          },
          {
            severity: 1,
            ruleId: 'demo/alpha',
            message: 'alpha',
            fix: { range: [2, 3], text: '' },
          },
          { severity: 1, ruleId: '<none>', message: 'literal key' },
        ],
      },
    ],
  });

  assert.deepEqual(report.counts.byRuleId, {
    'demo/error': 2,
    'demo/warning': 2,
    '<none>': 1,
    'demo/alpha': 1,
  });
  assert.deepEqual(Object.keys(report.counts.byRuleId), [
    'demo/error',
    'demo/warning',
    '<none>',
    'demo/alpha',
  ]);
  assert.deepEqual(report.counts.byFile, {
    'fixture-a.ts': 4,
    'fixture-b.ts': 3,
  });
  assert.deepEqual(Object.keys(report.counts.byFile), [
    'fixture-a.ts',
    'fixture-b.ts',
  ]);
  assert.equal(report.counts.withoutRuleId, 1);
  assert.equal(report.counts.withoutFile, 0);
  assert.equal(report.counts.fixableTotal, 3);
  assert.equal(report.counts.fixableErrors, 1);
  assert.equal(report.counts.fixableWarnings, 2);
  assert.deepEqual(report.counts.fixableWarningsByRuleId, {
    'demo/alpha': 1,
    'demo/warning': 1,
  });
  assert.deepEqual(report.counts.fixableWarningsByFile, {
    'fixture-a.ts': 1,
    'fixture-b.ts': 1,
  });
});

test('fails when --fail-on-warnings sees a warning-only report', async () => {
  const originalLintFiles = ESLint.prototype.lintFiles;
  ESLint.prototype.lintFiles = async () => [
    {
      filePath: 'fixture.ts',
      messages: [
        {
          severity: 1,
          ruleId: 'demo/warning',
          message: 'warning',
        },
      ],
    },
  ];

  try {
    const exitCode = await main(['--fail-on-warnings']);
    assert.equal(exitCode, 1);
  } finally {
    ESLint.prototype.lintFiles = originalLintFiles;
  }
});
