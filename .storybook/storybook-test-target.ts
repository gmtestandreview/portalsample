import { isIP } from 'node:net';

const DEFAULT_STORYBOOK_URL = 'http://localhost:6006';
const STORYBOOK_COMMAND =
  'node --max-old-space-size=8192 ./node_modules/storybook/dist/bin/dispatcher.js dev';
const STORYBOOK_SERVER_TIMEOUT_MS = 120_000;

export type StorybookServerMode = 'managed' | 'external';

export type StorybookWebServer = {
  command: string;
  url: string;
  reuseExistingServer: boolean;
  timeout: number;
};

export type StorybookTestTarget = {
  baseURL: string;
  mcpURL: string;
  command: string;
  webServer: StorybookWebServer | undefined;
};

export type StorybookTestTargetOptions = {
  url?: string;
  serverMode?: string;
  ci?: boolean;
};

const isLoopbackHost = (hostname: string): boolean => {
  const normalized = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (normalized === 'localhost') return true;

  const addressType = isIP(normalized);
  if (addressType === 4) return normalized.startsWith('127.');
  return addressType === 6 && normalized === '::1';
};

const explicitPort = (value: string): string | undefined => {
  const authority = /^https?:\/\/([^/?#]+)/i.exec(value)?.[1];
  if (authority === undefined) return undefined;

  const hostPort = authority.slice(authority.lastIndexOf('@') + 1);
  if (hostPort.startsWith('[')) {
    return /^\[[^\]]+\]:(\d+)$/.exec(hostPort)?.[1];
  }
  return /:(\d+)$/.exec(hostPort)?.[1];
};

const parseTargetURL = (value: string): { host: string; port: number } => {
  const portText = explicitPort(value);
  if (portText === undefined) throw new Error('an explicit port is required');

  let target: URL;
  try {
    target = new URL(value);
  } catch {
    throw new Error(
      'the port must be in the valid range or the URL syntax is invalid'
    );
  }
  if (target.protocol !== 'http:')
    throw new Error('only http URLs are supported');
  if (!isLoopbackHost(target.hostname))
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
  return { host: target.hostname.replace(/^\[|\]$/g, ''), port };
};

const formatHostForURL = (host: string): string =>
  host.includes(':') ? `[${host}]` : host;

export const resolveStorybookTestTarget = ({
  url = DEFAULT_STORYBOOK_URL,
  serverMode = 'managed',
  ci = false,
}: StorybookTestTargetOptions): StorybookTestTarget => {
  if (serverMode !== 'managed' && serverMode !== 'external') {
    throw new Error('serverMode must be managed or external');
  }
  const { host, port } = parseTargetURL(url);
  const baseURL = `http://${formatHostForURL(host)}:${port}`;
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
