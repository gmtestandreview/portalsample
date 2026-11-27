import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, posix, resolve, win32 } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

export const localPatches = [
  'patches/html-react-parser+6.1.9.patch',
  'patches/react-router-dev+7.18.7.patch',
  'patches/storybook-addon-mcp+10.6.3.patch',
];

const windowsGitDirectories = [
  String.raw`C:\Program Files\Git\cmd`,
  String.raw`C:\Program Files\Git\bin`,
];
const posixGitDirectories = ['/usr/local/bin', '/usr/bin', '/bin'];

/**
 * Resolve Git from fixed, trusted directories only; PATH is never searched.
 * Exported so the unit test spawns the same binary as the patch applicator.
 * The options exist only so tests can inject a platform, directory list and
 * existence check without touching the real filesystem or environment.
 */
export function resolveGit({
  platform = process.platform,
  directories = platform === 'win32'
    ? windowsGitDirectories
    : posixGitDirectories,
  exists = existsSync,
} = {}) {
  const executable = platform === 'win32' ? 'git.exe' : 'git';
  const { join: joinPath } = platform === 'win32' ? win32 : posix;
  const found = directories
    .map((directory) => joinPath(directory, executable))
    .find((candidate) => exists(candidate));

  if (!found) {
    throw new Error(
      `Unable to find ${executable} in the trusted directories: ${directories.join(', ')}. ` +
        'Install Git into one of these locations; PATH is deliberately not searched.',
    );
  }

  return found;
}

let cachedGitPath;

function runGit(root, args) {
  cachedGitPath ??= resolveGit();

  return spawnSync(cachedGitPath, ['--no-pager', ...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
}

function wasSkipped(result) {
  return `${result.stdout ?? ''}\n${result.stderr ?? ''}`.includes(
    'Skipped patch',
  );
}

function assertGitSucceeded(result, action, patchPath) {
  if (result.error || result.status !== 0) {
    const details = [result.stdout, result.stderr, result.error?.message]
      .filter(Boolean)
      .join('\n')
      .trim();

    const errorDetails = details ? `:\n${details}` : '';
    throw new Error(`Unable to ${action} ${patchPath}${errorDetails}`);
  }
}

export function applyLocalPatches(
  root = process.env.NMI_PATCH_ROOT ?? projectRoot,
) {
  const patchRoot = resolve(root);

  for (const relativePatchPath of localPatches) {
    const patchPath = join(patchRoot, relativePatchPath);

    const check = runGit(patchRoot, [
      'apply',
      '--no-index',
      '--unsafe-paths',
      '--check',
      '--ignore-whitespace',
      '--whitespace=nowarn',
      patchPath,
    ]);

    if (check.status === 0 && !wasSkipped(check)) {
      const apply = runGit(patchRoot, [
        'apply',
        '--no-index',
        '--unsafe-paths',
        '--ignore-whitespace',
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
      '--ignore-whitespace',
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
    const errorDetails = details ? `\n${details}` : '';
    throw new Error(
      `Local patch is neither applicable nor already applied: ${relativePatchPath}${errorDetails}`,
    );
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
) {
  applyLocalPatches();
}
