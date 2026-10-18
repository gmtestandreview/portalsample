import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as ts from 'typescript';

export const FAILURE_CODES = Object.freeze({
  CLAIM_DUPLICATE: 'CLAIM_DUPLICATE',
  EVIDENCE_MISSING: 'EVIDENCE_MISSING',
  EXECUTION_INCOMPLETE: 'EXECUTION_INCOMPLETE',
  INVALID_INVOCATION: 'INVALID_INVOCATION',
  MANIFEST_SCHEMA_INVALID: 'MANIFEST_SCHEMA_INVALID',
  REFERENCE_MISSING: 'REFERENCE_MISSING',
  SOURCE_UNRESOLVED: 'SOURCE_UNRESOLVED',
});

const RENDERABLE_CLASSIFICATIONS = new Set([
  'direct',
  'consumer',
  'forwarding',
]);
const CLASSIFICATIONS = new Set([...RENDERABLE_CLASSIFICATIONS, 'nonvisual']);
const MANIFEST_KEYS = ['schemaVersion', 'records'];
const RECORD_KEYS = [
  'source',
  'export',
  'classification',
  'owner',
  'reason',
  'docsOwnerId',
  'states',
  'review',
];
const STATE_KEYS = [
  'name',
  'applicability',
  'outcome',
  'storyFile',
  'storyExport',
  'storyId',
  'assertionFile',
  'assertionExport',
  'assertionMarker',
  'rationale',
];
const REVIEW_KEYS = ['reviewer', 'rationale', 'reviewedSourceDigest'];

const isRecord = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasOwn = (value, key) => Object.hasOwn(value, key);

const sameKeys = (value, expected) => {
  return (
    Object.keys(value).length === expected.length &&
    expected.every((key) => hasOwn(value, key))
  );
};

const nonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const normalisePathSeparators = (value) => value.replaceAll('\\', '/');

const hasRelativePathSegments = (value) =>
  !value.startsWith('/') &&
  !/^[A-Za-z]:\//u.test(value) &&
  !value.split('/').some((part) => part === '' || part === '..');

const isRelativePath = (value) => {
  if (!nonEmptyString(value)) return false;
  const normalised = normalisePathSeparators(value);
  return normalised === value && hasRelativePathSegments(normalised);
};

const error = (code, message, pathValue) => ({
  code,
  message,
  ...(pathValue ? { path: pathValue } : {}),
});

const result = (errors = []) => ({
  ok: errors.length === 0,
  errors,
});

const isRenderable = (classification) =>
  RENDERABLE_CLASSIFICATIONS.has(classification);

const isMeaningfulOutcome = (state) => {
  if (
    !nonEmptyString(state.outcome) ||
    !nonEmptyString(state.assertionMarker)
  ) {
    return false;
  }
  const outcome = state.outcome.trim().toLowerCase();
  const marker = state.assertionMarker.trim().toLowerCase();
  const smokeOutcomes = new Set([
    'mounts',
    'renders',
    'renders without throwing',
    'exists',
    'is present',
    'smoke',
  ]);
  return !smokeOutcomes.has(outcome) && marker !== 'rendered';
};

const validateState = (state, recordPath, errors) => {
  if (!isRecord(state) || !sameKeys(state, STATE_KEYS)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'state must contain exactly the schema v1 state fields',
        recordPath
      )
    );
    return;
  }

  if (!nonEmptyString(state.name) || !nonEmptyString(state.rationale)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'state name and rationale must be non-empty strings',
        recordPath
      )
    );
  }

  if (!['required', 'not-supported'].includes(state.applicability)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'state applicability must be required or not-supported',
        recordPath
      )
    );
    return;
  }

  const hasValidOutcome = nonEmptyString(state.outcome);
  if (!hasValidOutcome) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'state outcome must be a non-empty string',
        recordPath
      )
    );
  }

  if (state.applicability === 'required') {
    if (
      !nonEmptyString(state.storyFile) ||
      !nonEmptyString(state.storyExport) ||
      !nonEmptyString(state.storyId) ||
      !nonEmptyString(state.assertionFile) ||
      !nonEmptyString(state.assertionExport) ||
      !nonEmptyString(state.assertionMarker) ||
      !isMeaningfulOutcome(state)
    ) {
      errors.push(
        error(
          FAILURE_CODES.EVIDENCE_MISSING,
          'required state needs a meaningful outcome and complete story/assertion references',
          recordPath
        )
      );
    }
  } else if (
    state.storyFile !== null ||
    state.storyExport !== null ||
    state.storyId !== null ||
    state.assertionFile !== null ||
    state.assertionExport !== null ||
    state.assertionMarker !== null ||
    !hasValidOutcome ||
    state.outcome.trim().length < 12
  ) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'not-supported state needs a specific rationale and no story/assertion references',
        recordPath
      )
    );
  }
};

