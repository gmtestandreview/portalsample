import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const repositoryRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../..'
);
const temporaryRoots: string[] = [];

function runPatchApplicator(root: string) {
  return spawnSync(
    process.execPath,
    [join(repositoryRoot, 'scripts/apply-local-patches.mjs')],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
      env: { ...process.env, NMI_PATCH_ROOT: root },
    }
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
  ];

  for (const [source, destination] of packageFiles) {
    const destinationPath = join(root, destination);
    await cp(join(repositoryRoot, source), destinationPath);
  }

  const gitInit = spawnSync('git', ['init', '-q'], {
    cwd: root,
    encoding: 'utf8',
  });
  expect(gitInit.status).toBe(0);
  const gitAdd = spawnSync('git', ['add', 'node_modules'], {
    cwd: root,
    encoding: 'utf8',
  });
  expect(gitAdd.status).toBe(0);

  return root;
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { force: true, recursive: true }))
  );
});

describe('repository-owned local patches', () => {
  it('applies all patches and is safe to run again', async () => {
    const root = await createPatchFixture();

    expect(runPatchApplicator(root).status).toBe(0);

    expect(
      await readFile(
        join(root, 'node_modules/html-react-parser/package.json'),
        'utf8'
      )
    ).toContain('"default": "./esm/index.mjs"');
    const firstRun = await Promise.all([
      readFile(
        join(root, 'node_modules/html-react-parser/package.json'),
        'utf8'
      ),
    ]);

    expect(runPatchApplicator(root).status).toBe(0);

    await expect(
      Promise.all([
        readFile(
          join(root, 'node_modules/html-react-parser/package.json'),
          'utf8'
        ),
      ])
    ).resolves.toEqual(firstRun);
  });
});
