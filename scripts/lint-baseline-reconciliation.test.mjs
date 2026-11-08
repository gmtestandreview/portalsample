import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  classifyDiagnostics,
  reconcileLintBaseline,
  parseInlineExceptionOutput,
} from './lint-baseline-reconciliation.mjs';
import { runLintDiagnostics } from './lint-diagnostics.mjs';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const scratchPath = path.join(
  projectRoot,
  'ClientApp/src/components/Inputs/.remember/tmp/last-ndc.ts',
);

test('classifies diagnostics into disjoint auditable categories', () => {
  const diagnostics = [
    {
      file: scratchPath,
      severity: 'error',
      ruleId: null,
      message: 'was not found by the project service',
      fatal: true,
    },
    {
      file: path.join(projectRoot, 'ClientApp/src/example.tsx'),
      severity: 'error',
      ruleId: 'example/rule',
      message: 'actionable finding',
      fatal: false,
    },
    {
      file: path.join(projectRoot, 'ClientApp/src/api/web-api-client.ts'),
      severity: 'error',
      ruleId: 'generated/rule',
      message: 'generated finding',
      fatal: false,
    },
  ];

  const result = classifyDiagnostics({
    diagnostics,
    projectRoot,
    inlineExceptions: [],
    scratch: {
      exists: true,
      tracked: false,
      diagnostic: diagnostics[0],
    },
  });

  assert.deepEqual(result.counts, {
    total: 3,
    actionable: 1,
    stale: 1,
    accepted: 0,
    generatedVendor: 1,
  });
});

test('parses colon-safe structured matches and classifies the next-line diagnostic', () => {
  const directiveFile = path.join(projectRoot, 'tests/example.ts');
  const directiveText =
    '// eslint-disable-next-line example/rule: rationale: keep this exception';
  const output = `${JSON.stringify({
    type: 'match',
    data: {
      path: { text: 'tests/example.ts' },
      line_number: 12,
      lines: { text: `${directiveText}\n` },
      submatches: [{ start: 2, end: directiveText.length }],
    },
  })}\n`;
  const inlineExceptions = parseInlineExceptionOutput({ projectRoot, output });

  assert.deepEqual(inlineExceptions, [
    {
      file: directiveFile,
      line: 12,
      column: 3,
      text: directiveText,
    },
  ]);

  const diagnostic = {
    file: directiveFile,
    line: 13,
    column: 7,
    severity: 'error',
    ruleId: 'example/rule',
    message: 'example finding',
    fatal: false,
    fixable: false,
  };
  const result = classifyDiagnostics({
    diagnostics: [diagnostic],
    projectRoot,
    inlineExceptions,
    scratch: { exists: false, tracked: false },
  });

  assert.deepEqual(result.counts, {
    total: 1,
    actionable: 0,
    stale: 0,
    accepted: 1,
    generatedVendor: 0,
  });
  assert.deepEqual(result.inventory[0], {
    index: 0,
    category: 'accepted',
    diagnostic,
  });
});

test('reconciles a freshly generated lint report and scratch evidence', async () => {
  const report = await runLintDiagnostics({ projectRoot });
  assert.equal(report.projectRoot, projectRoot);
  const result = reconcileLintBaseline({
    projectRoot,
    report,
  });

  assert.deepEqual(result.counts, {
    total: 235,
    actionable: 234,
    stale: 1,
    accepted: 0,
    generatedVendor: 0,
  });
  assert.equal(result.scratch.exists, statSync(scratchPath).isFile());
  assert.equal(result.scratch.tracked, false);
  const serializedScratchDiagnostic = JSON.parse(
    JSON.stringify(result.scratch.diagnostic),
  );
  assert.deepEqual(serializedScratchDiagnostic, {
    file: scratchPath,
    severity: 'error',
    ruleId: null,
    message:
      `Parsing error: ${scratchPath} was not found by the project service. ` +
      'Consider either including it in the tsconfig.json or including it in allowDefaultProject.\n' +
      'allowDefaultProject is set to [".claude/skills/typescript-expert/scripts/tests/utility-types.test.ts"], which does not match \'ClientApp\\src\\components\\Inputs\\.remember\\tmp\\last-ndc.ts\'.',
    fatal: true,
    fixable: false,
  });
  assert.deepEqual(result.inlineExceptions, []);
  assert.equal(result.diagnosticInventory.length, result.counts.total);
  const categoryCounts = new Map();
  for (const { category } of result.diagnosticInventory) {
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  }
  assert.deepEqual(Object.fromEntries(categoryCounts), {
    actionable: 234,
    stale: 1,
  });
});
