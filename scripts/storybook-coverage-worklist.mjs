import path from 'node:path';
import { Buffer } from 'node:buffer';
import { mkdirSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import * as ts from 'typescript';

import {
  FAILURE_CODES,
  discoverSourceExports,
  readSourceFiles,
  validateSourceClaims,
} from './storybook-coverage.mjs';

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts'];

const compareText = (left, right) =>
  Buffer.compare(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'));

const isInventorySourcePath = (filePath) =>
  filePath.startsWith('ClientApp/src/components/') ||
  filePath.startsWith('ClientApp/src/routes/');

const isExcludedSourcePath = (filePath) =>
  /(^|\/)(\.claude|\.git|stories?|tests?|__tests__|vendor|external|generated|node_modules|reports|storybook-static|dist)(\/|$)/u.test(
    filePath
  ) || /\.(stories|test|spec|d)\.(tsx?|jsx?)$/u.test(filePath);

const relativeSourcePath = (root, filePath) =>
  path.relative(root, filePath).replaceAll(path.sep, '/');

const collectCandidateFiles = (root) =>
  ts.sys
    .readDirectory(path.resolve(root), SOURCE_EXTENSIONS)
    .map((filePath) => relativeSourcePath(path.resolve(root), filePath))
    .filter((filePath) => filePath.startsWith('ClientApp/src/'))
    .toSorted(compareText)
    .map((filePath) => ({
      path: filePath,
      reason: isInventorySourcePath(filePath)
        ? isExcludedSourcePath(filePath)
          ? 'excluded by source policy'
          : 'accepted by source policy'
        : 'outside inventory roots',
    }));

const batchForSource = (source) => {
  const parts = source.split('/');
  return parts[2] ?? 'unclassified';
};

const canonicalKey = (entry) => `${entry.source}#${entry.export}`;

const createReviewedEntry = (entry) => ({
  source: entry.source,
  export: entry.export,
  discoveryKind: entry.kind,
  unresolvedReason: null,
  proposedClassification: entry.kind === 'renderable' ? 'direct' : 'nonvisual',
  owner: 'unassigned',
  batch: batchForSource(entry.source),
  status: 'needs-review',
});

const createUnresolvedEntry = (entry) => ({
  source: entry.source,
  export: entry.export,
  discoveryKind: 'unresolved',
  unresolvedReason: entry.reason,
  proposedClassification: null,
  owner: 'unassigned',
  batch: batchForSource(entry.source),
  status: 'blocked',
});

export function buildWorklist({ files, candidateFiles = [] }) {
  const discovery = discoverSourceExports({ files });
  const emptyManifest = { schemaVersion: 1, records: [] };
  const diagnostics = validateSourceClaims(emptyManifest, discovery).errors;
  const acceptedPaths = new Set(files.map((file) => file.path));
  const excludedByPolicy = candidateFiles.filter(
    (candidate) => !acceptedPaths.has(candidate.path)
  );

  const worklist = [
    ...discovery.exports.map(createReviewedEntry),
    ...discovery.unresolved.map(createUnresolvedEntry),
  ].toSorted((left, right) => {
    const keyOrder = compareText(canonicalKey(left), canonicalKey(right));
    return keyOrder || compareText(left.discoveryKind, right.discoveryKind);
  });

  const categoryCounts = {
    direct: worklist.filter(
      (entry) => entry.proposedClassification === 'direct'
    ).length,
    consumer: 0,
    forwarding: 0,
    nonvisual: worklist.filter(
      (entry) => entry.proposedClassification === 'nonvisual'
    ).length,
    unresolved: discovery.unresolved.length,
    excludedByPolicy: excludedByPolicy.length,
  };

  return {
    worklist,
    summary: {
      categoryCounts,
      discoveredExports: discovery.exports.length,
      discoveredExportsWithDiagnostics: diagnostics.filter(
        (entry) =>
          entry.code === FAILURE_CODES.EVIDENCE_MISSING &&
          entry.message.startsWith('discovered export has no reviewed claim:')
      ).length,
      unresolvedEntries: discovery.unresolved.length,
      diagnosticCount: diagnostics.length,
      excludedPaths: excludedByPolicy.map((candidate) => ({ ...candidate })),
    },
  };
}

const writeJson = (filePath, value) => {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const readCandidateFiles = (root) => {
  const sourceRoot = path.resolve(root);
  return collectCandidateFiles(sourceRoot);
};

const parseArguments = (argv) => {
  const args = {
    out: 'reports/storybook-coverage/source-worklist.json',
    summary: 'reports/storybook-coverage/source-summary.json',
    sourceRoot: process.cwd(),
  };
  const valueFlags = new Set(['--out', '--summary', '--source-root']);
  const remaining = [...argv];
  while (remaining.length > 0) {
    const flag = remaining.shift();
    const value = remaining.shift();
    if (!valueFlags.has(flag) || !value) {
      return { ok: false, message: `invalid or incomplete option: ${flag}` };
    }
    if (flag === '--out') args.out = value;
    if (flag === '--summary') args.summary = value;
    if (flag === '--source-root') args.sourceRoot = value;
  }
  return { ok: true, args };
};

export function main(argv = process.argv.slice(2)) {
  const parsed = parseArguments(argv);
  if (!parsed.ok) {
    return {
      exitCode: 2,
      errors: [{ code: 'INVALID_INVOCATION', message: parsed.message }],
    };
  }

  try {
    const files = readSourceFiles(parsed.args.sourceRoot);
    const candidateFiles = readCandidateFiles(parsed.args.sourceRoot);
    const result = buildWorklist({ files, candidateFiles });
    writeJson(path.resolve(parsed.args.out), {
      schemaVersion: 1,
      entries: result.worklist,
      summary: result.summary,
    });
    writeJson(path.resolve(parsed.args.summary), {
      schemaVersion: 1,
      ...result.summary,
    });
    return { exitCode: 0, errors: [], summary: result.summary };
  } catch (error_) {
    return {
      exitCode: 1,
      errors: [
        {
          code: 'WORKLIST_GENERATION_FAILED',
          message: error_ instanceof Error ? error_.message : String(error_),
        },
      ],
    };
  }
}

const isEntrypoint =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isEntrypoint) {
  const result = main();
  for (const entry of result.errors) {
    console.error(`${entry.code}: ${entry.message}`);
  }
  process.exitCode = result.exitCode;
}
