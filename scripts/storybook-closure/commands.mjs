import { execFile } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';

import { FAILURE_CODES, codedError } from './contracts.mjs';

export const execFileAsync = promisify(execFile);

const COMMAND_MAX_BUFFER_BYTES = 10 * 1024 * 1024;
const ICACLS_MAX_BUFFER_BYTES = 2 * 1024 * 1024;

// On Windows the npm shim is a .cmd file, which cannot be spawned without a
// shell; run npm-cli.js through the current node binary instead.
const resolveExecutable = ([command, ...args]) => {
  if (process.platform === 'win32' && command === 'npm') {
    return [
      process.execPath,
      [
        path.join(
          path.dirname(process.execPath),
          'node_modules',
          'npm',
          'bin',
          'npm-cli.js',
        ),
        ...args,
      ],
    ];
  }
  return [command, args];
};

export const runCommand = async (
  commandLine,
  cwd,
  signal,
  env = process.env,
) => {
  const [executable, executableArgs] = resolveExecutable(commandLine);
  try {
    await execFileAsync(executable, executableArgs, {
      cwd,
      env,
      maxBuffer: COMMAND_MAX_BUFFER_BYTES,
      signal,
    });
  } catch (error_) {
    const output = [error_.stdout, error_.stderr]
      .filter((value) => typeof value === 'string' && value.trim() !== '')
      .join('\n')
      .trim();
    if (output) {
      error_.message = `${error_.message}\n${output}`;
    }
    throw error_;
  }
};

const assertIcaclsAvailable = () => {
  if (process.platform !== 'win32') {
    throw codedError(
      FAILURE_CODES.EXECUTION_INCOMPLETE,
      'ACL freeze requires Windows icacls',
    );
  }
};

export const runIcacls = async (target, args) => {
  assertIcaclsAvailable();
  await execFileAsync('icacls.exe', [target, ...args], {
    maxBuffer: ICACLS_MAX_BUFFER_BYTES,
  });
};

// Same invocation as runIcacls, but returns the ACL listing for inspection.
export const captureIcacls = (target, args) =>
  execFileAsync('icacls.exe', [target, ...args], {
    maxBuffer: ICACLS_MAX_BUFFER_BYTES,
  });