const validateRecordDetails = (record, recordPath, errors) => {
  if (!isRelativePath(record.source) || !nonEmptyString(record.export)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'record source and export must identify a relative canonical declaration',
        recordPath
      )
    );
  }
  if (!CLASSIFICATIONS.has(record.classification)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'record classification is not supported by schema v1',
        recordPath
      )
    );
  }
  if (!nonEmptyString(record.owner) || !nonEmptyString(record.reason)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'record owner and reason must be non-empty strings',
        recordPath
      )
    );
  }
  if (!Array.isArray(record.states)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'record states must be an array',
        recordPath
      )
    );
  }
};

const validateRecordReview = (record, recordPath, errors) => {
  if (!isRecord(record.review) || !sameKeys(record.review, REVIEW_KEYS)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'record review must contain exactly the schema v1 review fields',
        recordPath
      )
    );
  } else if (
    !nonEmptyString(record.review.reviewer) ||
    !nonEmptyString(record.review.rationale) ||
    !nonEmptyString(record.review.reviewedSourceDigest)
  ) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'review fields must be non-empty strings',
        recordPath
      )
    );
  }
};

const validateRenderableRecord = (record, recordPath, errors) => {
  if (!nonEmptyString(record.docsOwnerId)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'renderable records need a docsOwnerId',
        recordPath
      )
    );
  }
  if (!Array.isArray(record.states)) return;

  for (const state of record.states) {
    validateState(state, recordPath, errors);
  }
  const requiredStates = record.states.filter(
    (state) => isRecord(state) && state.applicability === 'required'
  );
  if (requiredStates.every((state) => !isMeaningfulOutcome(state))) {
    errors.push(
      error(
        FAILURE_CODES.EVIDENCE_MISSING,
        'renderable records need a meaningful required baseline state',
        recordPath
      )
    );
  }
};

const validateNonvisualRecord = (record, recordPath, errors) => {
  if (record.docsOwnerId !== null) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'nonvisual records must have a null docsOwnerId',
        recordPath
      )
    );
  }
  if (!Array.isArray(record.states) || record.states.length !== 0) {
    errors.push(
      error(
        FAILURE_CODES.EVIDENCE_MISSING,
        'nonvisual records cannot carry UI states',
        recordPath
      )
    );
  }
};

const validateRecord = (record, index, errors) => {
  const recordPath = `records[${index}]`;
  if (!isRecord(record) || !sameKeys(record, RECORD_KEYS)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'record must contain exactly the schema v1 record fields',
        recordPath
      )
    );
    return;
  }

  validateRecordDetails(record, recordPath, errors);
  validateRecordReview(record, recordPath, errors);
  if (isRenderable(record.classification)) {
    validateRenderableRecord(record, recordPath, errors);
  } else {
    validateNonvisualRecord(record, recordPath, errors);
  }
};

export function validateManifest(manifest) {
  const errors = [];
  if (
    !isRecord(manifest) ||
    !sameKeys(manifest, MANIFEST_KEYS) ||
    manifest.schemaVersion !== 1 ||
    !Array.isArray(manifest.records)
  ) {
    return result([
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'manifest must be an object with schemaVersion 1 and records'
      ),
    ]);
  }
  manifest.records.forEach((record, index) =>
    validateRecord(record, index, errors)
  );
  return result(errors);
}

