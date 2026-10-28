import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const MAX_BATCH_FILES = 25;

const PHASE_CLOSURES = {
  'phase-1': [],
  'phase-2': [
    'vitest/prefer-expect-assertions',
    'vitest/require-mock-type-parameters',
    'vitest/max-expects',
  ],
  'phase-3': [
    'vitest/prefer-expect-assertions',
    'vitest/require-mock-type-parameters',
    'vitest/max-expects',
    'vitest/prefer-strict-equal',
    'vitest/prefer-import-in-mock',
    'vitest/no-hooks',
    'vitest/valid-title',
    'vitest/no-conditional-expect',
    'vitest/no-conditional-in-test',
    'vitest/require-top-level-describe',
    'vitest/valid-expect',
    'vitest/unbound-method',
    'vitest/require-hook',
    'vitest/no-identical-title',
    'vitest/no-duplicate-hooks',
    'vitest/prefer-equality-matcher',
    'vitest/require-to-throw-message',
    'vitest/expect-expect',
    'vitest/prefer-hooks-in-order',
  ],
  'phase-4': [
    'vitest/prefer-expect-assertions',
    'vitest/require-mock-type-parameters',
    'vitest/max-expects',
    'vitest/prefer-strict-equal',
    'vitest/prefer-import-in-mock',
    'vitest/no-hooks',
    'vitest/valid-title',
    'vitest/no-conditional-expect',
    'vitest/no-conditional-in-test',
    'vitest/require-top-level-describe',
    'vitest/valid-expect',
    'vitest/unbound-method',
    'vitest/require-hook',
    'vitest/no-identical-title',
    'vitest/no-duplicate-hooks',
    'vitest/prefer-equality-matcher',
    'vitest/require-to-throw-message',
    'vitest/expect-expect',
    'vitest/prefer-hooks-in-order',
    'security/detect-non-literal-fs-filename',
    'security/detect-object-injection',
    'security/detect-non-literal-regexp',
    'security/detect-unsafe-regex',
    'storybook/prefer-pascal-case',
    '@eslint-react/no-unnecessary-use-prefix',
  ],
  'phase-5': [
    'vitest/prefer-expect-assertions',
    'vitest/require-mock-type-parameters',
    'vitest/max-expects',
    'vitest/prefer-strict-equal',
    'vitest/prefer-import-in-mock',
    'vitest/no-hooks',
    'vitest/valid-title',
    'vitest/no-conditional-expect',
    'vitest/no-conditional-in-test',
    'vitest/require-top-level-describe',
    'vitest/valid-expect',
    'vitest/unbound-method',
    'vitest/require-hook',
    'vitest/no-identical-title',
    'vitest/no-duplicate-hooks',
    'vitest/prefer-equality-matcher',
    'vitest/require-to-throw-message',
    'vitest/expect-expect',
    'vitest/prefer-hooks-in-order',
    'security/detect-non-literal-fs-filename',
    'security/detect-object-injection',
    'security/detect-non-literal-regexp',
    'security/detect-unsafe-regex',
    'storybook/prefer-pascal-case',
    '@eslint-react/no-unnecessary-use-prefix',
  ],
};
const PHASE_CLOSURES_BY_ID = new Map(Object.entries(PHASE_CLOSURES));

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function countBy(values) {
  const counts = new Map();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Object.fromEntries(
    [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)),
  );
}

function normalizeFilePath(file, projectRoot) {
  const normalizedFile = file.replaceAll('\\', '/');
  if (!projectRoot) return normalizedFile;

  const normalizedRoot = projectRoot.replaceAll('\\', '/');
  const windowsAbsolute = /^[A-Z]:\//iu.test(normalizedFile);
  if (windowsAbsolute) {
    const relative = path.win32.relative(
      normalizedRoot.replaceAll('/', '\\'),
      normalizedFile.replaceAll('/', '\\'),
    );
    return relative.replaceAll('\\', '/');
  }

  if (path.isAbsolute(normalizedFile)) {
    return path.relative(normalizedRoot, normalizedFile).replaceAll('\\', '/');
  }

  return normalizedFile;
}

