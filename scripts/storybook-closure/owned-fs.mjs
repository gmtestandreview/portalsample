import {
  appendFile,
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';

// The single boundary for filesystem access whose path is computed at runtime.
// Every operation below proves the target is inside an explicit owned root
// before touching it:
//   - the root and the target are canonicalised (symlinks/junctions resolved),
//   - the canonical target must be the root or a descendant of it,
//   - a target that does not exist yet is judged by its nearest existing
//     ancestor, so nothing is created through a redirected parent,
//   - a dangling link on the way is rejected rather than followed blindly.
// Validate-then-operate is not atomic: a concurrent actor with write access to
// the owned tree can still swap a component between the check and the call.

export const isOutsideRoot = (relativePath) =>
  relativePath === '..' ||
  relativePath.startsWith(`..${path.sep}`) ||
  path.isAbsolute(relativePath);

const assertCanonicalInside = (canonicalRoot, canonicalTarget, original) => {
  if (isOutsideRoot(path.relative(canonicalRoot, canonicalTarget))) {
    throw new Error(`path resolves outside the owned root: ${original}`);
  }
  return canonicalTarget;
};

const assertNotDanglingLink = async (entry) => {
  try {
    await lstat(entry);
  } catch (error_) {
    if (error_.code === 'ENOENT') return;
    throw error_;
  }
  throw new Error(`dangling link in owned path: ${entry}`);
};

// Canonical form of `target`, which may not exist yet: the real path of its
// nearest existing ancestor followed by the not-yet-created segments.
const canonicalize = async (target) => {
  const missing = [];
  let current = target;
  for (;;) {
    try {
      return path.join(await realpath(current), ...missing);
    } catch (error_) {
      const parent = path.dirname(current);
      if (error_.code !== 'ENOENT' || parent === current) throw error_;
      await assertNotDanglingLink(current);
      missing.unshift(path.basename(current));
      current = parent;
    }
  }
};

export const openOwnedRoot = async (root) => {
  const canonicalRoot = await realpath(root);
  const rootPath = path.resolve(root);

  // Fully canonical target: used when the operation follows the final link.
  const resolve = async (target) =>
    assertCanonicalInside(
      canonicalRoot,
      await canonicalize(path.resolve(rootPath, target)),
      target,
    );

  // Canonical parent plus the literal final name: used by remove/rename so a
  // link is operated on itself and never followed out of the root.
  const resolveEntry = async (target) => {
    const resolved = path.resolve(rootPath, target);
    const parent = assertCanonicalInside(
      canonicalRoot,
      await canonicalize(path.dirname(resolved)),
      target,
    );
    return path.join(parent, path.basename(resolved));
  };

  return {
    canonicalRoot,
    resolve,
    readJson: async (target) =>
      JSON.parse(await readFile(await resolve(target), 'utf8')),
    writeFile: async (target, data, options) =>
      writeFile(await resolve(target), data, options),
    appendFile: async (target, data) => appendFile(await resolve(target), data),
    mkdir: async (target) => mkdir(await resolve(target), { recursive: true }),
    rm: async (target, options) => rm(await resolveEntry(target), options),
    unlink: async (target) => unlink(await resolveEntry(target)),
    rename: async (from, to) =>
      rename(await resolveEntry(from), await resolveEntry(to)),
  };
};

export const readOwnedJson = async (root, relativePath) =>
  (await openOwnedRoot(root)).readJson(relativePath);

// Synchronous, read-only variant for directory walks. Existing paths only.
export const openOwnedRootSync = (root) => {
  const canonicalRoot = realpathSync(root);
  const rootPath = path.resolve(root);
  const assertInside = (canonicalTarget, original) =>
    assertCanonicalInside(canonicalRoot, canonicalTarget, original);

  return {
    canonicalRoot,
    inspect: (target) => {
      const canonical = assertInside(
        realpathSync(path.resolve(rootPath, target)),
        target,
      );
      return { canonical, isDirectory: statSync(canonical).isDirectory() };
    },
    list: (canonicalDirectory) =>
      readdirSync(assertInside(canonicalDirectory, canonicalDirectory)),
    read: (canonicalFile) =>
      readFileSync(assertInside(canonicalFile, canonicalFile)),
  };
};
