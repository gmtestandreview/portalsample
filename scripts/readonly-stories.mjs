import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { projectDiagnostics } from './readonly-props.mjs';

const slash = (value) => value.replaceAll('\\', '/');
const isFunctionLike = (node) =>
  ts.isArrowFunction(node) || ts.isFunctionExpression(node);

/**
 * Every story file in this codebase declares exactly one local `type Story =
 * StoryFn<...>` (CSF2, the story itself is a render function) or
 * `type Story = StoryObj<...>` (CSF3, `render`/`play` are properties). Basing
 * the injected annotation on `Parameters<Story>` / `Parameters<Story['x']>`
 * keeps it correct without knowing each component's Args shape.
 */
function findStoryKind(file) {
  let kind;
  function visit(node) {
    if (
      !kind &&
      ts.isTypeAliasDeclaration(node) &&
      node.name.text === 'Story' &&
      ts.isTypeReferenceNode(node.type)
    ) {
      const name = node.type.typeName.getText(file);
      if (name === 'StoryFn' || name === 'StoryObj') kind = name;
    }
    if (!kind) ts.forEachChild(node, visit);
  }
  visit(file);
  return kind;
}

const isStoryTypeRef = (typeNode, file) =>
  Boolean(
    typeNode &&
    ts.isTypeReferenceNode(typeNode) &&
    typeNode.typeName.getText(file) === 'Story'
  );

/** Null when the parameter is already typed, rest, or otherwise out of scope. */
function paramChange(parameter, index, typeExprText) {
  if (parameter.type || parameter.dotDotDotToken) return null;
  const insertAt = parameter.questionToken
    ? parameter.questionToken.end
    : parameter.name.end;
  return { at: insertAt, text: `: Readonly<${typeExprText(index)}>` };
}

function parameterChanges(parameters, name, typeExprText) {
  const changes = [];
  for (const [index, parameter] of parameters.entries()) {
    const change = paramChange(parameter, index, typeExprText);
    if (change) changes.push({ name, ...change });
  }
  return changes;
}

