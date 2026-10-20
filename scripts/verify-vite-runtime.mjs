import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expectedCsp =
  "default-src 'none'; script-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-ancestors 'self'";

const fail = (message) => {
  throw new Error(`[vite-runtime] ${message}`);
};

const assert = (condition, message) => {
  if (!condition) fail(message);
};

const server = await createServer({
  root,
  configFile: path.join(root, 'vite.config.mts'),
  server: {
    host: '127.0.0.1',
    open: false,
    port: 0,
  },
});

try {
  await server.listen();
  const address = server.httpServer?.address();
  assert(
    address && typeof address !== 'string',
    'Vite did not expose a listening address'
  );

  const baseUrl = `http://127.0.0.1:${address.port}`;
  const redirectResponse = await fetch(
    `${baseUrl}/redirect.html?code=redacted`
  );
  assert(
    redirectResponse.ok,
    `redirect.html returned HTTP ${redirectResponse.status}`
  );
  const redirectHtml = await redirectResponse.text();
  assert(
    !redirectHtml.includes('<%=') &&
      !redirectHtml.includes('globalThis.REACT_APP_') &&
      !redirectHtml.includes('globalThis.EXTERNAL_REDIRECT_URL'),
    'redirect.html contains unresolved or legacy environment injection'
  );
  assert(
    redirectResponse.headers.get('cache-control') === 'no-store',
    'redirect.html must return Cache-Control: no-store'
  );
  assert(
    redirectResponse.headers.get('content-security-policy') === expectedCsp,
    'redirect.html returned an unexpected Content-Security-Policy header'
  );
  assert(
    redirectResponse.headers.get('cross-origin-opener-policy') === null,
    'redirect.html must not return Cross-Origin-Opener-Policy'
  );

  const indexResponse = await fetch(`${baseUrl}/`);
  assert(indexResponse.ok, `index.html returned HTTP ${indexResponse.status}`);
  const indexHtml = await indexResponse.text();
  assert(
    !indexHtml.includes('<%=') &&
      !indexHtml.includes('globalThis.REACT_APP_') &&
      !indexHtml.includes('globalThis.EXTERNAL_REDIRECT_URL'),
    'index.html contains unresolved or legacy environment injection'
  );
  assert(
    indexResponse.headers.get('content-security-policy') === null,
    'index.html must not receive the redirect-only CSP header'
  );
  assert(
    indexResponse.headers.get('cache-control') !== 'no-store',
    'index.html must not receive the redirect-only no-store header'
  );

  process.stdout.write(
    '[vite-runtime] passed: redirect headers and index isolation'
  );
} finally {
  await server.close();
}
