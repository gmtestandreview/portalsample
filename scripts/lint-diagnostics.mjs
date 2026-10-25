import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ESLint } from 'eslint';

export const LINT_PATTERNS = [
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
];

const severityNames = ['off', 'warning', 'error'];

function compareKeys(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function countBy(values) {
  const counts = new Map();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Object.fromEntries(
    [...counts.entries()].sort(
      ([leftKey, leftCount], [rightKey, rightCount]) =>
        rightCount - leftCount || compareKeys(leftKey, rightKey),
    ),
  );
}

export function createLintReport({
  projectRoot,
  results,
  patterns = LINT_PATTERNS,
  generatedAt = new Date().toISOString(),
}) {
  const diagnostics = results.flatMap(({ filePath, messages }) =>
    messages.map((message) => ({
      file: filePath,
      line: message.line,
      column: message.column,
      endLine: message.endLine,
      endColumn: message.endColumn,
      severity: severityNames[message.severity] ?? 'unknown',
      ruleId: message.ruleId,
      message: message.message,
      nodeType: message.nodeType,
      fatal: message.fatal === true,
      fixable: Boolean(message.fix),
    })),
  );
  const errors = diagnostics.filter(({ severity }) => severity === 'error');
  const warnings = diagnostics.filter(({ severity }) => severity === 'warning');
  const fixable = diagnostics.filter(({ fixable }) => fixable);
  const fixableErrors = fixable.filter(({ severity }) => severity === 'error');
  const fixableWarnings = fixable.filter(
    ({ severity }) => severity === 'warning',
  );
  const byRuleId = countBy(
    diagnostics.flatMap(({ ruleId }) => (ruleId ? [ruleId] : [])),
  );
  const byFile = countBy(
    diagnostics.flatMap(({ file }) => (file ? [file] : [])),
  );
  const withoutRuleId = diagnostics.filter(({ ruleId }) => !ruleId).length;
  const withoutFile = diagnostics.filter(({ file }) => !file).length;
  const fixableWarningsByRuleId = countBy(
    fixableWarnings.flatMap(({ ruleId }) => (ruleId ? [ruleId] : [])),
  );
  const fixableWarningsByFile = countBy(
    fixableWarnings.flatMap(({ file }) => (file ? [file] : [])),
  );

  return {
    schemaVersion: 1,
    generatedAt,
    projectRoot,
    configFile: 'eslint.config.mjs',
    eslintVersion: ESLint.version ?? 'unknown',
    patterns,
    counts: {
      files: results.length,
      total: diagnostics.length,
      errors: errors.length,
      warnings: warnings.length,
      byRuleId,
      withoutRuleId,
      withoutFile,
      fixableTotal: fixable.length,
      fixableErrors: fixableErrors.length,
      fixableWarnings: fixableWarnings.length,
      fixableWarningsByRuleId,
      fixableWarningsByFile,
      byFile,
    },
    diagnostics,
  };
}

export async function runLintDiagnostics({
  projectRoot = process.cwd(),
  patterns = LINT_PATTERNS,
} = {}) {
  const eslint = new ESLint({ cwd: projectRoot });
  const results = await eslint.lintFiles(patterns);
  return createLintReport({ projectRoot, results, patterns });
}

function parseOutputPath(args) {
  const outputFlag = args.indexOf('--out');
  const outputPath = outputFlag >= 0 ? args[outputFlag + 1] : undefined;

  if (outputFlag >= 0 && !outputPath) {
    throw new Error('The --out option requires a file path.');
  }

  return outputPath;
}

export async function main(args = process.argv.slice(2)) {
  let outputPath;
  try {
    outputPath = parseOutputPath(args);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 2;
  }

  const projectRoot = process.cwd();
  const report = await runLintDiagnostics({ projectRoot });
  const serialized = `${JSON.stringify(report, null, 2)}\n`;

  if (outputPath) {
    const resolvedOutput = path.resolve(projectRoot, outputPath);
    // The CLI output path is resolved from the project root before writing.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    mkdirSync(path.dirname(resolvedOutput), { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    writeFileSync(resolvedOutput, serialized, 'utf8');
    process.stdout.write(`ESLint diagnostics written to ${outputPath}\n`);
  } else {
    process.stdout.write(serialized);
  }

  return report.counts.errors > 0 ? 1 : 0;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main().then((exitCode) => {
    process.exitCode = exitCode;
  });
}
