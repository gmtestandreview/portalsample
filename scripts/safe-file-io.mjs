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

/**
 * Resolve a caller-supplied path while keeping file-system operations inside
 * the caller's declared workspace. Callers still need to choose an
 * appropriate workspace root; this helper prevents accidental traversal out
 * of that root and centralises the narrow ESLint security boundary.
 */
export function safePath(candidate, root = process.cwd()) {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(resolvedRoot, candidate);
  if (outsideRoot(path.relative(resolvedRoot, resolvedCandidate))) {
    throw new Error(`Refusing path outside workspace root: ${candidate}`);
  }

  const realRoot = fsRealpathSync(resolvedRoot);
  const realCandidate = realPathForContainment(resolvedCandidate);
  if (outsideRoot(path.relative(realRoot, realCandidate))) {
    throw new Error(`Refusing path outside workspace root: ${candidate}`);
  }

  return resolvedCandidate;
}

export function readTextFile(candidate, root = process.cwd()) {
  // The path has been constrained by safePath immediately before the read.
  // safePath constrains the path to the declared workspace root.
  return fsReadFileSync(safePath(candidate, root), 'utf8');
}

export function readBinaryFile(candidate, root = process.cwd()) {
  // safePath constrains the path to the declared workspace root.
  return fsReadFileSync(safePath(candidate, root));
}

export function writeTextFile(
  candidate,
  contents,
  options,
  root = process.cwd(),
) {
  // safePath constrains the path to the declared workspace root.
  return fsWriteFileSync(safePath(candidate, root), contents, options);
}

export function makeDirectory(candidate, root = process.cwd()) {
  // safePath constrains the path to the declared workspace root.
  return fsMkdirSync(safePath(candidate, root), { recursive: true });
}

export function listDirectory(candidate, options, root = process.cwd()) {
  // safePath constrains the path to the declared workspace root.
  return fsReaddirSync(safePath(candidate, root), options);
}

export function statPath(candidate, root = process.cwd()) {
  // safePath constrains the path to the declared workspace root.
  return fsStatSync(safePath(candidate, root));
}

export function realPath(candidate, root = process.cwd()) {
  // safePath constrains the path to the declared workspace root.
  const resolved = fsRealpathSync(safePath(candidate, root));
  return safePath(resolved, root);
}

export function pathExists(candidate, root = process.cwd()) {
  // safePath constrains the path to the declared workspace root.
  return fsExistsSync(safePath(candidate, root));
}
