import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(packageRoot, "scripts/reconcile-manifests.sh");
const tempRoot = mkdtempSync(path.join(os.tmpdir(), "rr-safe-migration-"));

function runCase(name, manifest, sources = {}, env = {}) {
  const directory = path.join(tempRoot, name);
  mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  for (const [filename, source] of Object.entries(sources)) {
    const file = path.join(directory, filename);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, source);
  }
  const result = spawnSync("sh", [script, directory], {
    encoding: "utf8",
    env: { ...process.env, UPDATE_LOCKFILE: "false", ...env },
  });
  assert.equal(result.status, 0, `${name}: ${result.stderr}`);
  return { manifest: JSON.parse(readFileSync(path.join(directory, "package.json"), "utf8")), output: result.stdout + result.stderr };
}

try {
  const existingV7 = runCase("existing-v7", {
    dependencies: { "react-router": "^7.18.5", "react-router-dom": "^6.28.0" },
  });
  assert.equal(existingV7.manifest.dependencies["react-router"], "^7.18.5");
  assert.equal(existingV7.manifest.dependencies["react-router-dom"], undefined);
  assert.match(existingV7.output, /manifest changed but UPDATE_LOCKFILE is false/);
  assert.doesNotMatch(existingV7.output, /install --|pnpm install|npm install|yarn install/);

  const v6InDev = runCase("v6-in-dev", {
    name: "fixture",
    devDependencies: { "react-router": "^6.30.0", unrelated: "workspace:*" },
  });
  assert.equal(v6InDev.manifest.devDependencies["react-router"], "^7.0.0");
  assert.equal(v6InDev.manifest.devDependencies.unrelated, "workspace:*");

  const unresolved = runCase("unresolved", {
    dependencies: { "react-router-dom": "^6.28.0" },
  }, { "src/legacy.cjs": "const { Link } = require('react-router-dom');\n" });
  assert.ok(unresolved.manifest.dependencies["react-router-dom"]);
  assert.ok(unresolved.manifest.dependencies["react-router"]);
  assert.match(unresolved.output, /source references are unresolved/);

  const safeRemove = runCase("remove-legacy", {
    dependencies: { "react-router-dom": "^6.28.0", keep: "1.0.0" },
  }, { "src/app.tsx": "import { Link } from 'react-router';\n" });
  assert.equal(safeRemove.manifest.dependencies["react-router-dom"], undefined);
  assert.equal(safeRemove.manifest.dependencies["react-router"], "^7.0.0");
  assert.equal(safeRemove.manifest.dependencies.keep, "1.0.0");

  const aliasRange = runCase("alias-range", {
    dependencies: { "react-router": "npm:forked-router@6.0.0", "react-router-dom": "^6.28.0" },
  });
  assert.equal(aliasRange.manifest.dependencies["react-router"], "npm:forked-router@6.0.0");
  assert.match(aliasRange.output, /cannot safely interpret/);

  console.log("Manifest reconciliation tests passed.");
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
