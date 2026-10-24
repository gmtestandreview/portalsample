import { spawnSync } from 'node:child_process';
import type { SpawnSyncReturns } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface PythonInterpreter {
  command: string;
  args: string[];
}

// Anchor to this file's directory so a cwd change cannot relocate the guard.
const scriptDir: string = dirname(fileURLToPath(import.meta.url));
const guardPath: string = resolve(scriptDir, 'pre_tool_use.py');

if (!existsSync(guardPath)) {
  process.stderr.write(
    '[A Team] BLOCKED: security gate missing (guard script not found)\n'
  );
  process.exit(2);
}

// Atom 4: dynamic import so a missing python314.mjs fails here, not at module load
// time before the existsSync guard above can run.
const python314ModulePath = './python314.mjs';
const { findPython314 } = (await import(python314ModulePath)) as {
  findPython314: () => PythonInterpreter | undefined;
};

let interpreter: PythonInterpreter | undefined;
try {
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

let inputData: Buffer | undefined;
if (!process.stdin.isTTY) {
  try {
    inputData = readFileSync(0);
  } catch {
    inputData = undefined;
  }
}

const EXIT_SUCCESS = 0;
const EXIT_BLOCKED = 2;

// Atom 7: properly closed spawnSync call.
// stdio[0]='pipe' feeds inputData to Python stdin.
// stdio[1,2]='inherit' forwards Python blocking messages to Claude Code output.
const result: SpawnSyncReturns<Buffer> = spawnSync(
  interpreter.command,
  [...interpreter.args, '-I', '-S', guardPath],
  {
    input: inputData,
    stdio: ['pipe', 'inherit', 'inherit'],
  }
);

// Atom 8: single exit-code check, null-safe fallback, no orphaned tokens.
if (result.status !== EXIT_SUCCESS && result.status !== EXIT_BLOCKED) {
  process.stderr.write(
    `[A Team] BLOCKED: security gate failed to execute (exit ${result.status ?? 'null'}).\n`
  );
  process.exit(EXIT_BLOCKED);
}

process.exit(result.status ?? EXIT_BLOCKED);
