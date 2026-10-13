import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

export const localPatches = [
  'patches/html-react-parser+6.1.4.patch',
];

function runGit(root, args) {
  return spawnSync('git', ['--no-pager', ...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
}

function wasSkipped(result) {
  return `${result.stdout ?? ''}\n${result.stderr ?? ''}`.includes(
    'Skipped patch'
  );
}

function assertGitSucceeded(result, action, patchPath) {
  if (result.error || result.status !== 0) {
    const details = [result.stdout, result.stderr, result.error?.message]
      .filter(Boolean)
      .join('\n')
      .trim();

    throw new Error(
      `Unable to ${action} ${patchPath}${details ? `:\n${details}` : ''}`
    );
  }
}

export function applyLocalPatches(
  root = process.env.NMI_PATCH_ROOT ?? projectRoot
) {
  const patchRoot = resolve(root);

  for (const relativePatchPath of localPatches) {
    const patchPath = join(patchRoot, relativePatchPath);

    if (!existsSync(patchPath)) {
      throw new Error(`Local patch does not exist: ${patchPath}`);
    }

    const check = runGit(patchRoot, [
      'apply',
      '--no-index',
      '--unsafe-paths',
      '--check',
      '--ignore-space-change',
      '--whitespace=nowarn',
      patchPath,
    ]);

    if (check.status === 0 && !wasSkipped(check)) {
      const apply = runGit(patchRoot, [
        'apply',
        '--no-index',
        '--unsafe-paths',
        '--ignore-space-change',
        '--whitespace=nowarn',
        patchPath,
      ]);
      assertGitSucceeded(apply, 'apply', relativePatchPath);
      if (wasSkipped(apply)) {
        throw new Error(`Git skipped local patch ${relativePatchPath}`);
      }
      continue;
    }

    const reverseCheck = runGit(patchRoot, [
      'apply',
      '--no-index',
      '--unsafe-paths',
      '--reverse',
      '--check',
      '--ignore-space-change',
      '--whitespace=nowarn',
      patchPath,
    ]);

    if (reverseCheck.status === 0 && !wasSkipped(reverseCheck)) {
      continue;
    }

    const details = [
      check.stdout,
      check.stderr,
      reverseCheck.stdout,
      reverseCheck.stderr,
    ]
      .filter(Boolean)
      .join('\n')
      .trim();
    throw new Error(
      `Local patch is neither applicable nor already applied: ${relativePatchPath}${
        details ? `\n${details}` : ''
      }`
    );
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
) {
  applyLocalPatches();
}
