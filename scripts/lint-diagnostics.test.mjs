import assert from 'node:assert/strict';
import test from 'node:test';

import { ESLint } from 'eslint';

import { createLintReport, main } from './lint-diagnostics.mjs';

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
