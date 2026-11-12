import { globSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ESLint } from 'eslint';
import { makeDirectory, pathExists, writeTextFile } from './safe-file-io.mjs';

export const LINT_PATTERNS = [
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
];

const severityNames = ['off', 'warning', 'error'];

const comparePaths = (left, right) => {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
};

function isWithinDirectory(directory, candidate) {
  const relative = path.relative(directory, candidate);
  return (
    relative === '' ||
    (relative !== '..' &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

function relativeFilePath(projectRoot, filePath) {
  return path.relative(projectRoot, filePath).replaceAll(path.sep, '/');
}

function fileExists(filePath, root) {
  return pathExists(filePath, root);
}

export function collectLintTargets({ projectRoot, patterns = LINT_PATTERNS }) {
  const resolvedRoot = path.resolve(projectRoot);
  const matchesByPattern = patterns.map((pattern) => {
    const files = globSync(pattern, {
      cwd: resolvedRoot,
      dot: true,
      nodir: true,
    })
      .map((file) => path.resolve(resolvedRoot, file))
      .sort(comparePaths);

    const outsideRoot = files.find(
      (file) => !isWithinDirectory(resolvedRoot, file),
    );
    if (outsideRoot) {
      throw new Error(
        `Lint pattern ${pattern} matched a file outside the project root: ${outsideRoot}`,
      );
    }

    return { pattern, files };
  });
  const files = [
    ...new Set(matchesByPattern.flatMap(({ files: matches }) => matches)),
  ].sort(comparePaths);

  return { matchesByPattern, files };
}

export function createLintFileAudit({
  projectRoot,
  matchesByPattern,
  targetFiles,
}) {
  const resolvedRoot = path.resolve(projectRoot);
  const missingPatterns = matchesByPattern
    .filter(({ files }) => files.length === 0)
    .map(({ pattern }) => pattern);
  const transientFiles = targetFiles
    .filter((file) => !fileExists(file, resolvedRoot))
    .map((file) => relativeFilePath(resolvedRoot, file));

  return { missingPatterns, transientFiles };
}

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

function compareDiagnosticValues(left, right) {
  if (left === right) return 0;
  if (left === undefined) return -1;
  if (right === undefined) return 1;
  if (left === null) return -1;
  if (right === null) return 1;
  if (left < right) return -1;
  if (left > right) return 1;

  return compareKeys(
    String(JSON.stringify(left)),
    String(JSON.stringify(right)),
  );
}

function compareDiagnostics(left, right) {
  return (
    compareDiagnosticValues(left.file, right.file) ||
    compareDiagnosticValues(left.line, right.line) ||
    compareDiagnosticValues(left.column, right.column) ||
    compareDiagnosticValues(left.endLine, right.endLine) ||
    compareDiagnosticValues(left.endColumn, right.endColumn) ||
    compareDiagnosticValues(left.ruleId, right.ruleId) ||
    compareDiagnosticValues(left.message, right.message) ||
    compareDiagnosticValues(left.nodeType, right.nodeType) ||
    compareDiagnosticValues(left.severity, right.severity) ||
    compareDiagnosticValues(left.fatal, right.fatal) ||
    compareDiagnosticValues(left.fixable, right.fixable)
  );
}

export function createLintReport({
  projectRoot,
  results,
  patterns = LINT_PATTERNS,
  fileAudit = {
    missingPatterns: [],
    transientFiles: [],
  },
  generatedAt = new Date().toISOString(),
}) {
  const diagnostics = results
    .flatMap(({ filePath, messages }) =>
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
    )
    .sort(compareDiagnostics);
  const errors = diagnostics.filter(({ severity }) => severity === 'error');
  const warnings = diagnostics.filter(({ severity }) => severity === 'warning');
  const fatalErrors = diagnostics.filter(({ fatal }) => fatal);
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
      fatalErrors: fatalErrors.length,
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
    fileAudit,
    diagnostics,
  };
}

export async function runLintDiagnostics({
  projectRoot = process.cwd(),
  patterns = LINT_PATTERNS,
} = {}) {
  const eslint = new ESLint({ cwd: projectRoot });
  const { matchesByPattern, files: targetFiles } = collectLintTargets({
    projectRoot,
    patterns,
  });
  const matchedPatterns = matchesByPattern
    .filter(({ files }) => files.length > 0)
    .map(({ pattern }) => pattern);
  let results = [];

  if (matchedPatterns.length > 0) {
    try {
      results = await eslint.lintFiles(matchedPatterns);
    } catch (error) {
      const isMissingFilesError =
        error?.name === 'NoFilesFoundError' ||
        error?.message?.startsWith('No files matching ');
      if (!isMissingFilesError) throw error;
    }
  }

  return createLintReport({
    projectRoot,
    results,
    patterns,
    fileAudit: createLintFileAudit({
      projectRoot,
      matchesByPattern,
      targetFiles,
    }),
  });
}

export function resolveOutputPath(projectRoot, outputPath) {
  const resolvedRoot = path.resolve(projectRoot);
  const resolvedOutput = path.resolve(resolvedRoot, outputPath);
  if (!isWithinDirectory(resolvedRoot, resolvedOutput)) {
    throw new Error('The output path must be inside the project root.');
  }

  return resolvedOutput;
}

function parseOutputPath(args) {
  const outputFlag = args.indexOf('--out');
  const outputPath = outputFlag >= 0 ? args[outputFlag + 1] : undefined;

  if (outputFlag >= 0 && !outputPath) {
    throw new Error('The --out option requires a file path.');
  }

  return outputPath;
}

export async function main(
  args = process.argv.slice(2),
  { projectRoot = process.cwd(), runDiagnostics = runLintDiagnostics } = {},
) {
  let outputPath;
  const failOnWarnings = args.includes('--fail-on-warnings');
  try {
    outputPath = parseOutputPath(args);
    if (outputPath) {
      outputPath = resolveOutputPath(projectRoot, outputPath);
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 2;
  }

  const report = await runDiagnostics({ projectRoot });
  const serialized = `${JSON.stringify(report, null, 2)}\n`;

  if (outputPath) {
    makeDirectory(path.dirname(outputPath), projectRoot);
    writeTextFile(outputPath, serialized, 'utf8', projectRoot);
    process.stdout.write(`ESLint diagnostics written to ${outputPath}\n`);
  } else {
    process.stdout.write(serialized);
  }

  const fileAuditHasIssues = Object.values(report.fileAudit).some(
    (entries) => entries.length > 0,
  );
  return report.counts.errors > 0 ||
    fileAuditHasIssues ||
    (failOnWarnings && report.counts.warnings > 0)
    ? 1
    : 0;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  process.exitCode = await main();
}
