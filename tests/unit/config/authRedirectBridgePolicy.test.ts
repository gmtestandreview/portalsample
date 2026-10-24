import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

import { writeTextFileSync } from '../../helpers/safeTestFilesystem';

const verifier = path.resolve(
  process.cwd(),
  'scripts/verify-auth-redirect-bridge.mjs'
);
const temporaryDirectories: string[] = [];

const validBridge = `<!doctype html>
<html lang="en">
  <head><title>Signing in - NMI Portal</title></head>
  <body><script defer src="./js/redirect.js"></script></body>
</html>`;

const execFileAsync = promisify(execFile);

const runVerifier = async (...argumentsList: string[]) => {
  try {
    await execFileAsync(process.execPath, [verifier, ...argumentsList], {
      encoding: 'utf8',
    });
    return { status: 0, output: '' };
  } catch (error) {
    const result = error as { code?: number; stderr?: string };
    return { status: result.code ?? 1, output: result.stderr ?? '' };
  }
};

const createDist = (html: string) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'msal-bridge-'));
  temporaryDirectories.push(directory);
  writeTextFileSync(path.join(directory, 'redirect.html'), html, directory);
  return directory;
};

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe('mSAL redirect bridge policy', () => {
  it('accepts a title-only page with one relative bridge script', async () => {
    const result = await runVerifier('--dist', createDist(validBridge));

    expect(result.status).toBe(0);
  });

  it.each([
    [
      'inline script',
      validBridge.replace('</script>', "console.log('nope');</script>"),
    ],
    [
      'external script',
      validBridge.replace(
        './js/redirect.js',
        'https://example.test/redirect.js'
      ),
    ],
    [
      'application bundle',
      validBridge.replace('./js/redirect.js', './js/main.js'),
    ],
    [
      'second script',
      validBridge.replace(
        '</body>',
        '<script src="./js/other.js"></script></body>'
      ),
    ],
  ])('rejects %s', async (_description, html) => {
    const result = await runVerifier('--dist', createDist(html));

    expect(result.status).toBe(1);
    expect(result.output).toContain('MSAL redirect bridge verification failed');
  });

  it('rejects a URL with a query or fragment before fetching it', async () => {
    const result = await runVerifier(
      '--url',
      'http://127.0.0.1:3000/redirect.html?code=secret'
    );

    expect(result.status).toBe(1);
    expect(result.output).not.toContain('code=secret');
  });

  it('requires no-store, exact CSP, and no COOP on the served bridge', async () => {
    const server = createServer((_request, response) => {
      response.writeHead(200, {
        'cache-control': 'public, max-age=60',
        'content-security-policy':
          "default-src 'none'; script-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-ancestors 'self'",
      });
      response.end(validBridge);
    });

    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve)
    );
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('test server did not expose a port');
    }

    try {
      const result = await runVerifier(
        '--url',
        `http://127.0.0.1:${address.port}/redirect.html`
      );

      expect(result.status).toBe(1);
      expect(result.output).toContain('bridge response must disable caching');
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      );
    }
  });
});
