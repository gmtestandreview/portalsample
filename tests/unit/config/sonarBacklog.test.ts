import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';

import { spawn, spawnSync } from 'node:child_process';

import { mkdtempSync, rmSync } from 'node:fs';

import { tmpdir } from 'node:os';

import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  pathExists,
  readTextFileSync,
  writeTextFileSync,
} from '../../helpers/safeTestFilesystem';

const repoRoot = path.resolve(__dirname, '../../..');

const CHILD_TIMEOUT_MS = 30_000;

const TEST_TIMEOUT_MS = 45_000;

type RequestHandler = (
  request: IncomingMessage,
  response: ServerResponse,
) => void;

function runScript(
  args: string[],
  environment: Record<string, string> = {},
): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      cwd: repoRoot,
      env: { ...process.env, ...environment },
    });
    let stdout = '';
    let stderr = '';
    let settled = false;

    const finish = (status: number | null, errorMessage?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve({
        status,
        stdout,
        stderr: errorMessage ? `${stderr}${errorMessage}\n` : stderr,
      });
    };

    const timeout = setTimeout(() => {
      child.kill();
      finish(null, `Child process timed out after ${CHILD_TIMEOUT_MS}ms.`);
    }, CHILD_TIMEOUT_MS);

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => finish(null, error.message));
    child.on('close', (status) => finish(status));
  });
}

async function withSonarServer(
  handler: RequestHandler,
  callback: (host: string) => Promise<void>,
) {
  const server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Test Sonar server did not expose a TCP address');
  }

  try {
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

function runBacklog() {
  const outputDirectory = mkdtempSync(path.join(tmpdir(), 'sonar-backlog-'));
  const outputPath = path.join(outputDirectory, 'sonar-issues-backlog.md');
  try {
    const result = spawnSync(
      process.execPath,
      [
        'scripts/sonar-issues-backlog.mjs',
        '--fixture',
        'tests/fixtures/sonar',
        '--out',
        outputPath,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        timeout: CHILD_TIMEOUT_MS,
      },
    );

    return {
      result,
      output:
        result.status === 0
          ? readTextFileSync(outputPath, outputDirectory)
          : '',
    };
  } finally {
    rmSync(outputDirectory, { recursive: true, force: true });
  }
}

describe('sonar all-issue backlog pressure tests', () => {
  it(
    'rED: keeps every Sonar issue returned by every fixture page',
    () => {
      expect.assertions(1);
      const { result, output } = runBacklog();
      expect(result.status, result.stderr).toBe(0);
    },
    TEST_TIMEOUT_MS,
  );
});

describe('sonar all-issue backlog pressure tests', () => {
  it(
    'rED: keeps every Sonar issue returned by every fixture page',
    () => {
      expect.assertions(1);
      const { result, output } = runBacklog();
      expect(output).toContain('SONAR-SECURITY-HIGH');
    },
    TEST_TIMEOUT_MS,
  );
});

describe('sonar all-issue backlog pressure tests', () => {
  it(
    'rED: keeps every Sonar issue returned by every fixture page',
    () => {
      expect.assertions(1);
      const { result, output } = runBacklog();
      expect(output).toContain('SONAR-BUG-MEDIUM');
    },
    TEST_TIMEOUT_MS,
  );
});

describe('sonar all-issue backlog pressure tests', () => {
  it(
    'rED: keeps every Sonar issue returned by every fixture page',
    () => {
      expect.assertions(1);
      const { result, output } = runBacklog();
      expect(output).toContain('SONAR-ACCEPTED-LOW');
    },
    TEST_TIMEOUT_MS,
  );
});

describe('sonar all-issue backlog pressure tests', () => {
  it(
    'rED: keeps every Sonar issue returned by every fixture page',
    () => {
      expect.assertions(1);
      const { result, output } = runBacklog();
      expect(output).toContain('SONAR-UNKNOWN-SEVERITY');
    },
    TEST_TIMEOUT_MS,
  );
});
