import { isIP } from 'node:net';

const DEFAULT_STORYBOOK_URL = 'http://localhost:6006';
const STORYBOOK_COMMAND =
  'node --max-old-space-size=8192 ./node_modules/storybook/dist/bin/dispatcher.js dev';
const STORYBOOK_SERVER_TIMEOUT_MS = 120_000;

// Managed mode starts a local HTTP Storybook server and is loopback-only.
// External mode connects to an existing target: HTTPS may use a remote host,
// while HTTP remains loopback-only to avoid sending test traffic in plaintext.

const isLoopbackHost = (hostname) => {
  const normalized = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (normalized === 'localhost') return true;

  const addressType = isIP(normalized);
  if (addressType === 4) return normalized.startsWith('127.');
  return addressType === 6 && normalized === '::1';
};

const explicitPort = (value) => {
  const authority = /^https?:\/\/([^/?#]+)/i.exec(value)?.[1];
  if (authority === undefined) return undefined;

  const hostPort = authority.slice(authority.lastIndexOf('@') + 1);
  if (hostPort.startsWith('[')) {
    return /^\[[^\]]+\]:(\d+)$/.exec(hostPort)?.[1];
  }
  return /:(\d+)$/.exec(hostPort)?.[1];
};

const parseTargetURL = (value, serverMode) => {
  const portText = explicitPort(value);
  if (portText === undefined) throw new Error('an explicit port is required');

  let target;
  try {
    target = new URL(value);
  } catch {
    throw new Error(
      'the port must be in the valid range or the URL syntax is invalid',
    );
  }
  if (!['http:', 'https:'].includes(target.protocol))
    throw new Error('only http and https URLs are supported');
  if (serverMode === 'managed' && target.protocol !== 'http:')
    throw new Error('managed targets must use http');
  if (target.protocol === 'http:' && !isLoopbackHost(target.hostname))
    throw new Error('only loopback hosts are supported');
  if (target.username !== '' || target.password !== '') {
    throw new Error('credentials are not allowed');
  }
  if (target.pathname !== '/') throw new Error('paths are not allowed');
  if (target.search !== '') throw new Error('queries are not allowed');
  if (target.hash !== '') throw new Error('hashes are not allowed');

  const port = Number(portText);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('the port must be in the valid range');
  }
  return {
    host: target.hostname.replace(/^\[|\]$/g, ''),
    port,
    protocol: target.protocol,
  };
};

const formatHostForURL = (host) => (host.includes(':') ? `[${host}]` : host);

export const resolveStorybookTestTargetImplementation = ({
  url = DEFAULT_STORYBOOK_URL,
  serverMode = 'managed',
  ci = false,
} = {}) => {
  if (serverMode !== 'managed' && serverMode !== 'external') {
    throw new Error('serverMode must be managed or external');
  }
  const { host, port, protocol } = parseTargetURL(url, serverMode);
  const baseURL = `${protocol}//${formatHostForURL(host)}:${port}`;
  const command = `${STORYBOOK_COMMAND} --host ${host} -p ${port} --no-open`;
  return {
    baseURL,
    mcpURL: `${baseURL}/mcp`,
    command,
    webServer:
      serverMode === 'managed'
        ? {
            command,
            url: baseURL,
            reuseExistingServer: !ci,
            timeout: STORYBOOK_SERVER_TIMEOUT_MS,
          }
        : undefined,
  };
};

export const resolveStorybookTestTarget =
  resolveStorybookTestTargetImplementation;
