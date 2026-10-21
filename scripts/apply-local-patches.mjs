import { spawnSync } from 'node:child_process';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

export const localPatches = [
  'patches/html-react-parser+6.1.4.patch',
  'patches/storybook-addon-mcp+10.6.3.patch',
];

const trustedGitPath = (
  process.platform === 'win32'
    ? [
        String.raw`C:\Program Files\Git\cmd`,
        String.raw`C:\Program Files\Git\bin`,
      ]
    : ['/usr/local/bin', '/usr/bin', '/bin']
).join(delimiter);
const inheritedGitPath = process.env.PATH ?? process.env.Path ?? '';
const gitEnvironment = {
  ...process.env,
  PATH: [trustedGitPath, inheritedGitPath].filter(Boolean).join(delimiter),
};
delete gitEnvironment.Path;

function runGit(root, args) {
  // Trusted Git directories take precedence, while retaining user-configured locations.
  return spawnSync(
    'git', // NOSONAR
    ['--no-pager', ...args],
    {
      cwd: root,
      encoding: 'utf8',
      env: gitEnvironment,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }
  );
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

    const errorDetails = details ? `:\n${details}` : '';
    throw new Error(`Unable to ${action} ${patchPath}${errorDetails}`);
  }
}

export function applyLocalPatches(
  root = process.env.NMI_PATCH_ROOT ?? projectRoot
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
      `Local patch is neither applicable nor already applied: ${relativePatchPath}${errorDetails}`
    );
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
) {
  applyLocalPatches();
}
