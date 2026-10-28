import path from 'node:path';

import { openOwnedRootSync } from './owned-fs.mjs';

export const STORYBOOK_INPUT_ROOTS = [
  'ClientApp/src',
  'ClientApp/public',
  'ClientApp/media',
  '.storybook',
  'scripts',
  'tests',
  'patches',
];

const STORYBOOK_ROOT_INPUT_PATTERNS = [
  /^[^\\/]*\.config\.[^\\/]+$/u,
  /^vitest[^.]*\..+$/u,
  /^tsconfig.*\.json$/u,
  /^\.prettierrc.*$/u,
];

const STORYBOOK_ROOT_INPUT_FILES = [
  'package.json',
  'package-lock.json',
  'npm-shrinkwrap.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'vite.config.ts',
  'vite.config.mts',
  'vitest.unit.config.ts',
  'vitest.storybook.config.ts',
  'vitest.storybook.runtime.ts',
];

// The ACL freeze leaves disposable denial probes under the protected roots.
// They are evidence artifacts, not source, so they never enter the input
// digest; otherwise the freeze would invalidate its own digest.
export const PROBE_PREFIX = '.storybook-closure-probe-';

export const isEnvironmentInputFile = (inputFile) =>
  inputFile === '.env' || inputFile.startsWith('.env.');

const isRootInputFile = (inputFile) =>
  isEnvironmentInputFile(inputFile) ||
  STORYBOOK_ROOT_INPUT_PATTERNS.some((pattern) => pattern.test(inputFile));

// Root-level manifests and configs. A candidate that is absent is skipped; one
// that resolves outside the checkout fails like any other input.
const collectRootInputFiles = (owned) => {
  const rootInputFiles = new Set(
    owned.list(owned.canonicalRoot).filter(isRootInputFile),
  );
  for (const inputFile of STORYBOOK_ROOT_INPUT_FILES)
    rootInputFiles.add(inputFile);
  const files = [];
  for (const inputFile of rootInputFiles) {
    try {
      const { canonical } = owned.inspect(inputFile);
      files.push({ path: inputFile, content: owned.read(canonical) });
    } catch (error_) {
      if (error_.code !== 'ENOENT') throw error_;
    }
  }
  return files;
};

export const collectInputFiles = (checkout) => {
  const owned = openOwnedRootSync(checkout);
  const files = [];
  const includedFiles = new Set();
  const visit = (absolutePath) => {
    const { canonical, isDirectory } = owned.inspect(absolutePath);
    if (isDirectory) {
      for (const child of owned.list(canonical))
        visit(path.join(absolutePath, child));
      return;
    }
    if (path.basename(absolutePath).startsWith(PROBE_PREFIX)) return;
    const relativePath = path
      .relative(checkout, absolutePath)
      .replaceAll(path.sep, '/');
    if (!includedFiles.has(relativePath)) {
      includedFiles.add(relativePath);
      files.push({ path: relativePath, content: owned.read(canonical) });
    }
  };
  for (const inputRoot of STORYBOOK_INPUT_ROOTS)
    visit(path.resolve(checkout, inputRoot));
  return [...files, ...collectRootInputFiles(owned)];
};

// Every file beneath a protected root, for per-file ACL enforcement.
export const collectFiles = (root) => {
  const owned = openOwnedRootSync(root);
  const files = [];
  const visit = (absolutePath) => {
    const { canonical, isDirectory } = owned.inspect(absolutePath);
    if (isDirectory) {
      for (const child of owned.list(canonical))
        visit(path.join(absolutePath, child));
      return;
    }
    files.push(absolutePath);
  };
  visit(root);
  return files;
};