const compareCodeUnits = (left, right) => {
  if (left < right) return -1;
  return left > right ? 1 : 0;
};

const phaseTargetWarnings = (id, closedRuleIds, report, baseline) => {
  if (id === 'phase-1') return baseline.warnings;
  if (id === 'phase-5') return 0;
  const closedWarnings = (report.diagnostics ?? []).filter(
    ({ ruleId, severity }) =>
      severity === 'warning' && closedRuleIds.includes(ruleId),
  ).length;
  return baseline.warnings - closedWarnings;
};

export function buildManifest(report, phaseId = 'phase-1') {
  const closedRuleIds = PHASE_CLOSURES_BY_ID.get(phaseId);
  if (!closedRuleIds) {
    throw new Error(`unknown phase: ${phaseId}`);
  }

  const affectedFiles = Object.keys(report.counts.byFile ?? {})
    .map((file) => normalizeFilePath(file, report.projectRoot))
    .sort(compareCodeUnits);
  const phaseDiagnostics = (report.diagnostics ?? []).filter(
    ({ ruleId, severity }) =>
      severity === 'warning' &&
      (phaseId === 'phase-1' || closedRuleIds.includes(ruleId)),
  );
  const phaseFiles = [
    ...new Set(
      (phaseId === 'phase-1'
        ? affectedFiles
        : phaseDiagnostics.map(({ file }) =>
            normalizeFilePath(file, report.projectRoot),
          )
      ).filter(Boolean),
    ),
  ].sort(compareCodeUnits);
  let expectedWarningsBefore = report.counts.warnings;
  const batches = chunk(phaseFiles, MAX_BATCH_FILES).map((files, index) => {
    const expectedWarningReduction = phaseDiagnostics.filter(({ file }) =>
      files.includes(normalizeFilePath(file, report.projectRoot)),
    ).length;
    const expectedWarningsAfter =
      expectedWarningsBefore - expectedWarningReduction;
    const batch = {
      id: `${phaseId}-batch-${index + 1}`,
      phase: phaseId,
      files,
      expectedWarningReduction,
      expectedWarningsBefore,
      expectedWarningsAfter,
      targetedTestCommands: [
        'npm run test:lint:diagnostics',
        'npm run test:lint:remediation',
      ],
      rollbackId: `eslint-remediation-${phaseId}-batch-${index + 1}`,
    };
    expectedWarningsBefore = expectedWarningsAfter;
    return batch;
  });
  const baseline = {
    warnings: report.counts.warnings,
    errors: report.counts.errors,
    files: affectedFiles.length,
  };
  const phaseTargetWarningsById = Object.fromEntries(
    Object.entries(PHASE_CLOSURES).map(([id, closedRuleIds]) => [
      id,
      phaseTargetWarnings(id, closedRuleIds, report, baseline),
    ]),
  );

  return {
    schemaVersion: 1,
    generatedAt: report.generatedAt,
    sourceReport: 'reports/eslint/diagnostics.json',
    maxBatchFiles: MAX_BATCH_FILES,
    baseline,
    phaseTargetNote:
      'Batches are generated from the current report and the selected phase closure rules.',
    phases: [
      {
        id: 'phase-1',
        warnings: baseline.warnings,
        errors: baseline.errors,
        closedRuleIds: PHASE_CLOSURES['phase-1'],
      },
      {
        id: 'phase-2',
        warnings: phaseTargetWarningsById['phase-2'],
        errors: 0,
        closedRuleIds: PHASE_CLOSURES['phase-2'],
      },
      {
        id: 'phase-3',
        warnings: phaseTargetWarningsById['phase-3'],
        errors: 0,
        closedRuleIds: PHASE_CLOSURES['phase-3'],
      },
      {
        id: 'phase-4',
        warnings: phaseTargetWarningsById['phase-4'],
        errors: 0,
        closedRuleIds: PHASE_CLOSURES['phase-4'],
      },
      {
        id: 'phase-5',
        warnings: 0,
        errors: 0,
        closedRuleIds: PHASE_CLOSURES['phase-5'],
      },
    ],
    affectedFiles,
    batches,
  };
}

