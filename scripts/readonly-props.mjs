import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const slash = (value) => value.replaceAll('\\', '/');
const isFunction = (node) =>
  ts.isFunctionDeclaration(node) ||
  ts.isFunctionExpression(node) ||
  ts.isArrowFunction(node);

function componentName(node) {
  if (node.name && ts.isIdentifier(node.name)) return node.name.text;
  let owner = node.parent;
  while (ts.isCallExpression(owner) || ts.isParenthesizedExpression(owner)) {
    owner = owner.parent;
  }
  if (ts.isVariableDeclaration(owner) && ts.isIdentifier(owner.name)) {
    return owner.name.text;
  }
  if (
    ts.isExportAssignment(owner) ||
    node.modifiers?.some((item) => item.kind === ts.SyntaxKind.DefaultKeyword)
  )
    return 'DefaultExport';
  return '';
}

// Nested render callbacks alone do not make the enclosing function a component.
function hasOwnJsx(node) {
  if (!node) return false;
  if (isFunction(node)) return false;
  if (
    ts.isJsxElement(node) ||
    ts.isJsxSelfClosingElement(node) ||
    ts.isJsxFragment(node)
  ) {
    return true;
  }
  return Boolean(ts.forEachChild(node, hasOwnJsx));
}

function returnsJsx(body) {
  if (!body) return false;
  if (!ts.isBlock(body)) return hasOwnJsx(body);
  function visit(node) {
    if (isFunction(node)) return false;
    if (ts.isReturnStatement(node)) return hasOwnJsx(node.expression);
    return Boolean(ts.forEachChild(node, visit));
  }
  return visit(body);
}

function alreadyReadonly(type) {
  if (ts.isParenthesizedTypeNode(type)) return alreadyReadonly(type.type);
  if (ts.isTypeReferenceNode(type) && type.typeName.getText() === 'Readonly')
    return true;
  return (
    ts.isTypeLiteralNode(type) &&
    type.members.every((member) =>
      member.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ReadonlyKeyword
      )
    )
  );
}

