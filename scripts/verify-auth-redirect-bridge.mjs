import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const EXPECTED_TITLE = 'Signing in - NMI Portal';
const EXPECTED_CSP =
  "default-src 'none'; script-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-ancestors 'self'";

const fail = (message) => {
  throw new Error(message);
};

const stripQueryAndFragment = (value) => {
  const url = new URL(value);
  if (url.search || url.hash) {
    fail('bridge URL must not contain a query string or fragment');
  }
  return url;
};

const assertRelativeScript = (source) => {
  if (!source || /^(?:[a-z][a-z\d+.-]*:|\/\/|\/)/i.test(source)) {
    fail('bridge script must use a relative same-origin URL');
  }

  const scriptUrl = new URL(source, 'https://bridge.invalid/');
  if (scriptUrl.origin !== 'https://bridge.invalid' || scriptUrl.search || scriptUrl.hash) {
    fail('bridge script must use a relative same-origin URL');
  }

  const normalizedSource = scriptUrl.pathname.toLowerCase();
  if (
    normalizedSource.includes('/main') ||
    normalizedSource.includes('/vendor') ||
    normalizedSource.includes('/analytics') ||
    normalizedSource.includes('/telemetry')
  ) {
    fail('bridge page must not load application or telemetry bundles');
  }
};

export const verifyBridgeHtml = (html) => {
  if (!/<title>\s*Signing in - NMI Portal\s*<\/title>/i.test(html)) {
    fail(`bridge title must be "${EXPECTED_TITLE}"`);
  }

  if (
    /<(?:base|form|iframe|object|embed)\b/i.test(html) ||
    /<meta\b[^>]*http-equiv\s*=\s*["']?refresh\b/i.test(html)
  ) {
    fail('bridge page contains a forbidden element');
  }

  if (/\son[a-z]+\s*=/i.test(html)) {
    fail('bridge page contains an inline event handler');
  }

  const scriptTags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
  if (scriptTags.length !== 1) {
    fail('bridge page must contain exactly one script');
  }

  const [, attributes, body] = scriptTags[0];
  if (body.trim()) {
    fail('bridge page must not contain inline script code');
  }

  const srcMatch = attributes.match(
    /\bsrc\s*=\s*(?:["']([^"']+)["']|([^\s>]+))/i
  );
  const src = srcMatch?.[1] ?? srcMatch?.[2];
  assertRelativeScript(src);

  if (/<(?:link|img|video|audio|source|style)\b/i.test(html)) {
    fail('bridge page must not load external assets');
  }

  return true;
};

export const verifyBridgeDist = async (distDirectory) => {
  const bridgePath = path.join(distDirectory, 'redirect.html');
  const html = await fs.readFile(bridgePath, 'utf8');
  return verifyBridgeHtml(html);
};

export const verifyBridgeResponse = async (response, requestedUrl) => {
  const expectedUrl = stripQueryAndFragment(requestedUrl).href;
  const finalUrl = stripQueryAndFragment(response.url).href;

  if (response.status !== 200) {
    fail('bridge URL must return HTTP 200 without a redirect');
  }
  if (finalUrl !== expectedUrl) {
    fail('bridge URL must resolve to the requested scheme, host, port, and path');
  }
  if (!/\bno-store\b/i.test(response.headers.get('cache-control') ?? '')) {
    fail('bridge response must disable caching');
  }
  if (response.headers.has('cross-origin-opener-policy')) {
    fail('bridge response must not send Cross-Origin-Opener-Policy');
  }
  if (response.headers.get('content-security-policy') !== EXPECTED_CSP) {
    fail('bridge response has an invalid Content-Security-Policy');
  }

  return verifyBridgeHtml(await response.text());
};

const parseArguments = (argumentsList) => {
  const values = new Map();
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--dist' || argument === '--url') {
      const value = argumentsList[index + 1];
      if (!value) {
        fail(`${argument} requires a value`);
      }
      values.set(argument.slice(2), value);
      index += 1;
    } else {
      fail(`unknown option ${argument}`);
    }
  }
  if (!values.has('dist') && !values.has('url')) {
    fail('provide --dist or --url');
  }
  return values;
};

const run = async () => {
  const values = parseArguments(process.argv.slice(2));
  if (values.has('dist')) {
    await verifyBridgeDist(values.get('dist'));
  }
  if (values.has('url')) {
    const url = stripQueryAndFragment(values.get('url')).href;
    const response = await fetch(url, { redirect: 'manual' });
    await verifyBridgeResponse(response, url);
  }
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  run().catch((error) => {
    const message = error instanceof Error ? error.message : 'unknown verification error';
    console.error(`MSAL redirect bridge verification failed: ${message}`);
    process.exitCode = 1;
  });
}