const countFieldErrors = (report) => {
  const errors = [];
  const missingCountFields = ['total', 'byFile', 'byRuleId'].filter(
    (field) => !(field in report.counts),
  );
  if (missingCountFields.length) {
    errors.push(
      `report is missing required count fields: ${missingCountFields.join(', ')}`,
    );
  }

  if (!Number.isInteger(report.counts.total)) return errors;
  const diagnostics = report.diagnostics ?? [];
  if (report.counts.total !== diagnostics.length) {
    errors.push('report total does not match diagnostics length');
  }
  const diagnosticWarnings = diagnostics.filter(
    ({ severity }) => severity === 'warning',
  ).length;
  const diagnosticErrors = diagnostics.filter(
    ({ severity }) => severity === 'error',
  ).length;
  if (diagnosticWarnings !== report.counts.warnings) {
    errors.push('report warning count does not match diagnostics');
  }
  if (diagnosticErrors !== report.counts.errors) {
    errors.push('report error count does not match diagnostics');
  }
  return errors;
};

const breakdownErrors = (report, diagnosticFiles) => {
  const errors = [];
  if (report.counts.byFile) {
    const reportedFiles = Object.fromEntries(
      Object.entries(report.counts.byFile)
        .map(([file, count]) => [
          normalizeFilePath(file, report.projectRoot),
          count,
        ])
        .sort(([left], [right]) => left.localeCompare(right)),
    );
    if (
      JSON.stringify(reportedFiles) !== JSON.stringify(countBy(diagnosticFiles))
    ) {
      errors.push('report file counts do not match diagnostics');
    }
  }
  if (report.counts.byRuleId) {
    const diagnosticRules = (report.diagnostics ?? [])
      .map(({ ruleId }) => ruleId)
      .filter(Boolean);
    const reportedRules = Object.fromEntries(
      Object.entries(report.counts.byRuleId).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    );
    if (
      JSON.stringify(reportedRules) !== JSON.stringify(countBy(diagnosticRules))
    ) {
      errors.push('report rule counts do not match diagnostics');
    }
  }
  return errors;
};

const phaseCountErrors = (report, phase, phaseId) => {
  const errors = [];
  if (report.counts.warnings !== phase.warnings) {
    errors.push(
      `${phaseId} expects ${phase.warnings} warnings but report contains ${report.counts.warnings}`,
    );
  }
  if (report.counts.errors !== phase.errors) {
    errors.push(
      `${phaseId} expects ${phase.errors} errors but report contains ${report.counts.errors}`,
    );
  }
  return errors;
};

const batchErrors = (manifest, phaseId) => {
  const errors = [];
  for (const batch of manifest.batches ?? []) {
    if (batch.phase !== phaseId) {
      errors.push(
        `batch ${batch.id} belongs to ${batch.phase}, not ${phaseId}`,
      );
    }
    if (batch.files.length > manifest.maxBatchFiles) {
      errors.push(
        `batch ${batch.id} contains ${batch.files.length} files; maximum is ${manifest.maxBatchFiles}`,
      );
    }
    if (
      batch.expectedWarningsBefore - batch.expectedWarningsAfter !==
      batch.expectedWarningReduction
    ) {
      errors.push(
        `batch ${batch.id} has an invalid expected warning reduction`,
      );
    }
    if (!batch.targetedTestCommands?.length) {
      errors.push(`batch ${batch.id} has no targeted test commands`);
    }
  }
  return errors;
};

