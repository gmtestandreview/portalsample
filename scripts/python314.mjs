'use strict';

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function findPython314() {
  const candidates = [
    { command: 'python3.14', args: [] },
    ...(process.platform === 'win32'
      ? [{ command: 'py', args: ['-3.14'] }]
      : []),
    { command: 'python', args: [] },
    { command: 'python3', args: [] },
  ];
  for (const candidate of candidates) {
    const result = spawnSync(
      candidate.command,
      [
        ...candidate.args,
        '-I',
        '-S',
        '-c',
        'import sys; raise SystemExit(sys.version_info[:2] != (3, 14))',
      ],
      { stdio: 'ignore', timeout: 3000, windowsHide: true }
    );
    if (!result.error && result.status === 0) return candidate;
  }
  return undefined;
}

function runPython314(argv) {
  if (!argv.length) {
    process.stderr.write(
      'Usage: node scripts/python314.mjs <script> [arguments]\n'
    );
    return 1;
  }
  const interpreter = findPython314();
  if (!interpreter) {
    process.stderr.write(
      '[A Team] Python 3.14 is required for hooks and watchers.\n'
    );
    return 1;
  }
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const result = spawnSync(
    interpreter.command,
    [...interpreter.args, resolve(projectDir, argv[0]), ...argv.slice(1)],
    { stdio: 'inherit', windowsHide: true }
  );
  if (result.error || result.status === null) {
    process.stderr.write('[A Team] Python 3.14 script failed to execute.\n');
    return 1;
  }
  return result.status;
}

export { findPython314, runPython314 };

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) {
  process.exit(runPython314(process.argv.slice(2)));
}
