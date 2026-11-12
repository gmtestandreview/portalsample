import {
  existsSync as fsExistsSync,
  lstatSync as fsLstatSync,
  mkdirSync as fsMkdirSync,
  readdirSync as fsReaddirSync,
  readFileSync as fsReadFileSync,
  realpathSync as fsRealpathSync,
  statSync as fsStatSync,
  writeFileSync as fsWriteFileSync,
} from 'node:fs';
import path from 'node:path';

const outsideRoot = (relative) =>
  relative === '..' ||
  relative.startsWith(`..${path.sep}`) ||
  path.isAbsolute(relative);

const missingPathError = (error) =>
  error?.code === 'ENOENT' || error?.code === 'ENOTDIR';

const realPathForContainment = (candidate) => {
  let current = candidate;
  const suffix = [];

  while (true) {
    try {
      const resolved = fsRealpathSync(current);
      return path.resolve(resolved, ...suffix);
    } catch (error) {
      if (!missingPathError(error)) {
        throw error;
      }

      let currentStat;
      try {
        currentStat = fsLstatSync(current);
      } catch (lstatError) {
        if (!missingPathError(lstatError)) {
          throw lstatError;
        }
      }
      if (currentStat?.isSymbolicLink()) {
        throw new Error(`Refusing path outside workspace root: ${candidate}`, {
          cause: error,
        });
      }

      const parent = path.dirname(current);
      if (parent === current) {
        throw new Error(`Unable to resolve workspace root: ${candidate}`, {
          cause: error,
        });
      }
      suffix.unshift(path.basename(current));
      current = parent;
    }
  }
};

const assertNoSymlinkedPath = (candidate) => {
  let current = path.resolve(candidate);
  while (true) {
    try {
      if (fsLstatSync(current).isSymbolicLink()) {
        throw new Error(`Refusing symlinked filesystem path: ${candidate}`);
      }
    } catch (error) {
      if (!missingPathError(error)) {
        throw error;
      }
    }

    const parent = path.dirname(current);
    if (parent === current) return;
    current = parent;
  }
};

const validateSafePath = (candidate, root) => {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(resolvedRoot, candidate);
  if (outsideRoot(path.relative(resolvedRoot, resolvedCandidate))) {
    throw new Error(`Refusing path outside workspace root: ${candidate}`);
  }

  const realRoot = realPathForContainment(resolvedRoot);
  const realCandidate = realPathForContainment(resolvedCandidate);
  if (outsideRoot(path.relative(realRoot, realCandidate))) {
    throw new Error(`Refusing path outside workspace root: ${candidate}`);
  }

  return { realCandidate, resolvedCandidate };
};

/**
 * Return the canonical path produced by the same containment validation that
 * guards the filesystem operation. This reduces ancestor-reparse-point races
 * without changing the exported safePath result.
 *
 * Node's generic path-based fs APIs cannot provide race-free containment here:
 * O_NOFOLLOW is POSIX-only, Windows fs.openSync follows reparse points, and
 * these wrappers do not have a portable directory-descriptor API. A concurrent
 * replacement or creation of a final component can still race the operation.
 * Keep this validation immediately adjacent to each fs call and treat the
 * residual TOCTOU risk as a security-boundary limitation, not as a guarantee.
 */
const safeOperationPath = (candidate, root) =>
  validateSafePath(candidate, root).realCandidate;

/**
 * Resolve a caller-supplied path while keeping file-system operations inside
 * the caller's declared workspace. Callers still need to choose an
 * appropriate workspace root; this helper prevents accidental traversal out
 * of that root and centralises the narrow ESLint security boundary.
 */
export function safePath(candidate, root = process.cwd()) {
  return validateSafePath(candidate, root).resolvedCandidate;
}

export function readTextFile(candidate, root = process.cwd()) {
  return fsReadFileSync(safeOperationPath(candidate, root), 'utf8');
}

export function readBinaryFile(candidate, root = process.cwd()) {
  return fsReadFileSync(safeOperationPath(candidate, root));
}

export function writeTextFile(
  candidate,
  contents,
  options,
  root = process.cwd(),
) {
  return fsWriteFileSync(safeOperationPath(candidate, root), contents, options);
}

/**
 * Write to an explicitly caller-selected destination after rejecting every
 * existing symlink in the path. This is for tools whose output is intentionally
 * allowed outside the repository; it does not provide a root containment boundary.
 */
export function writeExternalTextFile(candidate, contents, options) {
  assertNoSymlinkedPath(candidate);
  return fsWriteFileSync(path.resolve(candidate), contents, options);
}

export function makeExternalDirectory(candidate) {
  assertNoSymlinkedPath(candidate);
  return fsMkdirSync(path.resolve(candidate), { recursive: true });
}

export function makeDirectory(candidate, root = process.cwd()) {
  return fsMkdirSync(safeOperationPath(candidate, root), { recursive: true });
}

export function listDirectory(candidate, options, root = process.cwd()) {
  return fsReaddirSync(safeOperationPath(candidate, root), options);
}

export function statPath(candidate, root = process.cwd()) {
  return fsStatSync(safeOperationPath(candidate, root));
}

export function realPath(candidate, root = process.cwd()) {
  // safePath constrains the path to the declared workspace root.
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = safePath(candidate, root);
  const realRoot = realPathForContainment(resolvedRoot);
  const realCandidate = fsRealpathSync(resolvedCandidate);
  if (outsideRoot(path.relative(realRoot, realCandidate))) {
    throw new Error(`Refusing path outside workspace root: ${candidate}`);
  }
  return realCandidate;
}

export function realFilePath(candidate) {
  if (!path.isAbsolute(candidate)) {
    throw new Error(`Executable path must be absolute: ${candidate}`);
  }

  const realCandidate = fsRealpathSync(candidate);
  if (!fsStatSync(realCandidate).isFile()) {
    throw new Error(`Executable path is not a regular file: ${candidate}`);
  }
  return realCandidate;
}

export function pathExists(candidate, root = process.cwd()) {
  return fsExistsSync(safeOperationPath(candidate, root));
}
