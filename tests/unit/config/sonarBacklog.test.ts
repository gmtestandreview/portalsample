import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '../../..');
const CHILD_TIMEOUT_MS = 30_000;
const TEST_TIMEOUT_MS = 45_000;
type RequestHandler = (
  request: IncomingMessage,
  response: ServerResponse
) => void;

function runScript(
  args: string[],
  environment: Record<string, string> = {}
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
  callback: (host: string) => Promise<void>
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
      server.close((error) => (error ? reject(error) : resolve()))
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
      }
    );

    return {
      result,
      output: result.status === 0 ? readFileSync(outputPath, 'utf8') : '',
    };
  } finally {
    rmSync(outputDirectory, { recursive: true, force: true });
  }
}

describe('Sonar all-issue backlog pressure tests', () => {
  it(
    'RED: keeps every Sonar issue returned by every fixture page',
    () => {
      const { result, output } = runBacklog();

      expect(result.status, result.stderr).toBe(0);
      expect(output).toContain('SONAR-SECURITY-HIGH');
      expect(output).toContain('SONAR-BUG-MEDIUM');
      expect(output).toContain('SONAR-ACCEPTED-LOW');
      expect(output).toContain('SONAR-UNKNOWN-SEVERITY');
      expect(output).toContain('SONAR-INFO-LOW');
    },
    TEST_TIMEOUT_MS
  );

  it(
    'GREEN: prioritises security and reliability ahead of low maintainability work',
    () => {
      const { output } = runBacklog();

      expect(output.indexOf('SONAR-SECURITY-HIGH')).toBeLessThan(
        output.indexOf('SONAR-BUG-MEDIUM')
      );
      expect(output.indexOf('SONAR-BUG-MEDIUM')).toBeLessThan(
        output.indexOf('SONAR-INFO-LOW')
      );
    },
    TEST_TIMEOUT_MS
  );

  it(
    'AMBER: preserves unknown future Sonar shapes as triage work instead of dropping them',
    () => {
      const { result, output } = runBacklog();

      expect(result.stdout).toContain('AMBER');
      expect(output).toContain('Needs triage');
      expect(output).toContain('SONAR-UNKNOWN-SEVERITY');
    },
    TEST_TIMEOUT_MS
  );

  it(
    'RED: never writes authentication material into the backlog artifact',
    () => {
      const { output } = runBacklog();

      expect(output).not.toContain('SONAR_TOKEN');
      expect(output).not.toContain('Bearer ');
    },
    TEST_TIMEOUT_MS
  );

  it('rejects fixture files with malformed issue entries', () => {
    const fixtureDirectory = mkdtempSync(path.join(tmpdir(), 'sonar-invalid-'));
    const outputPath = path.join(fixtureDirectory, 'output.md');
    writeFileSync(
      path.join(fixtureDirectory, 'invalid.json'),
      JSON.stringify({
        issues: [{ key: 'INVALID', message: { text: 'wrong type' } }],
      })
    );

    try {
      const result = spawnSync(
        process.execPath,
        [
          'scripts/sonar-issues-backlog.mjs',
          '--fixture',
          fixtureDirectory,
          '--out',
          outputPath,
        ],
        { cwd: repoRoot, encoding: 'utf8' }
      );

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('message must be a string');
      expect(existsSync(outputPath)).toBe(false);
    } finally {
      rmSync(fixtureDirectory, { recursive: true, force: true });
    }
  });

  it('rejects fixture pages with duplicate issue keys', () => {
    const fixtureDirectory = mkdtempSync(
      path.join(tmpdir(), 'sonar-duplicate-')
    );
    const outputPath = path.join(fixtureDirectory, 'output.md');
    const issue = {
      key: 'DUPLICATE',
      component: 'demo:file.ts',
      line: 1,
      severity: 'INFO',
      type: 'CODE_SMELL',
      message: 'duplicate',
    };
    writeFileSync(
      path.join(fixtureDirectory, 'page-1.json'),
      JSON.stringify({ issues: [issue] })
    );
    writeFileSync(
      path.join(fixtureDirectory, 'page-2.json'),
      JSON.stringify({ issues: [issue] })
    );

    try {
      const result = spawnSync(
        process.execPath,
        [
          'scripts/sonar-issues-backlog.mjs',
          '--fixture',
          fixtureDirectory,
          '--out',
          outputPath,
        ],
        { cwd: repoRoot, encoding: 'utf8' }
      );

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('duplicate issue key DUPLICATE');
      expect(existsSync(outputPath)).toBe(false);
    } finally {
      rmSync(fixtureDirectory, { recursive: true, force: true });
    }
  });

  it('rejects malformed array-valued ranking fields in fixtures', () => {
    const fixtureDirectory = mkdtempSync(path.join(tmpdir(), 'sonar-ranking-'));
    const outputPath = path.join(fixtureDirectory, 'output.md');
    writeFileSync(
      path.join(fixtureDirectory, 'invalid.json'),
      JSON.stringify({
        issues: [
          {
            key: 'INVALID-RANKING',
            impactSeverities: { 0: 'HIGH' },
          },
        ],
      })
    );

    try {
      const result = spawnSync(
        process.execPath,
        [
          'scripts/sonar-issues-backlog.mjs',
          '--fixture',
          fixtureDirectory,
          '--out',
          outputPath,
        ],
        { cwd: repoRoot, encoding: 'utf8' }
      );

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        'impactSeverities must be an array of strings'
      );
      expect(existsSync(outputPath)).toBe(false);
    } finally {
      rmSync(fixtureDirectory, { recursive: true, force: true });
    }
  });

  it(
    'retries a transient live Sonar failure before writing the backlog',
    async () => {
      let requestCount = 0;

      await withSonarServer(
        (request, response) => {
          void request;
          requestCount += 1;
          response.setHeader('content-type', 'application/json');
          if (requestCount === 1) {
            response.statusCode = 503;
            response.end(JSON.stringify({ error: 'temporary failure' }));
            return;
          }

          response.end(
            JSON.stringify({
              paging: { total: 1 },
              issues: [
                {
                  key: 'LIVE-RETRY',
                  component: 'demo:file.ts',
                  line: 1,
                  severity: 'INFO',
                  type: 'CODE_SMELL',
                  message: 'retried',
                },
              ],
            })
          );
        },
        async (host) => {
          const outputDirectory = mkdtempSync(
            path.join(tmpdir(), 'sonar-retry-')
          );
          try {
            const outputPath = path.join(outputDirectory, 'backlog.md');
            const result = await runScript(
              ['scripts/sonar-issues-backlog.mjs', '--out', outputPath],
              {
                SONAR_HOST_URL: host,
                SONAR_TOKEN: 'test-token',
                SONAR_PROJECT_KEY: 'demo-project',
              }
            );

            expect(result.status).toBe(0);
            expect(requestCount).toBe(2);
            expect(readFileSync(outputPath, 'utf8')).toContain('LIVE-RETRY');
          } finally {
            rmSync(outputDirectory, { recursive: true, force: true });
          }
        }
      );
    },
    TEST_TIMEOUT_MS
  );

  it(
    'fails instead of looping when live pagination returns an empty page',
    async () => {
      let requestCount = 0;

      await withSonarServer(
        (request, response) => {
          void request;
          requestCount += 1;
          response.setHeader('content-type', 'application/json');
          response.end(
            JSON.stringify({
              paging: { total: 2 },
              issues:
                requestCount === 1
                  ? [
                      {
                        key: 'LIVE-FIRST',
                        component: 'demo:file.ts',
                        line: 1,
                        severity: 'INFO',
                        type: 'CODE_SMELL',
                        message: 'first page',
                      },
                    ]
                  : [],
            })
          );
        },
        async (host) => {
          const outputDirectory = mkdtempSync(
            path.join(tmpdir(), 'sonar-empty-page-')
          );
          try {
            const outputPath = path.join(outputDirectory, 'backlog.md');
            const result = await runScript(
              ['scripts/sonar-issues-backlog.mjs', '--out', outputPath],
              {
                SONAR_HOST_URL: host,
                SONAR_TOKEN: 'test-token',
                SONAR_PROJECT_KEY: 'demo-project',
              }
            );

            expect(result.status).not.toBe(0);
            expect(`${result.stdout}\n${result.stderr}`).toContain(
              'pagination made no progress'
            );
            expect(requestCount).toBe(2);
          } finally {
            rmSync(outputDirectory, { recursive: true, force: true });
          }
        }
      );
    },
    TEST_TIMEOUT_MS
  );

  it(
    'aborts a stalled live Sonar request at the configured timeout',
    async () => {
      await withSonarServer(
        (request, response) => {
          void request;
          setTimeout(() => {
            response.setHeader('content-type', 'application/json');
            response.end(JSON.stringify({ paging: { total: 0 }, issues: [] }));
          }, 100);
        },
        async (host) => {
          const outputDirectory = mkdtempSync(
            path.join(tmpdir(), 'sonar-timeout-')
          );
          try {
            const outputPath = path.join(outputDirectory, 'backlog.md');
            const result = await runScript(
              ['scripts/sonar-issues-backlog.mjs', '--out', outputPath],
              {
                SONAR_HOST_URL: host,
                SONAR_TOKEN: 'test-token',
                SONAR_PROJECT_KEY: 'demo-project',
                SONAR_REQUEST_TIMEOUT_MS: '10',
                SONAR_MAX_REQUEST_ATTEMPTS: '1',
              }
            );

            expect(result.status).not.toBe(0);
            expect(result.stderr).toContain('timed out after 10ms');
            expect(existsSync(outputPath)).toBe(false);
          } finally {
            rmSync(outputDirectory, { recursive: true, force: true });
          }
        }
      );
    },
    TEST_TIMEOUT_MS
  );

  it(
    'rejects live pages without a total instead of truncating the backlog',
    async () => {
      let requestCount = 0;

      await withSonarServer(
        (request, response) => {
          void request;
          requestCount += 1;
          response.setHeader('content-type', 'application/json');
          response.end(
            JSON.stringify({
              issues: [
                {
                  key: 'LIVE-NO-TOTAL',
                  component: 'demo:file.ts',
                  line: 1,
                  severity: 'INFO',
                  type: 'CODE_SMELL',
                  message: 'missing total',
                },
              ],
            })
          );
        },
        async (host) => {
          const result = await runScript(['scripts/sonar-issues-backlog.mjs'], {
            SONAR_HOST_URL: host,
            SONAR_TOKEN: 'test-token',
            SONAR_PROJECT_KEY: 'demo-project',
          });

          expect(result.status).not.toBe(0);
          expect(result.stderr).toContain(
            'must include a non-negative integer total'
          );
          expect(requestCount).toBe(1);
        }
      );
    },
    TEST_TIMEOUT_MS
  );

  it(
    'rejects duplicate issue keys across live pages',
    async () => {
      let requestCount = 0;

      await withSonarServer(
        (request, response) => {
          void request;
          requestCount += 1;
          response.setHeader('content-type', 'application/json');
          response.end(
            JSON.stringify({
              paging: { total: 2 },
              issues: [
                {
                  key: 'LIVE-DUPLICATE',
                  component: 'demo:file.ts',
                  line: 1,
                  severity: 'INFO',
                  type: 'CODE_SMELL',
                  message: 'duplicate',
                },
              ],
            })
          );
        },
        async (host) => {
          const result = await runScript(['scripts/sonar-issues-backlog.mjs'], {
            SONAR_HOST_URL: host,
            SONAR_TOKEN: 'test-token',
            SONAR_PROJECT_KEY: 'demo-project',
          });

          expect(result.status).not.toBe(0);
          expect(result.stderr).toContain('duplicate issue key LIVE-DUPLICATE');
          expect(requestCount).toBe(2);
        }
      );
    },
    TEST_TIMEOUT_MS
  );
});