const excludedSourcePath = (filePath) =>
  /(^|\/)(\.claude|\.git|stories?|tests?|__tests__|vendor|external|generated|node_modules|reports|storybook-static|dist)(\/|$)/u.test(
    filePath
  ) || /\.(stories|test|spec|d)\.(tsx?|jsx?)$/u.test(filePath);

const sourceFileKind = (node) =>
  ts.isFunctionDeclaration(node) ||
  ts.isClassDeclaration(node) ||
  ts.isVariableStatement(node)
    ? 'renderable'
    : 'nonvisual';

const exported = (node) =>
  node.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
  ) ?? false;

const declarationName = (node) => {
  if ('name' in node && node.name && ts.isIdentifier(node.name)) {
    return node.name.text;
  }
  return undefined;
};

const moduleSpecifierText = (node) =>
  node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)
    ? node.moduleSpecifier.text
    : undefined;

const isDeclarationStatement = (statement) =>
  ts.isFunctionDeclaration(statement) ||
  ts.isClassDeclaration(statement) ||
  ts.isInterfaceDeclaration(statement) ||
  ts.isTypeAliasDeclaration(statement) ||
  ts.isEnumDeclaration(statement);

const collectDeclaration = (statement, filePath, locals, direct) => {
  const name = declarationName(statement);
  if (name) {
    const entry = {
      export: name,
      kind: sourceFileKind(statement),
    };
    locals.set(name, entry);
    if (exported(statement)) {
      direct.push({ source: filePath, ...entry });
    }
  }
  if (
    exported(statement) &&
    statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword
    )
  ) {
    direct.push({
      source: filePath,
      export: 'default',
      kind: sourceFileKind(statement),
    });
  }
};

const collectVariableStatement = (statement, filePath, locals, direct) => {
  for (const declaration of statement.declarationList.declarations) {
    if (!ts.isIdentifier(declaration.name)) continue;
    const entry = {
      export: declaration.name.text,
      kind: 'renderable',
    };
    locals.set(declaration.name.text, entry);
    if (exported(statement)) {
      direct.push({ source: filePath, ...entry });
    }
  }
};

const collectExportAssignment = (
  statement,
  filePath,
  locals,
  reExports,
  direct
) => {
  if (
    ts.isIdentifier(statement.expression) &&
    locals.has(statement.expression.text)
  ) {
    reExports.push({
      local: statement.expression.text,
      exported: 'default',
    });
    return;
  }
  direct.push({
    source: filePath,
    export: 'default',
    kind: 'renderable',
  });
};

const collectExportDeclaration = (statement, reExports) => {
  const module = moduleSpecifierText(statement);
  const namedExports =
    statement.exportClause && ts.isNamedExports(statement.exportClause)
      ? statement.exportClause.elements
      : undefined;
  if (namedExports) {
    for (const element of namedExports) {
      reExports.push({
        ...(module
          ? { module }
          : { local: element.propertyName?.text ?? element.name.text }),
        ...(module
          ? { imported: element.propertyName?.text ?? element.name.text }
          : {}),
        exported: element.name.text,
      });
    }
  } else if (module) {
    reExports.push({ module, star: true });
  }
};

