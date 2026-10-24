#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const skillDir = __dirname;
const nodeModules = path.join(skillDir, 'node_modules');

function resolvePlaywright() {
  try {
    return import.meta.resolve(
      'playwright',
      pathToFileURL(path.join(skillDir, 'run.js')).href
    );
  } catch {
    console.error(
      'Playwright is not installed. Run `npm run setup` in the skill directory.'
    );
    process.exit(1);
  }
}

function saveScript(file) {
  const directory = process.env.PW_SCRIPT_DIR;
  if (!directory || !file) return;

  const targetDir = path.resolve(directory);
  fs.mkdirSync(targetDir, { recursive: true });
  const name = path.basename(file);
  let target = path.join(targetDir, name);
  if (fs.existsSync(target)) {
    const extension = path.extname(name);
    const stem = path.basename(name, extension);
    target = path.join(targetDir, `${stem}-${Date.now()}${extension}`);
  }
  fs.copyFileSync(file, target);
  console.log(`Script saved to: ${target}`);
}

function run(args) {
  const child = spawn(process.execPath, args, {
    // ponytail: keep the caller's cwd so relative paths in scripts and in
    // PW_ARTIFACT_DIR resolve against the user's project, not the skill install.
    cwd: process.cwd(),
    env: { ...process.env, NODE_PATH: nodeModules, PW_SKILL_DIR: skillDir },
    stdio: 'inherit',
  });
  const handlers = new Map();
  child.on('exit', (code, signal) => {
    if (!signal) process.exit(code ?? 1);
    // Re-raise so callers and shells see an interrupt rather than a plain failure.
    for (const [name, handler] of handlers) process.off(name, handler);
    process.kill(process.pid, signal);
  });
  child.on('error', (error) => {
    console.error(`Failed to start Node.js: ${error.message}`);
    process.exit(1);
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    const handler = () => {
      child.kill(signal);
      // ponytail: child traps or ignores the signal? escalate so the parent cannot hang
      setTimeout(() => child.kill('SIGKILL'), 2000).unref();
    };
    handlers.set(signal, handler);
    process.on(signal, handler);
  }
}

const playwrightUrl = resolvePlaywright();

const args = process.argv.slice(2);
if (args[0] === '-e' || args[0] === '--eval') {
  const source = args.slice(1).join(' ');
  if (!source) {
    console.error(
      'Usage: node run.js -e "await page.goto(\'https://example.com\')"'
    );
    process.exit(1);
  }
  const helpersUrl = JSON.stringify(
    pathToFileURL(path.join(skillDir, 'lib/helpers.js')).href
  );
  const prefix = `import * as playwright from ${JSON.stringify(playwrightUrl)};\nimport * as helpers from ${helpersUrl};\nconst { chromium, firefox, webkit, devices } = playwright;\n`;
  // ponytail: exit once the snippet settles so a snippet that leaves the browser open
  // cannot hang; the empty writes flush queued output first (pipe writes are async).
  const exit =
    "async () => { for (const s of [process.stdout, process.stderr]) await new Promise(r => s.write('', r)); process.exit(process.exitCode ?? 0); }";
  run([
    '--input-type=module',
    '-e',
    `${prefix}\n(async () => {\n  try {\n    ${source}\n  } catch (error) {\n    console.error(error.stack || error.message);\n    process.exitCode = 1;\n  }\n})().finally(${exit});`,
  ]);
} else if (args[0]) {
  const file = path.resolve(args[0]);
  if (!fs.existsSync(file)) {
    console.error(`Script not found: ${file}`);
    process.exit(1);
  }
  saveScript(file);
  run([file, ...args.slice(1)]);
} else if (!process.stdin.isTTY) {
  console.error(
    'Stdin execution is no longer supported. Use a script file or `-e`.'
  );
  process.exit(1);
} else {
  console.error('Usage: node run.js <script.js> [args...]');
  console.error(
    '   or: node run.js -e "await page.goto(\'https://example.com\')"'
  );
  process.exit(1);
}