function storyExports(file) {
  const exports = [];
  function visit(node) {
    if (
      ts.isVariableStatement(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
      node.declarationList.declarations.length === 1
    ) {
      const declaration = node.declarationList.declarations[0];
      if (isStoryTypeRef(declaration.type, file) && declaration.initializer) {
        const name = ts.isIdentifier(declaration.name)
          ? declaration.name.text
          : '';
        exports.push({ name, initializer: declaration.initializer });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return exports;
}

function functionStoryChanges(name, initializer) {
  if (!isFunctionLike(initializer)) {
    return {
      changes: [],
      skipped: [{ name, reason: 'story value is not an inline function' }],
    };
  }
  return {
    changes: parameterChanges(
      initializer.parameters,
      name,
      (index) => `Parameters<Story>[${index}]`
    ),
    skipped: [],
  };
}

function objectStoryChanges(name, initializer) {
  if (!ts.isObjectLiteralExpression(initializer)) {
    return {
      changes: [],
      skipped: [{ name, reason: 'story value is not an object literal' }],
    };
  }

  const changes = [];
  const skipped = [];
  for (const property of initializer.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name))
      continue;
    const propName = property.name.text;
    if (propName !== 'render' && propName !== 'play') continue;
    if (!isFunctionLike(property.initializer)) {
      skipped.push({
        name: `${name}.${propName}`,
        reason: 'value is not an inline function',
      });
      continue;
    }
    changes.push(
      ...parameterChanges(
        property.initializer.parameters,
        `${name}.${propName}`,
        (index) => `Parameters<NonNullable<Story['${propName}']>>[${index}]`
      )
    );
  }
  return { changes, skipped };
}

function storyChanges(kind, name, initializer) {
  return kind === 'StoryFn'
    ? functionStoryChanges(name, initializer)
    : objectStoryChanges(name, initializer);
}

/** Conservative syntax codemod for CSF `render`/`play` parameter types. */
export function transformStory(source, filename = 'component.stories.tsx') {
  const file = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  if (file.parseDiagnostics.length) throw new Error(`Cannot parse ${filename}`);

  const kind = findStoryKind(file);
  const changes = [];
  const skipped = [];
  if (!kind) return { source, changes, skipped };

  for (const { name, initializer } of storyExports(file)) {
    const result = storyChanges(kind, name, initializer);
    changes.push(...result.changes);
    skipped.push(...result.skipped);
  }

  let output = source;
  for (const change of [...changes].sort((a, b) => b.at - a.at)) {
    output = `${output.slice(0, change.at)}${change.text}${output.slice(change.at)}`;
  }
  return { source: output, changes, skipped };
}

export function isEligible(filename) {
  const relative = slash(filename);
  return (
    relative.startsWith('ClientApp/src/') &&
    relative.endsWith('.stories.tsx') &&
    !relative
      .split('/')
      .some((part) => ['external', 'parent', 'node_modules'].includes(part))
  );
}

const gitExecutablePaths = {
  win32: [
    String.raw`C:\Program Files\Git\cmd\git.exe`,
    String.raw`C:\Program Files\Git\bin\git.exe`,
    String.raw`C:\Program Files (x86)\Git\cmd\git.exe`,
  ],
  darwin: ['/usr/bin/git', '/opt/homebrew/bin/git', '/usr/local/bin/git'],
  linux: ['/usr/bin/git', '/usr/local/bin/git', '/snap/bin/git'],
};

function resolveExistingPath(candidate) {
  try {
    return realpathSync(candidate);
  } catch {
    return null;
  }
}

let cachedGitExecutable;
// Resolve git to a fixed, unwriteable install path instead of a bare PATH
// lookup (Sonar S4036); override with GIT_EXECUTABLE for non-standard installs.
function gitExecutable() {
  if (cachedGitExecutable) return cachedGitExecutable;
  const configured = process.env.GIT_EXECUTABLE
    ? resolveExistingPath(process.env.GIT_EXECUTABLE)
    : null;
  const platformPaths =
    gitExecutablePaths[process.platform] ?? gitExecutablePaths.linux;
  const trustedDefault = platformPaths.map(resolveExistingPath).find(Boolean);
  cachedGitExecutable = configured ?? trustedDefault;
  if (!cachedGitExecutable) {
    throw new Error(
      'git executable not found in a standard location; set GIT_EXECUTABLE to its absolute path'
    );
  }
  return cachedGitExecutable;
}

function git(root, args) {
  return execFileSync(gitExecutable(), ['-C', root, ...args], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
}

function diagnosticText(diagnostics) {
  return ts.formatDiagnostics(diagnostics, {
    getCanonicalFileName: (file) => file,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => '\n',
  });
}

function resolveCandidateFiles(root, args) {
  const tracked = git(root, ['ls-files', '-z', '--', 'ClientApp/src'])
    .split('\0')
    .filter(Boolean)
    .filter(isEligible);
  const selections = args
    .filter((arg) => !arg.startsWith('--'))
    .map((arg) =>
      slash(path.relative(root, path.resolve(root, arg))).replace(/\/$/u, '')
    );
  for (const selection of selections) {
    if (
      !tracked.some(
        (file) => file === selection || file.startsWith(`${selection}/`)
      )
    ) {
      throw new Error(`No eligible tracked story files at: ${selection}`);
    }
  }
  return tracked.filter(
    (file) =>
      !selections.length ||
      selections.some(
        (selection) => file === selection || file.startsWith(`${selection}/`)
      )
  );
}

function previewTransforms(root, files) {
  const originals = new Map();
  const replacements = new Map();
  let total = 0;
  let skipped = 0;
  for (const file of files) {
    const absolute = path.join(root, file);
    if (path.resolve(realpathSync(absolute)) !== path.resolve(absolute))
      throw new Error(`Refusing symlinked source: ${file}`);
    const original = readFileSync(absolute, 'utf8');
    const result = transformStory(original, file);
    for (const change of result.changes)
      process.stdout.write(`${file} ${change.name}: added ${change.text}\n`);
    for (const item of result.skipped)
      process.stdout.write(`${file} REVIEW ${item.name}: ${item.reason}\n`);
    total += result.changes.length;
    skipped += result.skipped.length;
    if (result.changes.length) {
      originals.set(absolute, original);
      replacements.set(absolute, result.source);
    }
  }
  process.stdout.write(
    `${total} proposed parameter annotations in ${replacements.size} files; ${skipped} manual reviews.\n`
  );
  return { total, skipped, originals, replacements };
}

function applyReplacements(root, replacements, originals) {
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
}

export async function main(args = process.argv.slice(2), root = process.cwd()) {
  const flags = new Set(args.filter((arg) => arg.startsWith('--')));
  for (const flag of flags) {
    if (!['--write', '--check', '--help'].includes(flag))
      throw new Error(`Unknown option: ${flag}`);
  }
  if (flags.has('--help')) {
    process.stdout.write(
      'Usage: node scripts/readonly-stories.mjs [--check | --write] [ClientApp/src/path ...]\nDefault: preview eligible *.stories.tsx render/play parameter annotations; --check exits 1 when changes or manual review remain.\n--write requires clean target files and a clean baseline/candidate TypeScript check.\n'
    );
    return 0;
  }
  if (['--write', '--check'].filter((flag) => flags.has(flag)).length > 1) {
    throw new Error('Choose only one of --write and --check');
  }
  root = path.resolve(root);
  if (
    path.resolve(git(root, ['rev-parse', '--show-toplevel']).trim()) !== root
  ) {
    throw new Error('Run this command from the repository root');
  }
  const files = resolveCandidateFiles(root, args);
  const { total, skipped, originals, replacements } = previewTransforms(
    root,
    files
  );
  if (!flags.has('--write'))
    return flags.has('--check') && (total || skipped) ? 1 : 0;
  if (!replacements.size) return skipped ? 1 : 0;

  applyReplacements(root, replacements, originals);
  process.stdout.write(
    `Applied ${total} parameter annotations. Review the diff, format touched files, run lint/tests.\n`
  );
  return skipped ? 1 : 0;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    process.exitCode = await main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}