const unbatchedFileErrors = (report, manifest, phase, phaseId) => {
  const batchedPhaseFiles = new Set(
    (manifest.batches ?? [])
      .filter(({ phase: batchPhase }) => batchPhase === phaseId)
      .flatMap(({ files }) => files),
  );
  const unbatchedPhaseFiles = [
    ...new Set(
      (report.diagnostics ?? [])
        .filter(
          ({ ruleId, severity }) =>
            severity === 'warning' &&
            (phase.closedRuleIds ?? []).includes(ruleId),
        )
        .map(({ file }) => normalizeFilePath(file, report.projectRoot))
        .filter((file) => file && !batchedPhaseFiles.has(file)),
    ),
  ].sort(compareCodeUnits);
  return unbatchedPhaseFiles.length
    ? [
        `phase ${phaseId} rule files are missing from batches: ${unbatchedPhaseFiles.join(', ')}`,
      ]
    : [];
};

const residualErrors = (report, manifest, phase, diagnosticFiles) => {
  const errors = [];
  const affectedFiles = new Set(manifest.affectedFiles ?? []);
  const escapingFiles = new Set(
    diagnosticFiles.filter((file) => file === '..' || file.startsWith('../')),
  );
  for (const file of escapingFiles) {
    errors.push(`diagnostic path escapes project root: ${file}`);
  }
  const residualFiles = [
    ...new Set(
      diagnosticFiles.filter((file) => file && !affectedFiles.has(file)),
    ),
  ].sort(compareCodeUnits);
  if (residualFiles.length) {
    errors.push(`unexpected residual files: ${residualFiles.join(', ')}`);
  }

  const closedRuleIds = new Set(phase.closedRuleIds ?? []);
  const residualRules = [
    ...new Set(
      (report.diagnostics ?? [])
        .map(({ ruleId }) => ruleId)
        .filter((ruleId) => ruleId && closedRuleIds.has(ruleId)),
    ),
  ].sort(compareCodeUnits);
  if (residualRules.length) {
    errors.push(`closed rules still present: ${residualRules.join(', ')}`);
  }
  return errors;
};

export function validateRemediationGate({
  report,
  manifest,
  phaseId = 'phase-5',
}) {
  const phase = manifest.phases?.find(({ id }) => id === phaseId);
  if (!phase) return [`unknown phase: ${phaseId}`];

  const diagnosticFiles = (report.diagnostics ?? [])
    .map(({ file }) => normalizeFilePath(file, report.projectRoot))
    .filter(Boolean);

  return [
    ...countFieldErrors(report),
    ...breakdownErrors(report, diagnosticFiles),
    ...phaseCountErrors(report, phase, phaseId),
    ...batchErrors(manifest, phaseId),
    ...unbatchedFileErrors(report, manifest, phase, phaseId),
    ...residualErrors(report, manifest, phase, diagnosticFiles),
  ];
}

function readReport() {
  return JSON.parse(readFileSync('reports/eslint/diagnostics.json', 'utf8'));
}

function readManifest() {
  return JSON.parse(
    readFileSync('reports/eslint/remediation-batches.json', 'utf8'),
  );
}

export function parsePhaseId(args) {
  const phaseFlag = args.lastIndexOf('--phase');
  if (phaseFlag >= 0 && !args[phaseFlag + 1]) {
    throw new Error('The --phase option requires a phase ID.');
  }
  return phaseFlag >= 0 ? args[phaseFlag + 1] : 'phase-5';
}

export function main(args = process.argv.slice(2)) {
  const phaseId = parsePhaseId(args);

  const report = readReport();
  if (args.includes('--write-manifest')) {
    writeFileSync(
      'reports/eslint/remediation-batches.json',
      `${JSON.stringify(buildManifest(report, phaseId), null, 2)}\n`,
      'utf8',
    );
    process.stdout.write(
      'Lint remediation manifest written to reports/eslint/remediation-batches.json\n',
    );
    return 0;
  }

  const errors = validateRemediationGate({
    report,
    manifest: readManifest(),
    phaseId,
  });
  if (errors.length) {
    process.stderr.write(`${errors.join('\n')}\n`);
    return 1;
  }
  process.stdout.write(`Lint remediation gate passed for ${phaseId}.\n`);
  return 0;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    process.exitCode = main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}
