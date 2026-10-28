import { resolveStorybookTestTargetImplementation } from '../../.storybook/storybook-test-target.mjs';

import { isRecord } from './contracts.mjs';

export const DEFAULT_MCP_TIMEOUT_MS = 3_600_000;

const SERVER_MODES = new Set(['managed', 'external']);
const OPTION_FLAGS = new Set([
  '--checkout',
  '--url',
  '--server-mode',
  '--receipts',
  '--mcp-timeout-ms',
]);

export const assertPositiveTimeout = (value) =>
  Number.isFinite(value) && Number.isInteger(value) && value > 0;

export const assertPermittedUrl = (value, serverMode) => {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return 'url must be an absolute URL';
  }
  if (parsed.username || parsed.password) {
    return 'url must not contain credentials';
  }
  try {
    resolveStorybookTestTargetImplementation({ url: value, serverMode });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'only loopback hosts are supported'
    ) {
      return 'http targets must use a loopback hostname';
    }
    return error instanceof Error ? error.message : String(error);
  }
  return undefined;
};

export const assertOptions = (options) => {
  if (
    !isRecord(options) ||
    typeof options.checkout !== 'string' ||
    options.checkout === ''
  ) {
    return 'checkout is required';
  }
  if (typeof options.url !== 'string' || options.url === '')
    return 'url is required';
  if (!SERVER_MODES.has(options.serverMode)) {
    return 'serverMode must be managed or external';
  }
  const urlError = assertPermittedUrl(options.url, options.serverMode);
  if (urlError) return urlError;
  if (typeof options.receipts !== 'string' || options.receipts === '') {
    return 'receipts is required';
  }
  const timeout = options.mcpTimeoutMs ?? DEFAULT_MCP_TIMEOUT_MS;
  if (!assertPositiveTimeout(timeout)) {
    return 'mcpTimeoutMs must be a positive finite integer';
  }
  return undefined;
};

// Flags are consumed strictly as `--flag value` pairs; stepping by two keeps
// every argv access bounded by the slice rather than a free-running index.
const readFlagPairs = (argv) => {
  const values = new Map();
  for (let offset = 0; offset < argv.length; offset += 2) {
    const [flag, value] = argv.slice(offset, offset + 2);
    if (
      !OPTION_FLAGS.has(flag) ||
      value === undefined ||
      value.startsWith('--')
    ) {
      return {
        ok: false,
        message: `invalid or incomplete option: ${flag ?? '(missing)'}`,
      };
    }
    values.set(flag, value);
  }
  return { ok: true, values };
};

export const parseArguments = (argv) => {
  const pairs = readFlagPairs(argv);
  if (!pairs.ok) return pairs;
  const { values } = pairs;

  const options = {
    checkout: values.get('--checkout'),
    url: values.get('--url'),
    serverMode: values.get('--server-mode'),
    receipts: values.get('--receipts'),
    mcpTimeoutMs: values.has('--mcp-timeout-ms')
      ? Number(values.get('--mcp-timeout-ms'))
      : undefined,
  };
  const optionError = assertOptions(options);
  return optionError
    ? { ok: false, message: optionError }
    : { ok: true, options };
};