/** Conservative syntax codemod, not a replacement for Sonar's component analysis. */
export function transformProps(source, filename = 'component.tsx') {
  const file = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  if (file.parseDiagnostics.length) throw new Error(`Cannot parse ${filename}`);
  const changes = [];
  const skipped = [];
  // Even an identity alias called Readonly could compile without protecting props.
  function shadowsReadonly(node) {
    if (
      node.name &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'Readonly'
    )
      return true;
    return Boolean(ts.forEachChild(node, shadowsReadonly));
  }
  const shadowed = shadowsReadonly(file);
  function visit(node) {
    if (
      isFunction(node) &&
      /^[A-Z]/.test(componentName(node)) &&
      returnsJsx(node.body)
    ) {
      const parameter = node.parameters[0];
      if (parameter) {
        const line =
          file.getLineAndCharacterOfPosition(parameter.getStart(file)).line + 1;
        const name = componentName(node);
        const type = parameter.type;
        if (shadowed) {
          skipped.push({
            name,
            line,
            reason: 'local Readonly declaration requires review',
          });
        } else if (
          !type ||
          parameter.dotDotDotToken ||
          type.kind === ts.SyntaxKind.AnyKeyword ||
          type.kind === ts.SyntaxKind.UnknownKeyword
        ) {
          skipped.push({
            name,
            line,
            reason: 'inferred, any, unknown or rest props require review',
          });
        } else if (!alreadyReadonly(type)) {
          changes.push({
            name,
            line,
            start: type.getStart(file),
            end: type.end,
            before: type.getText(file),
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  let output = source;
  for (const change of [...changes].sort((a, b) => b.start - a.start)) {
    output = `${output.slice(0, change.start)}Readonly<${change.before}>${output.slice(change.end)}`;
  }
  return { source: output, changes, skipped };
}

export function isEligible(filename) {
  const relative = slash(filename);
  return (
    relative.startsWith('ClientApp/src/') &&
    relative.endsWith('.tsx') &&
    !relative
      .split('/')
      .some((part) => ['external', 'parent', 'node_modules'].includes(part)) &&
    !/\.(stories|story|test|spec)\.tsx$/.test(relative)
  );
}

/** Type-check all consumers with proposed contents held in memory. Never emits. */
export function projectDiagnostics(root, replacements = new Map()) {
  const configPath = path.join(root, 'tsconfig.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error) return [config.error];
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  if (parsed.errors.length) return parsed.errors;
  const canonical = (filename) => {
    const absolute = path.resolve(filename);
    return ts.sys.useCaseSensitiveFileNames ? absolute : absolute.toLowerCase();
  };
  const canonicalReplacements = new Map(
    [...replacements].map(([filename, source]) => [canonical(filename), source])
  );
  const host = ts.createCompilerHost(parsed.options);
  const originalRead = host.readFile;
  host.readFile = (filename) =>
    canonicalReplacements.get(canonical(filename)) ?? originalRead(filename);
  const program = ts.createProgram({
    rootNames: parsed.fileNames,
    options: { ...parsed.options, noEmit: true, noCheck: false },
    projectReferences: parsed.projectReferences,
    host,
  });
  const covered = new Set(
    program
      .getSourceFiles()
      .filter((file) => !file.isDeclarationFile)
      .map((file) => canonical(file.fileName))
  );
  for (const filename of replacements.keys()) {
    if (!covered.has(canonical(filename))) {
      throw new Error(
        `Proposed file is not included in the TypeScript project: ${filename}; no files written`
      );
    }
  }
  return ts
    .getPreEmitDiagnostics(program)
    .filter((item) => item.category === ts.DiagnosticCategory.Error);
}

function diagnosticText(diagnostics) {
  return ts.formatDiagnostics(diagnostics, {
    getCanonicalFileName: (file) => file,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => '\n',
  });
}

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
}

async function auditParameters(root, files) {
  const { ESLint } = await import('eslint');
  const eslint = new ESLint({ cwd: root });
  const results = await eslint.lintFiles(files);
  let count = 0;
  let fatal = 0;
  for (const result of results) {
    const messages = result.messages.filter(
      (message) =>
        message.fatal ||
        message.ruleId === '@typescript-eslint/prefer-readonly-parameter-types'
    );
    if (!messages.length) continue;
    const relative = slash(path.relative(root, result.filePath));
    for (const message of messages) {
      process.stdout.write(
        `${relative}:${message.line}:${message.column} ${message.message}\n`
      );
      if (message.fatal) fatal++;
      else count++;
    }
  }
  process.stdout.write(
    `${count} readonly parameter findings; ${fatal} fatal lint errors. Audit only: nested models and callbacks need individual review.\n`
  );
  return count || fatal ? 1 : 0;
}

export async function main(args = process.argv.slice(2), root = process.cwd()) {
  const flags = new Set(args.filter((arg) => arg.startsWith('--')));
  for (const flag of flags) {
    if (!['--write', '--check', '--audit-parameters', '--help'].includes(flag))
      throw new Error(`Unknown option: ${flag}`);
  }
  if (flags.has('--help')) {
    process.stdout.write(
      'Usage: node scripts/readonly-props.mjs [--check | --write | --audit-parameters] [ClientApp/src/path ...]\nDefault: preview eligible React props; --check exits 1 when changes or manual review remain.\n--write requires clean target files and a clean baseline/candidate TypeScript check.\n--audit-parameters reports the existing ESLint rule without changing files.\n'
    );
    return 0;
  }
  if (
    ['--write', '--check', '--audit-parameters'].filter((flag) =>
      flags.has(flag)
    ).length > 1
  ) {
    throw new Error(
      'Choose only one of --write, --check and --audit-parameters'
    );
  }
  root = path.resolve(root);
  if (
    path.resolve(git(root, ['rev-parse', '--show-toplevel']).trim()) !== root
  ) {
    throw new Error('Run this command from the repository root');
  }
  const tracked = git(root, ['ls-files', '-z', '--', 'ClientApp/src'])
    .split('\0')
    .filter(Boolean);
  const selections = args
    .filter((arg) => !arg.startsWith('--'))
    .map((arg) =>
      slash(path.relative(root, path.resolve(root, arg))).replace(/\/$/, '')
    );
  const candidates = tracked.filter((file) =>
    flags.has('--audit-parameters')
      ? /\.tsx?$/.test(file) &&
        !file.endsWith('.d.ts') &&
        !/(^|\/)(external|parent|node_modules)\//.test(file) &&
        file !== 'ClientApp/src/api/web-api-client.ts'
      : isEligible(file)
  );
  for (const selection of selections) {
    if (
      !candidates.some(
        (file) => file === selection || file.startsWith(`${selection}/`)
      )
    ) {
      throw new Error(`No eligible tracked source files at: ${selection}`);
    }
  }
  const files = candidates.filter(
    (file) =>
      !selections.length ||
      selections.some(
        (selection) => file === selection || file.startsWith(`${selection}/`)
      )
  );
  if (flags.has('--audit-parameters')) return auditParameters(root, files);

  const originals = new Map();
  const replacements = new Map();
  let total = 0;
  let skipped = 0;
  for (const file of files) {
    const absolute = path.join(root, file);
    if (path.resolve(realpathSync(absolute)) !== path.resolve(absolute))
      throw new Error(`Refusing symlinked source: ${file}`);
    const original = readFileSync(absolute, 'utf8');
    const result = transformProps(original, file);
    for (const change of result.changes) {
      process.stdout.write(
        `${file}:${change.line} ${change.name}: ${change.before.replaceAll(/\s+/g, ' ')} -> Readonly<...>\n`
      );
    }
    for (const item of result.skipped)
      process.stdout.write(
        `${file}:${item.line} REVIEW ${item.name}: ${item.reason}\n`
      );
    total += result.changes.length;
    skipped += result.skipped.length;
    if (result.changes.length) {
      originals.set(absolute, original);
      replacements.set(absolute, result.source);
    }
  }
  process.stdout.write(
    `${total} proposed props fixes in ${replacements.size} files; ${skipped} manual reviews. Detection is conservative; rerun Sonar for complete S6759 coverage.\n`
  );
  if (!flags.has('--write'))
    return flags.has('--check') && (total || skipped) ? 1 : 0;
  if (!replacements.size) return skipped ? 1 : 0;

  for (const file of replacements.keys()) {
    if (git(root, ['status', '--porcelain', '--', file]).trim())
      throw new Error(
        `Refusing to overwrite staged or unstaged changes: ${path.relative(root, file)}`
      );
  }
  process.stdout.write(
    'Checking baseline and proposed types across the project before writing...\n'
  );
  const baseline = projectDiagnostics(root);
  if (baseline.length)
    throw new Error(
      `Baseline has ${baseline.length} TypeScript errors; no files written.\n${diagnosticText(baseline)}`
    );
  const proposed = projectDiagnostics(root, replacements);
  if (proposed.length)
    throw new Error(
      `Proposed changes have ${proposed.length} TypeScript errors; no files written.\n${diagnosticText(proposed)}`
    );
  // Refuse to overwrite edits made while the potentially long type-check ran.
  for (const [file, original] of originals) {
    if (
      readFileSync(file, 'utf8') !== original ||
      git(root, ['status', '--porcelain', '--', file]).trim()
    ) {
      throw new Error(
        `File changed during validation: ${file}; no files written`
      );
    }
  }
  const written = [];
  try {
    for (const [file, source] of replacements) {
      written.push(file);
      writeFileSync(file, source);
    }
  } catch (error) {
    for (const file of written) writeFileSync(file, originals.get(file));
    throw error;
  }
  process.stdout.write(
    `Applied ${total} props fixes. Review the diff, format touched files, run lint/tests and rerun Sonar.\n`
  );
  return skipped ? 1 : 0;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 2;
    });
}