const parseSourceFile = (file) => {
  const sourceFile = ts.createSourceFile(
    file.path,
    file.content,
    ts.ScriptTarget.Latest,
    true,
    file.path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const locals = new Map();
  const direct = [];
  const reExports = [];

  for (const statement of sourceFile.statements) {
    if (isDeclarationStatement(statement)) {
      collectDeclaration(statement, file.path, locals, direct);
    } else if (ts.isVariableStatement(statement)) {
      collectVariableStatement(statement, file.path, locals, direct);
    } else if (ts.isExportAssignment(statement)) {
      collectExportAssignment(statement, file.path, locals, reExports, direct);
    } else if (ts.isExportDeclaration(statement)) {
      collectExportDeclaration(statement, reExports);
    }
  }

  return { locals, direct, reExports };
};

const resolveModule = (fromPath, specifier, filesByPath) => {
  if (!specifier.startsWith('.')) {
    return { error: 'non-relative module' };
  }
  const fromDirectory = path.posix.dirname(fromPath);
  const requested = path.posix.normalize(
    path.posix.join(fromDirectory, specifier.replace(/\.jsx?$/u, ''))
  );
  const candidates = [
    requested,
    `${requested}.ts`,
    `${requested}.tsx`,
    `${requested}/index.ts`,
    `${requested}/index.tsx`,
  ].filter((candidate) => filesByPath.has(candidate));
  const uniqueCandidates = [...new Set(candidates)];
  if (uniqueCandidates.length !== 1) {
    return {
      error:
        uniqueCandidates.length === 0
          ? 'module not found'
          : 'ambiguous module resolution',
    };
  }
  return { path: uniqueCandidates[0] };
};

const uniqueEntries = (entries) => {
  const unique = [];
  const keys = new Set();
  for (const entry of entries) {
    const key = `${entry.source}|${entry.export}`;
    if (!keys.has(key)) {
      keys.add(key);
      unique.push(entry);
    }
  }
  return unique;
};

const resolveLocalReExport = (filePath, reExport, module, addUnresolved) => {
  const local = module.locals.get(reExport.local);
  if (!local) {
    addUnresolved({
      source: filePath,
      export: reExport.exported,
      reason: 'export declaration has no local source',
    });
    return [];
  }
  return [
    {
      source: filePath,
      ...local,
      export: reExport.exported,
    },
  ];
};

const resolveModuleReExport = ({
  filePath,
  reExport,
  nextStack,
  cache,
  parsed,
  filesByPath,
  addUnresolved,
}) => {
  const resolved = resolveModule(filePath, reExport.module, filesByPath);
  if (!resolved.path) {
    addUnresolved({
      source: filePath,
      export: reExport.star ? '*' : reExport.exported,
      reason: resolved.error,
    });
    return [];
  }

  const targetEntries = visitSourceFile({
    filePath: resolved.path,
    stack: nextStack,
    cache,
    parsed,
    filesByPath,
    addUnresolved,
  });
  if (reExport.star) {
    return targetEntries.filter((entry) => entry.export !== 'default');
  }

  const target = targetEntries.find(
    (entry) => entry.export === reExport.imported
  );
  if (!target) {
    addUnresolved({
      source: filePath,
      export: reExport.exported,
      reason: 're-export target is unresolved',
    });
    return [];
  }
  return [{ ...target, export: target.export }];
};

function visitSourceFile({
  filePath,
  stack = new Set(),
  cache,
  parsed,
  filesByPath,
  addUnresolved,
}) {
  if (cache.has(filePath)) return cache.get(filePath);
  if (stack.has(filePath)) {
    addUnresolved({
      source: filePath,
      export: '*',
      reason: 'cyclic re-export',
    });
    return [];
  }
  const module = parsed.get(filePath);
  if (!module) return [];

  const nextStack = new Set(stack).add(filePath);
  const entries = [...module.direct];
  for (const reExport of module.reExports) {
    const resolvedEntries = reExport.module
      ? resolveModuleReExport({
          filePath,
          reExport,
          nextStack,
          cache,
          parsed,
          filesByPath,
          addUnresolved,
        })
      : resolveLocalReExport(filePath, reExport, module, addUnresolved);
    entries.push(...resolvedEntries);
  }

  const unique = uniqueEntries(entries);
  cache.set(filePath, unique);
  return unique;
}

export function discoverSourceExports({ files }) {
  const sourceFiles = files
    .filter(
      (file) =>
        isRecord(file) &&
        isRelativePath(file.path) &&
        typeof file.content === 'string' &&
        /\.(tsx?|mts|cts)$/u.test(file.path) &&
        !excludedSourcePath(file.path)
    )
    .sort((left, right) => left.path.localeCompare(right.path));
  const filesByPath = new Map(sourceFiles.map((file) => [file.path, file]));
  const parsed = new Map(
    sourceFiles.map((file) => [file.path, parseSourceFile(file)])
  );
  const unresolved = [];
  const cache = new Map();
  const unresolvedKeys = new Set();

  const addUnresolved = (entry) => {
    const key = `${entry.source}|${entry.export}|${entry.reason}`;
    if (!unresolvedKeys.has(key)) {
      unresolvedKeys.add(key);
      unresolved.push({
        source: entry.source,
        export: entry.export,
        code: FAILURE_CODES.SOURCE_UNRESOLVED,
        reason: entry.reason,
      });
    }
  };

  const exports = sourceFiles.flatMap((file) =>
    visitSourceFile({
      filePath: file.path,
      cache,
      parsed,
      filesByPath,
      addUnresolved,
    })
  );
  return { exports: uniqueEntries(exports), unresolved };
}

export function validateSourceClaims(manifest, discovery) {
  const manifestResult = validateManifest(manifest);
  if (!manifestResult.ok) return manifestResult;
  const errors = [];
  if (manifest.records.length === 0) {
    errors.push(
      error(
        FAILURE_CODES.EVIDENCE_MISSING,
        'source inventory must contain at least one reviewed claim'
      )
    );
  }
  for (const unresolved of discovery.unresolved) {
    errors.push(
      error(
        FAILURE_CODES.SOURCE_UNRESOLVED,
        `${unresolved.source}#${unresolved.export}: ${unresolved.reason}`,
        unresolved.source
      )
    );
  }
  const discovered = new Set(
    discovery.exports.map((entry) => `${entry.source}|${entry.export}`)
  );
  const claims = new Set();
  for (const [index, record] of manifest.records.entries()) {
    const key = `${record.source}|${record.export}`;
    if (claims.has(key)) {
      errors.push(
        error(
          FAILURE_CODES.CLAIM_DUPLICATE,
          `duplicate canonical claim ${record.source}#${record.export}`,
          `records[${index}]`
        )
      );
    }
    claims.add(key);
    if (!discovered.has(key)) {
      errors.push(
        error(
          FAILURE_CODES.SOURCE_UNRESOLVED,
          `canonical source/export was not discovered: ${record.source}#${record.export}`,
          record.source
        )
      );
    }
  }
  return result(errors);
}

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts'];

const isPathInside = (root, candidate) => {
  const relative = path.relative(root, candidate);
  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  );
};

