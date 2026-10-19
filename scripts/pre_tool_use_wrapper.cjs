'use strict';

const { spawnSync } = require('node:child_process');
const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const guardPath = resolve(projectDir, 'scripts', 'pre_tool_use.py');

if (!existsSync(guardPath)) {
  process.stderr.write(
    '[A Team] WARNING: security gate inactive (guard script missing)\n'
  );
  process.exit(0);
}

let interpreter;
try {
  const { findPython314 } = require('./python314.cjs');
  interpreter = findPython314();
} catch {
  process.stderr.write(
    '[A Team] BLOCKED: Python 3.14 launcher failed to initialize.\n'
  );
  process.exit(2);
}

if (!interpreter) {
  process.stderr.write(
    '[A Team] BLOCKED: no Python 3.14 interpreter found; security gate cannot run.\n'
  );
  process.exit(2);
}

const result = spawnSync(
  interpreter.command,
  [...interpreter.args, '-I', '-S', guardPath],
  {
    input: readFileSync(0),
    stdio: ['pipe', 'inherit', 'inherit'],
  }
);

if (result.error || result.status === null) {
  process.stderr.write('[A Team] BLOCKED: security gate failed to execute.\n');
  process.exit(2);
}

if (result.status !== 0 && result.status !== 2) {
  process.stderr.write(
    `[A Team] BLOCKED: security gate failed to execute (exit ${result.status}).\n`
  );
  process.exit(2);
}

process.exit(result.status);
