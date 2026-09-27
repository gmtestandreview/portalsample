import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { it } from 'node:test';
import ts from 'typescript';
import { isEligible, transformProps } from './readonly-props.mjs';

it('wraps named, destructured, generic, memo and default component props only', () => {
  const source = `interface Props { name: string }
function Welcome(props: Props) { return <div>{props.name}</div>; }
const Card = ({ name }: Props) => <div>{name}</div>;
const Generic = <T,>(props: Props & { value: T }) => <div />;
const Memo = memo((props: Props) => <div />);
export default function (props: Props) { return <div />; }
function helper(props: Props) { return props.name; }
function Factory(props: Props) { return () => <div />; }
`;
  const result = transformProps(source, 'example.tsx');
  assert.equal(result.changes.length, 5);
  assert.match(result.source, /Welcome\(props: Readonly<Props>\)/u);
  assert.match(result.source, /\{ name \}: Readonly<Props>/u);
  assert.match(result.source, /Readonly<Props & \{ value: T \}>/u);
  assert.match(result.source, /helper\(props: Props\)/u);
  assert.match(result.source, /Factory\(props: Props\)/u);
  assert.equal(transformProps(result.source, 'example.tsx').changes.length, 0);
  const emit = (text) =>
    ts.transpileModule(text, {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
  assert.equal(emit(result.source), emit(source));
});

it('does not change helpers merely containing JSX or shadowed Readonly types', () => {
  assert.equal(
    transformProps(
      'function Helper(props: Props) { const element = <div />; return 1; }'
    ).changes.length,
    0
  );
  const result = transformProps(
    'type Readonly<T> = T; const Card = (props: Props) => <div />;'
  );
  assert.equal(result.changes.length, 0);
  assert.equal(result.skipped.length, 1);
});

it('limits edits to handwritten production TSX', () => {
  assert.equal(isEligible('ClientApp/src/components/Card.tsx'), true);
  for (const filename of [
    'ClientApp/src/external/Card.tsx',
    'ClientApp/src/parent/packages/Card.tsx',
    'ClientApp/src/components/Card.stories.tsx',
    'ClientApp/src/components/Card.test.tsx',
    'ClientApp/src/api/web-api-client.ts',
    'tests/Card.tsx',
  ]) {
    assert.equal(isEligible(filename), false, filename);
  }
});

const script = path.join(import.meta.dirname, 'readonly-props.mjs');
function fixture(context, component = 'return <div>{props.name}</div>;') {
  const root = mkdtempSync(path.join(tmpdir(), 'readonly-props-'));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, 'ClientApp/src'), { recursive: true });
  writeFileSync(
    path.join(root, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        jsx: 'preserve',
        types: [],
        skipLibCheck: true,
      },
      include: ['ClientApp/src/**/*'],
    })
  );
  const filename = path.join(root, 'ClientApp/src/Card.tsx');
  writeFileSync(
    filename,
    `declare namespace JSX { interface IntrinsicElements { div: { children?: unknown } } }
interface Props { name: string; onSave?: (items: string[]) => void; items?: string[] }
function Card(props: Props) { ${component} }
const input: Props = { name: 'before', items: [] };
const rendered = <Card {...input} />;
input.name = 'after';
`
  );
  const git = (...args) =>
    execFileSync('git', ['-C', root, ...args], { stdio: 'pipe' });
  git('init', '-q');
  git('add', '.');
  git(
    '-c',
    'user.name=Readonly tests',
    '-c',
    'user.email=readonly@example.invalid',
    '-c',
    'commit.gpgsign=false',
    'commit',
    '-qm',
    'fixture'
  );
  return {
    root,
    filename,
    run: (...args) =>
      spawnSync(process.execPath, [script, ...args], {
        cwd: root,
        encoding: 'utf8',
        timeout: 60_000,
      }),
  };
}

