import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { LINT_PATTERNS, runLintDiagnostics } from './lint-diagnostics.mjs';

export const SCRATCH_RELATIVE_PATH =
  'ClientApp/src/components/Inputs/.remember/tmp/last-ndc.ts';

const LINTED_DIRECTORIES = [
  'ClientApp/src',
  '.storybook',
  'tests',
  'scripts',
  'quality',
];

const LINTED_ROOT_FILES = [
  'eslint.config.mjs',
  'remark.config.mjs',
  'storybook-vite-policies.ts',
  'runtime-env-fixtures.ts',
  'test-import.mjs',
  'vitest.shims.d.ts',
  'vitest.config.ts',
  'vitest.storybook.config.ts',
  'vitest.storybook.coverage.ts',
  'vitest.storybook.runtime.ts',
  'vitest.storybook.setup.ts',
  'vitest.unit.config.ts',
  'vitest.setup.ts',
  'vite.config.mts',
  'playwright.config.ts',
  'playwright.storybook.config.ts',
  'playwright.api.config.ts',
  'ClientApp/env.js',
];

const GENERATED_OR_VENDOR_SEGMENTS = new Set([
  'dist',
  'external',
  'node_modules',
  'source-map-http-downloads',
  'storybook-static',
  'vendor',
]);

function absolutePath(projectRoot, file) {
  return path.resolve(projectRoot, file);
}

function normalisePath(file) {
  return path.normalize(file).toLowerCase();
}

function isGeneratedOrVendorFile(file) {
  const segments = file.split(path.sep).map((segment) => segment.toLowerCase());
  return (
    segments.some((segment) => GENERATED_OR_VENDOR_SEGMENTS.has(segment)) ||
    path.basename(file).toLowerCase() === 'web-api-client.ts'
  );
}

export function findInlineExceptions(projectRoot) {
  const args = [
    '--hidden',
    '--no-ignore',
    '--json',
    '--glob',
    '!**/node_modules/**',
    '--glob',
    '!**/external/**',
    '--glob',
    '!**/source-map-http-downloads/**',
    '--glob',
    '!**/vendor/**',
    '--glob',
    '!**/dist/**',
    '--glob',
    '!**/storybook-static/**',
    '^\\s*(?://|/\\*|\\*)\\s*eslint-disable-next-line\\b',
    ...LINTED_DIRECTORIES,
    ...LINTED_ROOT_FILES,
  ];

  let output;
  try {
    output = execFileSync('rg', args, {
      cwd: projectRoot,
      encoding: 'utf8',
    });
  } catch (error) {
    if (error.status === 1) return [];
    throw error;
  }

  return parseInlineExceptionOutput({ projectRoot, output });
}

export function parseInlineExceptionOutput({ projectRoot, output }) {
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .flatMap((line) => {
      const record = JSON.parse(line);
      if (record.type !== 'match') return [];

      const { data } = record;
      return [
        {
          file: absolutePath(projectRoot, data.path.text),
          line: data.line_number,
          column: (data.submatches[0]?.start ?? 0) + 1,
          text: data.lines.text.replace(/\r?\n$/, ''),
        },
      ];
    });
}

function isTracked(projectRoot, relativePath) {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', '--', relativePath], {
      cwd: projectRoot,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function readScratchEvidence({ projectRoot, diagnostics, scratch }) {
  const file = absolutePath(projectRoot, SCRATCH_RELATIVE_PATH);
  const diagnostic = diagnostics.find(
    ({ file: diagnosticFile }) =>
      diagnosticFile && normalisePath(diagnosticFile) === normalisePath(file),
  );
  return {
    path: SCRATCH_RELATIVE_PATH,
    ...scratch,
    diagnostic,
  };
}

function isStaleScratchDiagnostic(diagnostic, scratch) {
  return (
    scratch.exists &&
    !scratch.tracked &&
    diagnostic === scratch.diagnostic &&
    diagnostic.ruleId === null &&
    diagnostic.fatal === true &&
    diagnostic.message.includes('was not found by the project service')
  );
}

function isAcceptedDiagnostic(diagnostic, inlineExceptions) {
  return inlineExceptions.some(
    ({ file, line }) =>
      normalisePath(file) === normalisePath(diagnostic.file) &&
      diagnostic.line === line + 1,
  );
}

function categoryForDiagnostic({
  diagnostic,
  projectRoot,
  inlineExceptions,
  scratch,
}) {
  const file = absolutePath(projectRoot, diagnostic.file);
  if (isGeneratedOrVendorFile(file)) return 'generatedVendor';
  if (isStaleScratchDiagnostic(diagnostic, scratch)) return 'stale';
  if (isAcceptedDiagnostic(diagnostic, inlineExceptions)) return 'accepted';
  return 'actionable';
}

export function classifyDiagnostics({
  diagnostics,
  projectRoot,
  inlineExceptions,
  scratch,
}) {
  const counts = {
    total: diagnostics.length,
    actionable: 0,
    stale: 0,
    accepted: 0,
    generatedVendor: 0,
  };
  const inventory = diagnostics.map((diagnostic, index) => {
    const category = categoryForDiagnostic({
      diagnostic,
      projectRoot,
      inlineExceptions,
      scratch,
    });
    switch (category) {
      case 'actionable':
        counts.actionable += 1;
        break;
      case 'stale':
        counts.stale += 1;
        break;
      case 'accepted':
        counts.accepted += 1;
        break;
      case 'generatedVendor':
        counts.generatedVendor += 1;
        break;
      default:
        throw new Error(`Unknown diagnostic category: ${category}`);
    }
    return { index, category, diagnostic };
  });

  return { counts, inventory };
}

export function reconcileLintBaseline({
  projectRoot,
  report,
  scratchEvidence,
}) {
  const project = path.resolve(projectRoot);
  const diagnostics = report.diagnostics ?? [];
  const inlineExceptions = findInlineExceptions(project);
  const scratch = readScratchEvidence({
    projectRoot: project,
    diagnostics,
    scratch: scratchEvidence ?? {
      exists: pathExists(project, SCRATCH_RELATIVE_PATH),
      tracked: isTracked(project, SCRATCH_RELATIVE_PATH),
    },
  });
  const classification = classifyDiagnostics({
    diagnostics,
    projectRoot: project,
    inlineExceptions,
    scratch,
  });

  return {
    schemaVersion: 1,
    reportPatterns: report.patterns ?? LINT_PATTERNS,
    counts: classification.counts,
    diagnosticInventory: classification.inventory,
    scratch,
    inlineExceptions,
  };
}

function pathExists(projectRoot, relativePath) {
  try {
    execFileSync(
      'rg',
      ['--files', '--hidden', '--no-ignore', '--glob', relativePath],
      {
        cwd: projectRoot,
        stdio: 'ignore',
      },
    );
    return true;
  } catch (error) {
    if (error.status === 1) return false;
    throw error;
  }
}

export async function main({ projectRoot = process.cwd() } = {}) {
  const report = await runLintDiagnostics({ projectRoot });
  const result = reconcileLintBaseline({ projectRoot, report });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.counts.total ===
    result.counts.actionable +
      result.counts.stale +
      result.counts.accepted +
      result.counts.generatedVendor
    ? 0
    : 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  process.exitCode = await main();
}
