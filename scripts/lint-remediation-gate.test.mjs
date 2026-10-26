import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildManifest,
  parsePhaseId,
  validateRemediationGate,
} from './lint-remediation-gate.mjs';

const manifest = {
  maxBatchFiles: 25,
  affectedFiles: ['tests/a.test.ts'],
  phases: [{ id: 'phase-1', warnings: 1, errors: 0 }],
  baseline: { warnings: 1, errors: 0 },
  batches: [
    {
      id: 'phase-1-batch-1',
      phase: 'phase-1',
      files: ['tests/a.test.ts'],
      expectedWarningReduction: 0,
      expectedWarningsBefore: 1,
      expectedWarningsAfter: 1,
      targetedTestCommands: ['npm run test:lint:remediation'],
    },
  ],
};

test('rejects a report whose warning target does not match the phase', () => {
  const errors = validateRemediationGate({
    report: {
      counts: {
        warnings: 2,
        errors: 0,
        total: 2,
        byFile: { 'tests/a.test.ts': 2 },
        byRuleId: { 'demo/rule': 2 },
      },
      diagnostics: [
        { file: 'tests/a.test.ts', severity: 'warning', ruleId: 'demo/rule' },
        { file: 'tests/a.test.ts', severity: 'warning', ruleId: 'demo/rule' },
      ],
    },
    manifest,
    phaseId: 'phase-1',
  });

  assert.deepEqual(errors, [
    'phase-1 expects 1 warnings but report contains 2',
  ]);
});

test('rejects oversized batches and files outside the manifest', () => {
  const errors = validateRemediationGate({
    report: {
      counts: {
        warnings: 2,
        errors: 0,
        total: 2,
        byFile: { 'tests/a.test.ts': 1, 'tests/unexpected.test.ts': 1 },
        byRuleId: { 'demo/rule': 2 },
      },
      diagnostics: [
        { file: 'tests/a.test.ts', severity: 'warning', ruleId: 'demo/rule' },
        {
          file: 'tests/unexpected.test.ts',
          severity: 'warning',
          ruleId: 'demo/rule',
        },
      ],
    },
    manifest: {
      ...manifest,
      phases: [{ ...manifest.phases[0], warnings: 2 }],
      batches: [
        {
          ...manifest.batches[0],
          id: 'too-large',
          files: Array.from({ length: 26 }, (_, i) => `tests/${i}.test.ts`),
        },
      ],
    },
    phaseId: 'phase-1',
  });

  assert.deepEqual(errors, [
    'batch too-large contains 26 files; maximum is 25',
    'unexpected residual files: tests/unexpected.test.ts',
  ]);
});

test('accepts a final zero-warning report', () => {
  const errors = validateRemediationGate({
    report: {
      counts: {
        warnings: 0,
        errors: 0,
        total: 0,
        byFile: {},
        byRuleId: {},
      },
      diagnostics: [],
    },
    manifest: {
      ...manifest,
      phases: [{ id: 'phase-5', warnings: 0, errors: 0, closedRuleIds: [] }],
      batches: [],
    },
    phaseId: 'phase-5',
  });

  assert.deepEqual(errors, []);
});

test('builds a portable manifest with batch metadata from absolute diagnostics', () => {
  const generated = buildManifest({
    projectRoot: 'C:/checkout',
    generatedAt: '2026-10-25T00:00:00.000Z',
    counts: {
      warnings: 1,
      errors: 0,
      byFile: { 'C:/checkout/tests/a.test.ts': 1 },
    },
  });

  assert.deepEqual(generated.affectedFiles, ['tests/a.test.ts']);
  assert.deepEqual(generated.batches[0], {
    id: 'phase-1-batch-1',
    phase: 'phase-1',
    files: ['tests/a.test.ts'],
    expectedWarningReduction: 0,
    expectedWarningsBefore: 1,
    expectedWarningsAfter: 1,
    targetedTestCommands: [
      'npm run test:lint:diagnostics',
      'npm run test:lint:remediation',
    ],
    rollbackId: 'eslint-remediation-phase-1-batch-1',
  });
});