const readSourceFiles = (root) => {
  const sourceRoot = path.resolve(root);
  const realSourceRoot = ts.sys.realpath?.(sourceRoot) ?? sourceRoot;

  return ts.sys
    .readDirectory(sourceRoot, SOURCE_EXTENSIONS)
    .map((filePath) => ({
      filePath,
      relativePathValue: path
        .relative(sourceRoot, filePath)
        .replaceAll(path.sep, '/'),
    }))
    .filter(
      ({ relativePathValue }) =>
        isRelativePath(relativePathValue) &&
        !excludedSourcePath(relativePathValue)
    )
    .map(({ filePath, relativePathValue }) => {
      const realFilePath = ts.sys.realpath?.(filePath) ?? filePath;
      if (!isPathInside(realSourceRoot, realFilePath)) {
        throw new Error(
          `SOURCE_UNRESOLVED: symlink input ${relativePathValue}`
        );
      }

      const content = ts.sys.readFile(filePath);
      if (content === undefined) {
        throw new Error(
          `SOURCE_UNRESOLVED: unreadable input ${relativePathValue}`
        );
      }
      return { path: relativePathValue, content };
    });
};

const parseArguments = (argv) => {
  const args = {
    mode: undefined,
    manifest: undefined,
    sourceRoot: undefined,
    index: undefined,
    docsIndex: undefined,
    receipts: undefined,
    writeInventory: false,
  };
  const valueFlags = new Set([
    '--mode',
    '--manifest',
    '--source-root',
    '--index',
    '--docs-index',
    '--receipts',
  ]);

  const remaining = [...argv];
  while (remaining.length > 0) {
    const flag = remaining.shift();
    if (flag === '--write-inventory') {
      args.writeInventory = true;
      continue;
    }

    const value = remaining.shift();
    if (!valueFlags.has(flag) || !value) {
      return {
        ok: false,
        errors: [
          error(
            FAILURE_CODES.INVALID_INVOCATION,
            `invalid or incomplete option: ${flag ?? '(missing)'}`
          ),
        ],
      };
    }

    switch (flag) {
      case '--mode':
        args.mode = value;
        break;
      case '--manifest':
        args.manifest = value;
        break;
      case '--source-root':
        args.sourceRoot = value;
        break;
      case '--index':
        args.index = value;
        break;
      case '--docs-index':
        args.docsIndex = value;
        break;
      case '--receipts':
        args.receipts = value;
        break;
      default:
        return {
          ok: false,
          errors: [
            error(
              FAILURE_CODES.INVALID_INVOCATION,
              `invalid or incomplete option: ${flag ?? '(missing)'}`
            ),
          ],
        };
    }
  }
  if (!['source', 'references', 'closure'].includes(args.mode)) {
    return {
      ok: false,
      errors: [
        error(
          FAILURE_CODES.INVALID_INVOCATION,
          'mode must be source, references, or closure'
        ),
      ],
    };
  }
  if (args.writeInventory && args.mode !== 'references') {
    return {
      ok: false,
      errors: [
        error(
          FAILURE_CODES.INVALID_INVOCATION,
          '--write-inventory is permitted only with references mode'
        ),
      ],
    };
  }
  return { ok: true, args };
};

