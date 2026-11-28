import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it, onTestFinished } from 'vitest';

import { readTextFile } from '../../helpers/safeTestFilesystem';

const repositoryRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../..',
);
const temporaryRoots: string[] = [];

interface ResolveGitOptions {
  directories?: string[];
  exists?: (candidate: string) => boolean;
  platform?: NodeJS.Platform;
}

// The script is plain ESM without declarations, so load it with a typed seam.
async function loadResolveGit() {
  const module = (await import(
    pathToFileURL(join(repositoryRoot, 'scripts/apply-local-patches.mjs')).href
  )) as { resolveGit: (options?: ResolveGitOptions) => string };

  return module.resolveGit;
}

function runPatchApplicator(root: string) {
  return spawnSync(
    process.execPath,
    [join(repositoryRoot, 'scripts/apply-local-patches.mjs')],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
      env: { ...process.env, NMI_PATCH_ROOT: root },
    },
  );
}

async function createPatchFixture() {
  const root = await mkdtemp(join(tmpdir(), 'nmi-local-patches-'));
  temporaryRoots.push(root);

  await cp(join(repositoryRoot, 'patches'), join(root, 'patches'), {
    recursive: true,
  });

  const packageFiles: [string, string][] = [
    [
      'node_modules/html-react-parser/package.json',
      'node_modules/html-react-parser/package.json',
    ],
    [
      'node_modules/@storybook/addon-mcp/dist/preset.js',
      'node_modules/@storybook/addon-mcp/dist/preset.js',
    ],
    [
      'node_modules/@react-router/dev/dist/vite.js',
      'node_modules/@react-router/dev/dist/vite.js',
    ],
  ];

  for (const [source, destination] of packageFiles) {
    const destinationPath = join(root, destination);
    await cp(join(repositoryRoot, source), destinationPath);
  }

  const git = (await loadResolveGit())();
  const gitInit = spawnSync(git, ['init', '-q'], {
    cwd: root,
    encoding: 'utf8',
  });

  expect(gitInit.status).toBe(0);

  const gitAdd = spawnSync(git, ['add', 'node_modules'], {
    cwd: root,
    encoding: 'utf8',
  });

  expect(gitAdd.status).toBe(0);

  return root;
}

const cleanupTemporaryRoots = async (): Promise<void> => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { force: true, recursive: true })),
  );
};

describe('repository-owned local patches', () => {
  it('applies all patches and is safe to run again', async () => {
    expect.hasAssertions();

    onTestFinished(cleanupTemporaryRoots);

    const root = await createPatchFixture();

    expect(runPatchApplicator(root).status).toBe(0);

    await expect(
      readTextFile(
        join(root, 'node_modules/html-react-parser/package.json'),
        root,
      ),
    ).resolves.toContain('"default": "./esm/index.mjs"');
    await expect(
      readTextFile(
        join(root, 'node_modules/@storybook/addon-mcp/dist/preset.js'),
        root,
      ),
    ).resolves.toContain('function normalizeTestRunData(data)');
    await expect(
      readTextFile(
        join(root, 'node_modules/@react-router/dev/dist/vite.js'),
        root,
      ),
    ).resolves.toContain('envDir: false');

    const firstRun = await Promise.all([
      readTextFile(
        join(root, 'node_modules/html-react-parser/package.json'),
        root,
      ),
    ]);

    expect(runPatchApplicator(root).status).toBe(0);

    await expect(
      Promise.all([
        readTextFile(
          join(root, 'node_modules/html-react-parser/package.json'),
          root,
        ),
      ]),
    ).resolves.toStrictEqual(firstRun);
  });
});

describe('trusted Git resolution', () => {
  it('returns an absolute path inside a trusted directory when git exists there', async () => {
    expect.hasAssertions();

    const resolveGit = await loadResolveGit();

    const directories = ['/opt/missing', '/usr/bin'];

    expect(
      resolveGit({
        platform: 'linux',
        directories,
        exists: (candidate: string) => candidate === '/usr/bin/git',
      }),
    ).toBe('/usr/bin/git');
    expect(
      resolveGit({
        platform: 'win32',
        directories: [String.raw`C:\Program Files\Git\cmd`],
        exists: () => true,
      }),
    ).toBe(String.raw`C:\Program Files\Git\cmd\git.exe`);
  });

  it('prefers earlier trusted directories over later ones', async () => {
    expect.hasAssertions();

    const resolveGit = await loadResolveGit();

    expect(
      resolveGit({
        platform: 'linux',
        directories: ['/usr/local/bin', '/usr/bin'],
        exists: () => true,
      }),
    ).toBe('/usr/local/bin/git');
  });

  it('names the searched directories and never falls back to PATH', async () => {
    expect.hasAssertions();

    const resolveGit = await loadResolveGit();

    const directories = ['/usr/local/bin', '/usr/bin', '/bin'];

    expect(() =>
      resolveGit({ platform: 'linux', directories, exists: () => false }),
    ).toThrow(/\/usr\/local\/bin, \/usr\/bin, \/bin.*PATH.*not searched/su);
  });

  it('resolves the real default git for the current platform', async () => {
    expect.hasAssertions();

    const resolveGit = await loadResolveGit();

    expect(resolveGit()).toMatch(/git(\.exe)?$/u);
  });
});