test('builds Phase 2 batches from closed-rule diagnostics with sequential deltas', () => {
  const generated = buildManifest(
    {
      projectRoot: 'C:/checkout',
      generatedAt: '2026-10-25T00:00:00.000Z',
      counts: {
        warnings: 5,
        errors: 0,
        byFile: {
          'C:/checkout/scripts/a.mjs': 1,
          'C:/checkout/tests/a.test.ts': 2,
          'C:/checkout/tests/b.test.ts': 2,
        },
      },
      diagnostics: [
        {
          file: 'C:/checkout/scripts/a.mjs',
          severity: 'warning',
          ruleId: 'security/detect-object-injection',
        },
        {
          file: 'C:/checkout/tests/a.test.ts',
          severity: 'warning',
          ruleId: 'vitest/max-expects',
        },
        {
          file: 'C:/checkout/tests/a.test.ts',
          severity: 'warning',
          ruleId: 'vitest/require-mock-type-parameters',
        },
        {
          file: 'C:/checkout/tests/b.test.ts',
          severity: 'warning',
          ruleId: 'vitest/prefer-expect-assertions',
        },
        {
          file: 'C:/checkout/tests/b.test.ts',
          severity: 'warning',
          ruleId: 'vitest/max-expects',
        },
      ],
    },
    'phase-2',
  );

  assert.deepEqual(generated.affectedFiles, [
    'scripts/a.mjs',
    'tests/a.test.ts',
    'tests/b.test.ts',
  ]);
  assert.equal(generated.phases.find(({ id }) => id === 'phase-2').warnings, 1);
  assert.deepEqual(generated.batches, [
    {
      id: 'phase-2-batch-1',
      phase: 'phase-2',
      files: ['tests/a.test.ts', 'tests/b.test.ts'],
      expectedWarningReduction: 4,
      expectedWarningsBefore: 5,
      expectedWarningsAfter: 1,
      targetedTestCommands: [
        'npm run test:lint:diagnostics',
        'npm run test:lint:remediation',
      ],
      rollbackId: 'eslint-remediation-phase-2-batch-1',
    },
  ]);
});

test('keeps dynamic phase targets when the default manifest phase is used', () => {
  const generated = buildManifest(
    {
      counts: {
        warnings: 2,
        errors: 0,
        byFile: {
          'tests/a.test.ts': 1,
          'scripts/a.mjs': 1,
        },
      },
      diagnostics: [
        {
          file: 'tests/a.test.ts',
          severity: 'warning',
          ruleId: 'vitest/max-expects',
        },
        {
          file: 'scripts/a.mjs',
          severity: 'warning',
          ruleId: 'security/detect-object-injection',
        },
      ],
    },
    'phase-5',
  );

  assert.equal(generated.phases.find(({ id }) => id === 'phase-2').warnings, 1);
  assert.equal(generated.phases.find(({ id }) => id === 'phase-4').warnings, 0);
  assert.equal(generated.phases.find(({ id }) => id === 'phase-5').warnings, 0);
});

test('rejects an internally inconsistent diagnostics report', () => {
  const errors = validateRemediationGate({
    report: {
      counts: {
        warnings: 1,
        errors: 0,
        total: 1,
        byFile: {},
        byRuleId: {},
      },
      diagnostics: [],
    },
    manifest,
    phaseId: 'phase-1',
  });

  assert.deepEqual(errors, [
    'report total does not match diagnostics length',
    'report warning count does not match diagnostics',
  ]);
});

test('matches absolute report paths against relative manifest paths', () => {
  const errors = validateRemediationGate({
    report: {
      projectRoot: 'C:/checkout',
      counts: {
        warnings: 1,
        errors: 0,
        total: 1,
        byFile: { 'C:/checkout/tests/a.test.ts': 1 },
        byRuleId: { 'demo/rule': 1 },
      },
      diagnostics: [
        {
          file: 'C:/checkout/tests/a.test.ts',
          severity: 'warning',
          ruleId: 'demo/rule',
        },
      ],
    },
    manifest,
    phaseId: 'phase-1',
  });

  assert.deepEqual(errors, []);
});

test('uses the last phase flag so npm callers can override the package default', () => {
  assert.equal(
    parsePhaseId(['--phase', 'phase-1', '--phase', 'phase-2']),
    'phase-2',
  );
});

test('rejects inconsistent file and rule aggregates', () => {
  const errors = validateRemediationGate({
    report: {
      counts: {
        warnings: 1,
        errors: 0,
        total: 1,
        byFile: {},
        byRuleId: {},
      },
      diagnostics: [
        { file: 'tests/a.test.ts', severity: 'warning', ruleId: 'demo/rule' },
      ],
    },
    manifest,
    phaseId: 'phase-1',
  });

  assert.deepEqual(errors, [
    'report file counts do not match diagnostics',
    'report rule counts do not match diagnostics',
  ]);
});

test('rejects diagnostic paths outside the project root', () => {
  const errors = validateRemediationGate({
    report: {
      projectRoot: 'C:/checkout',
      counts: {
        warnings: 1,
        errors: 0,
        total: 1,
        byFile: { 'C:/outside/escape.test.ts': 1 },
        byRuleId: { 'demo/rule': 1 },
      },
      diagnostics: [
        {
          file: 'C:/outside/escape.test.ts',
          severity: 'warning',
          ruleId: 'demo/rule',
        },
      ],
    },
    manifest,
    phaseId: 'phase-1',
  });

  assert.deepEqual(errors, [
    'diagnostic path escapes project root: ../outside/escape.test.ts',
    'unexpected residual files: ../outside/escape.test.ts',
  ]);
});

test('rejects reports that omit required aggregate fields', () => {
  const errors = validateRemediationGate({
    report: {
      counts: { warnings: 1, errors: 0 },
      diagnostics: [
        { file: 'tests/a.test.ts', severity: 'warning', ruleId: 'demo/rule' },
      ],
    },
    manifest,
    phaseId: 'phase-1',
  });

  assert.deepEqual(errors, [
    'report is missing required count fields: total, byFile, byRuleId',
  ]);
});