const failureResult = (errors, exitCode = 1) => ({ exitCode, errors });

const runReferencesMode = (args) => {
  if (!args.index) {
    return failureResult([
      error(
        FAILURE_CODES.REFERENCE_MISSING,
        'references mode requires --index'
      ),
    ]);
  }
  return failureResult([
    error(
      FAILURE_CODES.REFERENCE_MISSING,
      'reference validation is deferred to the T2c integration slice'
    ),
  ]);
};

const runClosureMode = (args) => {
  if (!args.index || !args.docsIndex || !args.receipts) {
    return failureResult([
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'closure mode requires --index, --docs-index, and --receipts'
      ),
    ]);
  }
  return failureResult([
    error(
      FAILURE_CODES.EXECUTION_INCOMPLETE,
      'closure validation is deferred to the T2b/T8 slices'
    ),
  ]);
};

const runMode = (args) => {
  if (args.mode === 'source') return failureResult([], 0);
  if (args.mode === 'references') return runReferencesMode(args);
  return runClosureMode(args);
};

export function main(argv = process.argv.slice(2)) {
  const parsed = parseArguments(argv);
  if (!parsed.ok) return failureResult(parsed.errors, 2);
  const args = parsed.args;
  try {
    const manifestPath =
      args.manifest ?? 'ClientApp/src/storybook/coverageManifest.json';
    const sourceRoot = path.resolve(args.sourceRoot ?? process.cwd());
    const manifestContent = ts.sys.readFile(path.resolve(manifestPath));
    if (manifestContent === undefined) {
      throw new Error(`manifest could not be read: ${manifestPath}`);
    }
    const manifest = JSON.parse(manifestContent);
    const discovery = discoverSourceExports({
      files: readSourceFiles(sourceRoot),
    });
    const sourceResult = validateSourceClaims(manifest, discovery);
    if (!sourceResult.ok) return failureResult(sourceResult.errors);
    return runMode(args);
  } catch (error_) {
    const message = error_ instanceof Error ? error_.message : String(error_);
    const code = /^([A-Z_]+):/u.exec(message)?.[1];
    const knownCode = Object.values(FAILURE_CODES).includes(code)
      ? code
      : FAILURE_CODES.INVALID_INVOCATION;
    const cleanMessage =
      knownCode !== FAILURE_CODES.INVALID_INVOCATION &&
      message.startsWith(`${knownCode}: `)
        ? message.slice(knownCode.length + 2)
        : message;
    return failureResult(
      [error(knownCode, cleanMessage)],
      knownCode === FAILURE_CODES.INVALID_INVOCATION ? 2 : 1
    );
  }
}

const isEntrypoint =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isEntrypoint) {
  const cliResult = main();
  for (const cliError of cliResult.errors) {
    console.error(`${cliError.code}: ${cliError.message}`);
  }
  process.exitCode = cliResult.exitCode;
}
