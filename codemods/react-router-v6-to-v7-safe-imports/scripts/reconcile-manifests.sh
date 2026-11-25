#!/bin/sh
set -eu

TARGET_VERSION=${TARGET_VERSION:-'^7.0.0'}
UPDATE_LOCKFILE=${UPDATE_LOCKFILE:-false}
case "$TARGET_VERSION" in
  7|7.*|^7|^7.*|~7|~7.*) ;;
  *) printf '%s\n' "Warning: TARGET_VERSION must be a React Router v7 range; not reconciling manifests." >&2; exit 0 ;;
esac

ROOT=${1:-.}
if [ ! -f "$ROOT/package.json" ]; then
  printf '%s\n' "Warning: no root package.json found; manifest reconciliation skipped." >&2
  exit 0
fi

node - "$ROOT" "$TARGET_VERSION" "$UPDATE_LOCKFILE" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(process.argv[2]);
const target = process.argv[3];
const updateLockfile = process.argv[4] === 'true';
const manifest = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));
const sections = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
const extensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.mts', '.cts']);
const excluded = new Set(['node_modules', '.git', 'generated', 'build', 'dist', 'coverage']);
let changed = false;
let unresolvedLegacyReference = false;
let legacyRemoved = false;
const hasCoreV7 = sections.some((section) => {
  const range = pkg[section]?.['react-router'];
  return typeof range === 'string' && /^(\^|~|>=|>|=)?\s*7\./.test(range);
});

function inspectSources(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!excluded.has(entry.name)) inspectSources(path.join(directory, entry.name));
      continue;
    }
    if (!extensions.has(path.extname(entry.name))) continue;
    const file = path.join(directory, entry.name);
    if (fs.readFileSync(file, 'utf8').includes('react-router-dom')) unresolvedLegacyReference = true;
  }
}
inspectSources(root);

for (const section of sections) {
  const dependencies = pkg[section];
  if (!dependencies || typeof dependencies !== 'object') continue;
  const domRange = dependencies['react-router-dom'];
  const coreRange = dependencies['react-router'];
  if (domRange !== undefined) {
    if (unresolvedLegacyReference) {
      console.warn(`Warning: ${section}.react-router-dom remains declared because source references are unresolved or react-router is not already v7-compatible. Review references before removing it.`);
    } else {
      delete dependencies['react-router-dom'];
      changed = true;
      legacyRemoved = true;
    }
  }
  if (coreRange === undefined) {
    if (domRange === undefined) continue;
    dependencies['react-router'] = target;
    changed = true;
    continue;
  }
  if (typeof coreRange !== 'string' || !/^(\^|~|>=|>|=)?\s*\d+\.\d+\.\d+/.test(coreRange)) {
    console.warn(`Warning: cannot safely interpret ${section}.react-router range ${JSON.stringify(coreRange)}; left unchanged.`);
    continue;
  }
  if (/^(\^|~|>=|>|=)?\s*7\./.test(coreRange)) {
    if (domRange !== undefined && !unresolvedLegacyReference) {
      delete dependencies['react-router-dom'];
      changed = true;
      legacyRemoved = true;
    }
    continue;
  }
  if (!/^(\^|~|>=|>|=)?\s*6\./.test(coreRange)) {
    console.warn(`Warning: ${section}.react-router range ${JSON.stringify(coreRange)} is not a recognized v6 range; left unchanged.`);
    continue;
  }
  dependencies['react-router'] = target;
  changed = true;
}

if (changed) {
  if (legacyRemoved) {
    for (const section of sections) {
      const dependencies = pkg[section];
      if (!dependencies || dependencies['react-router'] !== undefined) continue;
      dependencies['react-router'] = target;
    }
  }
  fs.writeFileSync(manifest, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`Updated ${path.relative(process.cwd(), manifest)} to React Router ${target}.`);
} else {
  console.log('No dependency manifest changes required; install was not run.');
  process.exit(0);
}

if (!updateLockfile) {
  console.warn('Warning: manifest changed but UPDATE_LOCKFILE is false; regenerate the existing lockfile with its package manager.');
  process.exit(0);
}

const managers = [
  ['pnpm', 'pnpm-lock.yaml'],
  ['npm', 'package-lock.json'],
  ['yarn', 'yarn.lock'],
];
const present = managers.filter(([, file]) => fs.existsSync(path.join(root, file)));
if (present.length !== 1) {
  console.warn(`Warning: expected exactly one recognized lockfile, found ${present.length}; no install command was run.`);
  process.exit(0);
}
const [manager] = present[0];
const { spawnSync } = require('node:child_process');
const command = manager === 'npm' ? ['install', '--package-lock-only', '--ignore-scripts']
  : manager === 'pnpm' ? ['install', '--lockfile-only', '--ignore-scripts']
  : ['install', '--mode', 'skip-builds'];
const result = spawnSync(manager, command, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
if (result.error || result.status !== 0) {
  console.warn(`Warning: ${manager} lockfile update did not complete successfully; inspect the manifest and lockfile manually.`);
  process.exit(result.status || 1);
}
NODE