it('CLI previews without writing, checks, applies after validation and is idempotent', (context) => {
  const { filename, run } = fixture(context);
  const original = readFileSync(filename, 'utf8');
  const preview = run();
  assert.equal(preview.status, 0, preview.stderr);
  assert.match(preview.stdout, /1 proposed props fixes/u);
  assert.equal(readFileSync(filename, 'utf8'), original);
  assert.equal(run('--check').status, 1);
  const write = run('--write');
  assert.equal(write.status, 0, write.stderr);
  assert.match(readFileSync(filename, 'utf8'), /props: Readonly<Props>/u);
  assert.equal(run('--check').status, 0);
});

it('CLI rejects mutations revealed by readonly without touching source', (context) => {
  const { filename, run } = fixture(
    context,
    "props.name = 'changed'; return <div />;"
  );
  const original = readFileSync(filename, 'utf8');
  const result = run('--write');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /read-only property/u);
  assert.equal(readFileSync(filename, 'utf8'), original);
});

it('CLI refuses baseline errors and dirty target files', (context) => {
  const broken = fixture(context, 'missingSymbol(); return <div />;');
  const result = broken.run('--write');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Baseline has/u);
  assert.doesNotMatch(readFileSync(broken.filename, 'utf8'), /Readonly</u);
  const dirty = fixture(context);
  writeFileSync(
    dirty.filename,
    `${readFileSync(dirty.filename, 'utf8')}// user change\n`
  );
  const changed = dirty.run('--write');
  assert.equal(changed.status, 2);
  assert.match(changed.stderr, /staged or unstaged/u);
  assert.match(readFileSync(dirty.filename, 'utf8'), /user change/u);
  assert.equal(dirty.run('--unknown').status, 2);
  assert.equal(dirty.run('--write', '--check').status, 2);
  assert.equal(dirty.run('../outside').status, 2);
});

it('CLI refuses edits to files outside the compiler project', (context) => {
  const { root, filename, run } = fixture(
    context,
    "props.name = 'changed'; return <div />;"
  );
  writeFileSync(path.join(root, 'checked.ts'), 'export const checked = true;');
  writeFileSync(
    path.join(root, 'tsconfig.json'),
    JSON.stringify({ compilerOptions: { types: [] }, files: ['checked.ts'] })
  );
  const original = readFileSync(filename, 'utf8');
  const result = run('--write');
  assert.equal(result.status, 2, result.stdout);
  assert.match(result.stderr, /not included in the TypeScript project/u);
  assert.equal(readFileSync(filename, 'utf8'), original);
});

it(
  'CLI validates replacements when tsconfig path casing differs on Windows',
  { skip: process.platform !== 'win32' },
  (context) => {
    const { root, filename, run } = fixture(
      context,
      "props.name = 'changed'; return <div />;"
    );
    writeFileSync(
      path.join(root, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { strict: true, jsx: 'preserve', types: [] },
        files: ['clientapp/src/card.tsx'],
      })
    );
    const original = readFileSync(filename, 'utf8');
    const result = run('--write');
    assert.equal(result.status, 2, result.stdout);
    assert.match(result.stderr, /read-only property/u);
    assert.equal(readFileSync(filename, 'utf8'), original);
  }
);

it('preserves comments, CRLF, defaults, nested types and callbacks', () => {
  const source =
    'const Card = (props: /* keep */ { items: string[]; onSave: (value: string[]) => void } = defaults) => <div />;\r\n';
  const result = transformProps(source, 'example.tsx');
  assert.equal(
    result.source,
    'const Card = (props: /* keep */ Readonly<{ items: string[]; onSave: (value: string[]) => void }> = defaults) => <div />;\r\n'
  );
});

it('reports inferred, any and rest props without guessing their types', () => {
  const result = transformProps(
    `
const Inferred: FC<Props> = (props) => <div />;
const Unsafe = (props: any) => <div />;
const Rest = (...props: Props[]) => <div />;
const Already = (props: Readonly<Props>) => <div />;
const Inline = (props: { readonly name: string }) => <div />;
`,
    'example.tsx'
  );
  assert.equal(result.changes.length, 0);
  assert.equal(result.skipped.length, 3);
});
