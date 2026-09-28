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
import { isEligible, transformStory } from './readonly-stories.mjs';

it('annotates a CSF3 (StoryObj) render/play pair and is idempotent', () => {
  const source = `type Story = StoryObj<typeof meta>;
export const Example: Story = {
  render: (args) => <Widget {...args} />,
  play: async ({ canvas }) => { canvas.getByText('x'); },
};
`;
  const result = transformStory(source, 'Widget.stories.tsx');
  assert.equal(result.changes.length, 2);
  assert.match(
    result.source,
    /render: \(args: Readonly<Parameters<NonNullable<Story\['render'\]>>\[0\]>\) =>/u
  );
  assert.match(
    result.source,
    /play: async \(\{ canvas \}: Readonly<Parameters<NonNullable<Story\['play'\]>>\[0\]>\) =>/u
  );
  assert.equal(transformStory(result.source, 'Widget.stories.tsx').changes.length, 0);
});

it('annotates a CSF2 (StoryFn) story function directly', () => {
  const source = `type Story = StoryFn<typeof Widget>;
export const Example: Story = (args) => <Widget {...args} />;
`;
  const result = transformStory(source, 'Widget.stories.tsx');
  assert.equal(result.changes.length, 1);
  assert.match(
    result.source,
    /Example: Story = \(args: Readonly<Parameters<Story>\[0\]>\) =>/u
  );
});

it('leaves files with no local Story alias untouched', () => {
  const result = transformStory(
    'export const Example = (args) => <Widget {...args} />;\n',
    'Widget.stories.tsx'
  );
  assert.equal(result.changes.length, 0);
  assert.equal(result.skipped.length, 0);
});

it('does not re-annotate already-typed parameters or rest params', () => {
  const result = transformStory(
    `type Story = StoryObj<typeof meta>;
export const Example: Story = {
  render: (args: Readonly<Args>) => <Widget {...args} />,
};
export const Rest: Story = {
  render: (...args: unknown[]) => <Widget />,
};
`,
    'Widget.stories.tsx'
  );
  assert.equal(result.changes.length, 0);
});

it('reports non-function story values and non-object StoryObj values for review', () => {
  const result = transformStory(
    `type Story = StoryObj<typeof meta>;
export const Delegated: Story = someOtherStoryObject;
export const Broken: Story = {
  render: existingRenderFunction,
};
`,
    'Widget.stories.tsx'
  );
  assert.equal(result.changes.length, 0);
  assert.equal(result.skipped.length, 2);
});

it('limits edits to handwritten *.stories.tsx under ClientApp/src', () => {
  assert.equal(isEligible('ClientApp/src/components/Card.stories.tsx'), true);
  for (const filename of [
    'ClientApp/src/components/Card.tsx',
    'ClientApp/src/external/Card.stories.tsx',
    'ClientApp/src/parent/packages/Card.stories.tsx',
    'tests/Card.stories.tsx',
  ]) {
    assert.equal(isEligible(filename), false, filename);
  }
});

const script = path.join(import.meta.dirname, 'readonly-stories.mjs');
function fixture(context) {
  const root = mkdtempSync(path.join(tmpdir(), 'readonly-stories-'));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, 'ClientApp/src'), { recursive: true });
  writeFileSync(
    path.join(root, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        jsx: 'preserve',
        lib: ['ES2020', 'DOM'],
        types: [],
        skipLibCheck: true,
      },
      include: ['ClientApp/src/**/*'],
    })
  );
  const filename = path.join(root, 'ClientApp/src/Widget.stories.tsx');
  writeFileSync(
    filename,
    `declare global { namespace JSX { interface IntrinsicElements { div: { children?: unknown } } } }
interface StoryObj<T> {
  render?: (args: T) => unknown;
  play?: (context: { canvas: { getByText: (value: string) => unknown } }) => Promise<void>;
  args?: Partial<T>;
}
interface Args { name: string }
declare function Widget(props: Args): unknown;
const meta = { args: { name: 'default' } };
type Story = StoryObj<Args>;

export const Example: Story = {
  render: (args) => <div>{args.name}</div>,
  play: async ({ canvas }) => { canvas.getByText('default'); },
};
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
  assert.match(preview.stdout, /2 proposed parameter annotations/u);
  assert.equal(readFileSync(filename, 'utf8'), original);
  assert.equal(run('--check').status, 1);
  const write = run('--write');
  assert.equal(write.status, 0, write.stderr);
  assert.match(
    readFileSync(filename, 'utf8'),
    /render: \(args: Readonly<Parameters<NonNullable<Story\['render'\]>>\[0\]>\) =>/u
  );
  assert.equal(run('--check').status, 0);
});
