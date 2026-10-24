/* eslint-disable security/detect-non-literal-fs-filename, security/detect-object-injection, security/detect-unsafe-regex */
import { execFile, spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  appendFile,
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

import {
  computeInputDigest,
  computeIndexDigest,
  deriveExecutableStorySet,
  normalizeMcpReceipt,
  parseJsonDocument,
  validateFreezeRecord,
  validateProducerIdentity,
} from './storybook-coverage.mjs';

const execFileAsync = promisify(execFile);
const MANAGED_SERVER_SHUTDOWN_TIMEOUT_MS = 15_000;
const MAX_MANAGED_SERVER_STDERR_LENGTH = 1_000_000;
const MCP_STORY_BATCH_SIZE = 50;

const FAILURE_CODES = {
  INVALID_INVOCATION: 'INVALID_INVOCATION',
  INPUT_STALE: 'INPUT_STALE',
  EXECUTION_INCOMPLETE: 'EXECUTION_INCOMPLETE',
};

const STORYBOOK_INPUT_ROOTS = [
  'ClientApp/src',
  'ClientApp/public',
  'ClientApp/media',
  '.storybook',
  'scripts',
  'tests',
  'patches',
];

const STORYBOOK_ROOT_INPUT_PATTERNS = [
  /^[^\\/]*\.config\.[^\\/]+$/u,
  /^vitest.*\..+$/u,
  /^tsconfig.*\.json$/u,
  /^\.prettierrc.*$/u,
  /^\.env(?:\.[^\\/]*)?$/u,
];

const collectInputFiles = (checkout) => {
  const files = [];
  const includedFiles = new Set();
  const resolvedCheckout = realpathSync(checkout);
  const visit = (absolutePath) => {
    const resolvedPath = realpathSync(absolutePath);
    const relativeToCheckout = path.relative(resolvedCheckout, resolvedPath);
    if (
      relativeToCheckout.startsWith('..') ||
      path.isAbsolute(relativeToCheckout)
    ) {
      throw new Error(
        `input symlink escapes the owned checkout: ${absolutePath}`,
      );
    }
    const stat = statSync(resolvedPath);
    if (stat.isDirectory()) {
      for (const child of readdirSync(absolutePath))
        visit(path.join(absolutePath, child));
      return;
    }
    const relativePath = path
      .relative(checkout, absolutePath)
      .replaceAll(path.sep, '/');
    if (!includedFiles.has(relativePath)) {
      includedFiles.add(relativePath);
      files.push({ path: relativePath, content: readFileSync(absolutePath) });
    }
  };
  for (const inputRoot of STORYBOOK_INPUT_ROOTS) {
    const absolutePath = path.resolve(checkout, inputRoot);
    visit(absolutePath);
  }
  const rootInputFiles = new Set(
    readdirSync(checkout).filter((inputFile) =>
      STORYBOOK_ROOT_INPUT_PATTERNS.some((pattern) => pattern.test(inputFile)),
    ),
  );
  for (const inputFile of [
    'package.json',
    'package-lock.json',
    'npm-shrinkwrap.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'vite.config.ts',
    'vite.config.mts',
    'vitest.unit.config.ts',
    'vitest.storybook.config.ts',
    'vitest.storybook.runtime.ts',
  ])
    rootInputFiles.add(inputFile);
  for (const inputFile of rootInputFiles) {
    const absolutePath = path.resolve(checkout, inputFile);
    try {
      files.push({
        path: inputFile,
        content: readFileSync(absolutePath),
      });
    } catch (error_) {
      if (error_.code !== 'ENOENT') throw error_;
    }
  }
  return files;
};

const producerIdentityDigest = (producer) => {
  const stableFields = {
    checkout: producer.checkout,
    commit: producer.commit,
    cwd: producer.cwd,
    freezeId: producer.freezeId,
    inputDigest: producer.inputDigest,
    launchArguments: producer.launchArguments,
    mcpURL: producer.mcpURL,
    producerId: producer.producerId,
    serverPid: producer.serverPid,
    serverStartedAt: producer.serverStartedAt,
  };
  return `sha256:${createHash('sha256')
    .update(JSON.stringify(stableFields))
    .digest('hex')}`;
};

const GATES = [
  ['gate-1-type-check', ['npm', 'run', 'type-check']],
  ['gate-2-lint', ['npm', 'run', 'lint']],
  [
    'gate-3-unit',
    [
      'npm',
      'run',
      'test:unit',
      '--',
      'tests/unit/storybook',
      'tests/unit/config/vitestTopology.test.ts',
      'tests/unit/config/storybookRuntimePolicy.test.ts',
    ],
  ],
  [
    'gate-4-source',
    ['node', 'scripts/storybook-coverage.mjs', '--mode', 'source'],
  ],
  ['gate-5-storybook-build', ['npm', 'run', 'build-storybook']],
  [
    'gate-6-references',
    [
      'node',
      'scripts/storybook-coverage.mjs',
      '--mode',
      'references',
      '--index',
      'storybook-static/index.json',
    ],
  ],
  [
    'gate-7-storybook-bdd',
    ['npm', 'run', 'test:e2e:storybook', '--', '--workers=1'],
  ],
  ['gate-8-docs', ['npm', 'run', 'storybook:verify:docs']],
  [
    'gate-9-closure',
    [
      'node',
      'scripts/storybook-coverage.mjs',
      '--mode',
      'closure',
      '--index',
      'reports/storybook-coverage/frozen-full-index.json',
      '--docs-index',
      'reports/storybook-coverage/frozen-docs-index.json',
      '--receipts',
      'reports/storybook-coverage/closure-run',
    ],
  ],
];

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const failure = (code, message, phases) => ({
  ok: false,
  code,
  message,
  phases: [...phases],
});

const assertPositiveTimeout = (value) =>
  Number.isFinite(value) && Number.isInteger(value) && value > 0;

const isLoopbackHostname = (hostname) =>
  ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname);

const assertPermittedUrl = (value, serverMode) => {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return 'url must be an absolute URL';
  }
  if (parsed.username || parsed.password) {
    return 'url must not contain credentials';
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return 'url scheme must be http or https';
  }
  if (parsed.protocol === 'http:' && !isLoopbackHostname(parsed.hostname)) {
    return 'http targets must use a loopback hostname';
  }
  if (serverMode === 'managed' && !isLoopbackHostname(parsed.hostname)) {
    return 'managed Storybook targets must use a loopback hostname';
  }
  return undefined;
};

const throwIfAborted = (signal) => {
  if (!signal?.aborted) return;
  const reason = signal.reason;
  throw Object.assign(
    new Error(
      reason instanceof Error ? reason.message : 'closure was interrupted',
    ),
    { code: FAILURE_CODES.EXECUTION_INCOMPLETE },
  );
};

const assertOptions = (options) => {
  if (
    !isRecord(options) ||
    typeof options.checkout !== 'string' ||
    options.checkout === ''
  ) {
    return 'checkout is required';
  }
  if (typeof options.url !== 'string' || options.url === '')
    return 'url is required';
  if (!['managed', 'external'].includes(options.serverMode)) {
    return 'serverMode must be managed or external';
  }
  const urlError = assertPermittedUrl(options.url, options.serverMode);
  if (urlError) return urlError;
  if (typeof options.receipts !== 'string' || options.receipts === '') {
    return 'receipts is required';
  }
  const timeout = options.mcpTimeoutMs ?? 3_600_000;
  if (!assertPositiveTimeout(timeout)) {
    return 'mcpTimeoutMs must be a positive finite integer';
  }
  return undefined;
};

const assertResult = (value, fallbackMessage) => {
  if (!isRecord(value) || value.ok !== true) {
    const message =
      isRecord(value) && Array.isArray(value.errors) && value.errors.length > 0
        ? value.errors.map((entry) => entry.message).join('; ')
        : fallbackMessage;
    throw Object.assign(new Error(message), {
      code: FAILURE_CODES.EXECUTION_INCOMPLETE,
    });
  }
};

const assertGate = (gate, context) => {
  if (!isRecord(gate) || gate.ok !== true) {
    throw Object.assign(new Error(`gate failed: ${context.name}`), {
      code: FAILURE_CODES.EXECUTION_INCOMPLETE,
    });
  }
  if (
    gate.inputDigest !== context.inputDigest ||
    gate.producerIdentityDigest !== context.producerIdentityDigest ||
    gate.freezeId !== context.freezeId
  ) {
    throw Object.assign(
      new Error(`gate input identity changed: ${context.name}`),
      {
        code: FAILURE_CODES.INPUT_STALE,
      },
    );
  }
};

const assertHandoff = (completion, freeze, producer) => {
  if (
    !isRecord(completion) ||
    completion.freezeId !== freeze.freezeId ||
    completion.producerId !== producer.producerId ||
    !Array.isArray(completion.receiptFiles) ||
    completion.receiptFiles.length === 0 ||
    completion.receiptFiles.some(
      (file) =>
        typeof file !== 'string' ||
        file.includes('..') ||
        path.isAbsolute(file),
    )
  ) {
    throw Object.assign(new Error('MCP handoff is missing or stale'), {
      code: FAILURE_CODES.EXECUTION_INCOMPLETE,
    });
  }
};

const runGateSequence = async (gates, context, phases, adapters) => {
  for (const [name] of gates) {
    throwIfAborted(context.signal);
    const gate = await adapters.runGate(name, context);
    phases.push(name);
    assertGate(gate, { ...context, name });
    await adapters.assertStableIdentity(context);
  }
};

const collectAndValidateReceipts = async (
  completion,
  context,
  options,
  adapters,
) => {
  const { freeze, producer, target } = context;
  const receipts = [];
  for (const receiptFile of completion.receiptFiles) {
    const receipt = await adapters.readReceipt({
      receipts: options.receipts,
      receiptFile,
    });
    const normalized = adapters.normalizeReceipt({
      value: receipt,
      freeze,
      producer,
      target,
    });
    assertResult(normalized, `receipt is invalid: ${receiptFile}`);
    const expectedChildEpoch = await adapters.observeChildEpoch({
      receipt,
      freeze,
      producer,
    });
    assertResult(
      adapters.validateProducerIdentity({
        producer,
        receipt,
        expectedMcpURL: target.mcpURL,
        expectedFreezeId: freeze.freezeId,
        expectedChildEpoch,
      }),
      `receipt producer identity is invalid: ${receiptFile}`,
    );
    receipts.push(normalized.receipt);
  }
  return receipts;
};

export async function runClosure(options, adapters) {
  const phases = [];
  const optionError = assertOptions(options);
  if (optionError)
    return failure(FAILURE_CODES.INVALID_INVOCATION, optionError, phases);

  const timeout = options.mcpTimeoutMs ?? 3_600_000;
  let freeze;
  let producer;
  let outcome;
  const signal = options.signal;

  try {
    throwIfAborted(signal);
    const target = await adapters.resolveTarget({
      url: options.url,
      serverMode: options.serverMode,
      ci: true,
    });
    const targetUrlError = assertPermittedUrl(
      target?.mcpURL ?? options.url,
      options.serverMode,
    );
    if (targetUrlError) throw new Error(targetUrlError);
    await adapters.assertOwnedPaths({
      checkout: options.checkout,
      receipts: options.receipts,
    });
    phases.push('paths');

    freeze = await adapters.acquireFreeze({
      checkout: options.checkout,
      receipts: options.receipts,
      target,
      signal,
    });
    phases.push('freeze');
    assertResult(
      await adapters.validateFreezeRecord({
        freeze,
        expectedInputDigest: freeze.inputDigest,
        selectedPaths: freeze.protectedPaths,
      }),
      'freeze record is invalid',
    );

    producer = await adapters.establishProducer({
      checkout: options.checkout,
      receipts: options.receipts,
      target,
      freeze,
      serverMode: options.serverMode,
      signal,
    });
    phases.push('producer');

    const context = {
      checkout: options.checkout,
      target,
      freeze,
      freezeId: freeze.freezeId,
      inputDigest: freeze.inputDigest,
      producerId: producer.producerId,
      producerIdentityDigest: producer.producerIdentityDigest,
      producer,
      signal,
    };

    await runGateSequence(GATES.slice(0, 6), context, phases, adapters);

    await adapters.writeAwaitingMcp({
      checkout: options.checkout,
      receipts: options.receipts,
      freeze,
      producer,
      target,
      timeout,
      signal,
    });
    phases.push('awaiting-mcp');

    const completion = await adapters.produceMcpReceipts({
      receipts: options.receipts,
      freeze,
      producer,
      timeout,
    });
    phases.push('mcp-receipts');
    assertHandoff(completion, freeze, producer);

    const receipts = await collectAndValidateReceipts(
      completion,
      context,
      options,
      adapters,
    );
    context.childEpoch = receipts[0]?.childEpoch;

    await runGateSequence(GATES.slice(6), context, phases, adapters);

    outcome = { ok: true, phases };
  } catch (error_) {
    const errorCode =
      isRecord(error_) && typeof error_.code === 'string'
        ? error_.code
        : FAILURE_CODES.EXECUTION_INCOMPLETE;
    outcome = failure(
      errorCode,
      error_ instanceof Error ? error_.message : String(error_),
      phases,
    );
  } finally {
    let cleanupError;
    if (freeze) {
      try {
        await adapters.releaseFreeze({
          checkout: options.checkout,
          receipts: options.receipts,
          freeze,
        });
      } catch (error_) {
        cleanupError = error_;
      }
      phases.push('release-freeze');
    }
    try {
      await adapters.stopOwnedServer?.({
        producer,
        checkout: options.checkout,
      });
    } catch (error_) {
      cleanupError ??= error_;
    }
    phases.push('stop-server');
    if (cleanupError) {
      const cleanupMessage =
        cleanupError instanceof Error
          ? cleanupError.message
          : String(cleanupError);
      if (outcome?.ok) {
        outcome = failure(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          cleanupMessage,
          phases,
        );
      } else {
        outcome = {
          ...outcome,
          ok: false,
          code: FAILURE_CODES.EXECUTION_INCOMPLETE,
          message: `${outcome.message}; cleanup failed: ${cleanupMessage}`,
        };
      }
    }
  }

  if (!outcome) {
    return failure(
      FAILURE_CODES.EXECUTION_INCOMPLETE,
      'closure ended without a result',
      phases,
    );
  }
  return { ...outcome, phases };
}

const parseArguments = (argv) => {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (
      ![
        '--checkout',
        '--url',
        '--server-mode',
        '--receipts',
        '--mcp-timeout-ms',
      ].includes(flag) ||
      value === undefined ||
      value.startsWith('--')
    ) {
      return {
        ok: false,
        message: `invalid or incomplete option: ${flag ?? '(missing)'}`,
      };
    }
    values.set(flag, value);
    index += 1;
  }

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

const createProductionAdapters = async () => {
  const { resolveStorybookTestTarget } =
    await import('../.storybook/storybook-test-target.mjs').then(
      ({ resolveStorybookTestTargetImplementation }) => ({
        resolveStorybookTestTarget: resolveStorybookTestTargetImplementation,
      }),
    );
  let ownedServer;
  let ownedServerMetadata;
  let ownedServerExitPromise;
  let ownedServerExitStatus;
  let ownedServerStderr = '';
  let ownedServerStderrTruncated = false;
  let ownedCheckout;
  let ownedReceipts;
  let activeFreeze;
  let frozenTargets = [];
  let freezeIdentity;

  const writeReceiptJson = async (fileName, value) => {
    if (!ownedReceipts)
      throw new Error('owned receipt directory is not established');
    await writeFile(
      path.join(ownedReceipts, fileName),
      JSON.stringify(value, null, 2),
      'utf8',
    );
  };

  const resolveInside = (root, candidate) => {
    const rootPath = path.resolve(root);
    const candidatePath = path.resolve(root, candidate);
    const relative = path.relative(rootPath, candidatePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`path is outside the owned checkout: ${candidate}`);
    }
    return candidatePath;
  };

  const resolveOwnedPath = async (root, candidate) => {
    const candidatePath = resolveInside(root, candidate);
    const resolvedRoot = await realpath(root);
    const resolvedCandidate = await realpath(candidatePath);
    const relative = path.relative(resolvedRoot, resolvedCandidate);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`symlink escapes the owned checkout: ${candidate}`);
    }
    return resolvedCandidate;
  };

  const runCommand = async (
    [command, ...args],
    cwd,
    signal,
    env = process.env,
  ) => {
    const [executable, executableArgs] =
      process.platform === 'win32' && command === 'npm'
        ? [
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
          ]
        : [command, args];
    try {
      await execFileAsync(executable, executableArgs, {
        cwd,
        env,
        maxBuffer: 10 * 1024 * 1024,
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

  const runIcacls = async (target, args) => {
    if (process.platform !== 'win32') {
      throw Object.assign(new Error('ACL freeze requires Windows icacls'), {
        code: FAILURE_CODES.EXECUTION_INCOMPLETE,
      });
    }
    await execFileAsync('icacls.exe', [target, ...args], {
      maxBuffer: 2 * 1024 * 1024,
    });
  };

  const assertFreezeIdentityNotDenied = async (target, identity) => {
    const { stdout, stderr } = await execFileAsync(
      'icacls.exe',
      [target, '/t', '/c'],
      { maxBuffer: 2 * 1024 * 1024 },
    );
    const output = `${stdout}\n${stderr}`;
    if (
      output
        .split(/\r?\n/u)
        .some((line) => line.includes(identity) && line.includes('(DENY)'))
    ) {
      throw Object.assign(
        new Error(`ACL freeze deny entry remains for ${identity}`),
        { code: FAILURE_CODES.EXECUTION_INCOMPLETE },
      );
    }
  };

  const waitForServer = async (url, timeout, signal) => {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      throwIfAborted(signal);
      try {
        const response = await fetch(url, {
          signal: signal
            ? AbortSignal.any([signal, AbortSignal.timeout(2_000)])
            : AbortSignal.timeout(2_000),
        });
        if (response.ok || response.status < 500) return;
      } catch {
        throwIfAborted(signal);
        // Readiness is bounded by the loop deadline.
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(`Storybook server did not become ready: ${url}`);
  };

  const currentIdentity = () => {
    const username = process.env.USERNAME;
    if (!username)
      throw new Error('Windows username is required for ACL freeze');
    return process.env.USERDOMAIN
      ? `${process.env.USERDOMAIN}\\${username}`
      : username;
  };

  const runDenialProbe = async (operation, target, probePath) => {
    try {
      if (operation === 'overwrite') await writeFile(probePath, 'overwrite');
      if (operation === 'append') await appendFile(probePath, 'append');
      if (operation === 'create') await writeFile(`${probePath}-new`, 'create');
      if (operation === 'delete') await unlink(probePath);
      if (operation === 'rename')
        await rename(probePath, `${probePath}-renamed`);
      return { operation, denied: false, target };
    } catch (error_) {
      const errorCode = error_?.code;
      const denied = ['EACCES', 'EPERM', 'EROFS'].includes(errorCode);
      return {
        operation,
        denied,
        target,
        ...(errorCode ? { errorCode } : {}),
      };
    } finally {
      await rm(`${probePath}-new`, { force: true }).catch(() => undefined);
      await rm(`${probePath}-renamed`, { force: true }).catch(() => undefined);
    }
  };

  const collectFiles = (root) => {
    const files = [];
    const visit = (absolutePath) => {
      if (statSync(absolutePath).isDirectory()) {
        for (const child of readdirSync(absolutePath))
          visit(path.join(absolutePath, child));
        return;
      }
      files.push(absolutePath);
    };
    visit(root);
    return files;
  };

  const startOwnedServer = async ({
    checkout,
    receipts,
    target,
    freezeId,
    signal,
  }) => {
    if (ownedServer) return;
    const [command, ...args] = target.command.split(' ');
    const startedAt = new Date().toISOString();
    ownedServerExitStatus = undefined;
    ownedServerStderr = '';
    ownedServerStderrTruncated = false;
    ownedServer = spawn(command, args, {
      cwd: checkout,
      detached: process.platform !== 'win32',
      env: {
        ...process.env,
        STORYBOOK_CLOSURE_FREEZE_ID: freezeId,
        STORYBOOK_CLOSURE_RECEIPTS: ownedReceipts ?? path.resolve(receipts),
      },
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true,
    });
    ownedServer.stderr?.setEncoding('utf8');
    ownedServer.stderr?.on('data', (chunk) => {
      const text = String(chunk);
      if (ownedServerStderr.length >= MAX_MANAGED_SERVER_STDERR_LENGTH) {
        ownedServerStderrTruncated = true;
        return;
      }
      const remaining =
        MAX_MANAGED_SERVER_STDERR_LENGTH - ownedServerStderr.length;
      if (text.length > remaining) ownedServerStderrTruncated = true;
      ownedServerStderr += text.slice(0, remaining);
    });
    let spawnError;
    ownedServerExitPromise = new Promise((resolve) => {
      ownedServer.once('error', (error_) => {
        spawnError = error_ instanceof Error ? error_.message : String(error_);
      });
      ownedServer.once('close', (code, exitSignal) => {
        ownedServerExitStatus = {
          exitCode: code,
          exitSignal,
          error: spawnError,
          closedAt: new Date().toISOString(),
        };
        resolve(ownedServerExitStatus);
      });
    });
    ownedServerMetadata = {
      command,
      args,
      startedAt,
      pid: ownedServer.pid,
    };
    await waitForServer(target.baseURL, 120_000, signal);
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], {
      cwd: checkout,
    });
    ownedServerMetadata.commit = stdout.trim();
  };

  const waitForOwnedServerExit = async (timeoutMs) => {
    if (!ownedServerExitPromise) return undefined;
    let timer;
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve(undefined), timeoutMs);
    });
    const result = await Promise.race([ownedServerExitPromise, timeout]);
    clearTimeout(timer);
    return result;
  };

  const parseMcpEnvelope = async (response, expectedId) => {
    const body = await response.text();
    const contentType = response.headers.get('content-type') ?? '';
    let envelopes;
    try {
      envelopes = contentType.includes('application/json')
        ? [parseJsonDocument(body)]
        : body
            .split(/\r?\n/u)
            .filter((line) => line.startsWith('data: '))
            .map((line) => parseJsonDocument(line.slice('data: '.length)));
    } catch (error_) {
      throw new Error(
        `MCP response was not valid JSON: ${
          error_ instanceof Error ? error_.message : String(error_)
        }`,
        { cause: error_ },
      );
    }
    const matching = envelopes.filter(
      (envelope) =>
        isRecord(envelope) &&
        envelope.jsonrpc === '2.0' &&
        (expectedId === undefined || envelope.id === expectedId),
    );
    if (matching.length !== 1) {
      throw new Error(
        `MCP response did not contain exactly one JSON-RPC response ID ${String(expectedId)}`,
      );
    }
    const envelope = matching[0];
    const hasResult = Object.hasOwn(envelope, 'result');
    const hasError = Object.hasOwn(envelope, 'error');
    if (hasResult === hasError) {
      throw new Error('MCP response must contain exactly one result or error');
    }
    if (hasError) {
      throw new Error(
        `MCP response contained an error: ${JSON.stringify(envelope.error)}`,
      );
    }
    if (!isRecord(envelope.result))
      throw new Error('MCP response result must be an object');
    return envelope;
  };

  const executeMcpTestRun = async ({ mcpURL, storyIds, requestId, signal }) => {
    const request = async (body, headers = {}, expectedStatus = 200) => {
      const response = await fetch(mcpURL, {
        method: 'POST',
        headers: {
          accept: 'application/json, text/event-stream',
          'content-type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(150_000)])
          : AbortSignal.timeout(150_000),
      });
      if (response.status !== expectedStatus) {
        throw new Error(
          `MCP ${body.method} returned HTTP ${response.status}, expected ${expectedStatus}`,
        );
      }
      return response;
    };

    const initialize = await request({
      jsonrpc: '2.0',
      id: requestId,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: {
          name: 'storybook-closure',
          version: '1.0.0',
        },
      },
    });
    const sessionId = initialize.headers.get('mcp-session-id');
    if (!sessionId)
      throw new Error('MCP initialize response did not provide a session ID');
    await parseMcpEnvelope(initialize, requestId);

    const sessionHeaders = { 'mcp-session-id': sessionId };
    await request(
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      sessionHeaders,
      202,
    );
    const testRun = await request(
      {
        jsonrpc: '2.0',
        id: requestId + 1,
        method: 'tools/call',
        params: {
          name: 'test-run',
          arguments: {
            a11y: true,
            stories: storyIds.map((storyId) => ({ storyId })),
          },
        },
      },
      sessionHeaders,
    );
    const envelope = await parseMcpEnvelope(testRun, requestId + 1);
    if (!envelope.result)
      throw new Error('MCP test-run response is missing a result');
    return envelope.result;
  };

  const releaseSingleFrozenTarget = async (frozenTarget, ownerIdentity) => {
    let targetError;
    try {
      await runIcacls(frozenTarget.target, [
        '/remove:d',
        ownerIdentity,
        '/t',
        '/c',
      ]);
      await runIcacls(frozenTarget.target, [
        '/restore',
        frozenTarget.backupPath,
        '/c',
      ]);
    } catch (error_) {
      targetError = error_;
    }
    for (const probePath of frozenTarget.probePaths) {
      try {
        await rm(probePath, { force: true });
      } catch (error_) {
        targetError ??= error_;
      }
    }
    return targetError;
  };

  return {
    resolveTarget: (targetOptions) => resolveStorybookTestTarget(targetOptions),
    assertOwnedPaths: async ({ checkout, receipts }) => {
      const checkoutPath = path.resolve(checkout);
      if (process.env.STORYBOOK_CLOSURE_OWNED_CHECKOUT !== checkoutPath) {
        throw new Error(
          'STORYBOOK_CLOSURE_OWNED_CHECKOUT must identify the owned integration checkout',
        );
      }
      const receiptsPath = resolveInside(checkoutPath, receipts);
      if (receiptsPath === checkoutPath)
        throw new Error('receipt directory must be nested');
      await mkdir(receiptsPath, { recursive: true });
      ownedCheckout = await realpath(checkoutPath);
      ownedReceipts = await resolveOwnedPath(ownedCheckout, receipts);
    },
    acquireFreeze: async ({ checkout, receipts, target, signal }) => {
      const freezeId = `freeze-${randomUUID()}`;
      if (target?.webServer && !ownedServer) {
        await startOwnedServer({
          checkout,
          receipts,
          target,
          freezeId,
          signal,
        });
      }
      const inputDigest = computeInputDigest({
        files: collectInputFiles(ownedCheckout ?? path.resolve(checkout)),
      });
      const backupDirectory = path.join(
        ownedReceipts ?? path.resolve(checkout, receipts),
        `.acl-backup-${randomUUID()}`,
      );
      await mkdir(backupDirectory, { recursive: true });
      const identity = currentIdentity();
      freezeIdentity = identity;
      const selectedPaths = STORYBOOK_INPUT_ROOTS.map((inputRoot) =>
        resolveInside(ownedCheckout ?? path.resolve(checkout), inputRoot),
      );
      frozenTargets = [];
      const denialProbes = [];
      try {
        for (const [index, target] of selectedPaths.entries()) {
          const operations = [
            'overwrite',
            'append',
            'create',
            'delete',
            'rename',
          ];
          const probePaths = operations.map((operation) =>
            path.join(
              target,
              `.storybook-closure-probe-${operation}-${randomUUID()}`,
            ),
          );
          await Promise.all(
            probePaths.map((probePath) => writeFile(probePath, 'probe')),
          );
          const backupPath = path.join(backupDirectory, `${index}.acl`);
          frozenTargets.push({ target, backupPath, probePaths });
          await runIcacls(target, ['/save', backupPath, '/t', '/c']);
          await runIcacls(target, [
            '/deny',
            `${identity}:(OI)(CI)(WD,AD,DC)`,
            '/t',
            '/c',
          ]);
          for (const filePath of collectFiles(target)) {
            await runIcacls(filePath, [
              '/deny',
              `${identity}:(WD,AD,WA,DE)`,
              '/c',
            ]);
          }
          for (const [operationIndex, operation] of operations.entries()) {
            denialProbes.push(
              await runDenialProbe(
                operation,
                target,
                probePaths[operationIndex],
              ),
            );
          }
        }
        const freeze = {
          freezeId,
          acquiredAt: new Date().toISOString(),
          inputDigest,
          protectedPaths: selectedPaths,
          denialProbes,
          restored: false,
          ownerIdentity: identity,
          aclBackupDirectory: backupDirectory,
        };
        activeFreeze = freeze;
        await writeReceiptJson('freeze.json', freeze);
        return freeze;
      } catch (error_) {
        for (const frozenTarget of frozenTargets.toReversed()) {
          await runIcacls(frozenTarget.target, [
            '/remove:d',
            `${identity}`,
            '/t',
            '/c',
          ]).catch(() => undefined);
          await runIcacls(frozenTarget.target, [
            '/restore',
            frozenTarget.backupPath,
            '/c',
          ]).catch(() => undefined);
          await Promise.all(
            frozenTarget.probePaths.map((probePath) =>
              rm(probePath, { force: true }).catch(() => undefined),
            ),
          );
        }
        await rm(backupDirectory, { recursive: true, force: true }).catch(
          () => undefined,
        );
        throw error_;
      }
    },
    releaseFreeze: async () => {
      if (!activeFreeze) return;
      let firstError;
      const ownerIdentity = `${activeFreeze.ownerIdentity ?? freezeIdentity}`;
      for (const frozenTarget of [...frozenTargets].reverse()) {
        const targetError = await releaseSingleFrozenTarget(
          frozenTarget,
          ownerIdentity,
        );
        firstError ??= targetError;
      }
      if (!firstError) {
        for (const frozenTarget of [...frozenTargets].reverse()) {
          try {
            await assertFreezeIdentityNotDenied(
              frozenTarget.target,
              activeFreeze.ownerIdentity ?? freezeIdentity,
            );
          } catch (error_) {
            firstError ??= error_;
          }
        }
      }
      if (firstError) {
        activeFreeze.restored = false;
        await writeReceiptJson('freeze.json', activeFreeze).catch(
          (writeError) => {
            firstError = new AggregateError(
              [firstError, writeError],
              'ACL restoration failed and recovery evidence could not be written',
            );
          },
        );
        throw firstError;
      }
      await rm(activeFreeze.aclBackupDirectory, {
        recursive: true,
        force: true,
      });
      activeFreeze.restored = true;
      await writeReceiptJson('freeze.json', activeFreeze);
      frozenTargets = [];
      activeFreeze = undefined;
      freezeIdentity = undefined;
      if (firstError) throw firstError;
    },
    establishProducer: async ({
      target,
      checkout,
      receipts,
      freeze,
      serverMode,
      signal,
    }) => {
      if (
        serverMode === 'external' ||
        process.env.STORYBOOK_CLOSURE_SERVER_MODE === 'external'
      ) {
        const producerPath = process.env.STORYBOOK_CLOSURE_PRODUCER_JSON;
        if (!producerPath) {
          throw new Error(
            'external producer identity must be supplied by an owned adapter',
          );
        }
        const producer = JSON.parse(
          await readFile(
            await resolveOwnedPath(ownedReceipts, producerPath),
            'utf8',
          ),
        );
        if (
          producer.mcpURL !== target.mcpURL ||
          producer.freezeId !== freeze.freezeId ||
          producer.inputDigest !== freeze.inputDigest
        ) {
          throw new Error(
            'external producer identity does not match the frozen target',
          );
        }
        await writeReceiptJson('producer.json', producer);
        return producer;
      }
      if (!ownedServer) {
        await startOwnedServer({
          checkout,
          receipts,
          target,
          freezeId: freeze.freezeId,
          signal,
        });
      }
      const { command, args, startedAt, commit } = ownedServerMetadata;
      const producer = {
        producerId: `producer-${ownedServer.pid}`,
        checkout: ownedCheckout,
        commit,
        inputDigest: freeze.inputDigest,
        freezeId: freeze.freezeId,
        mcpURL: target.mcpURL,
        serverPid: ownedServer.pid,
        serverStartedAt: startedAt,
        cwd: ownedCheckout,
        launchArguments: [command, ...args],
      };
      producer.producerIdentityDigest = producerIdentityDigest(producer);
      await writeReceiptJson('producer.json', producer);
      return producer;
    },
    stopOwnedServer: async () => {
      if (!ownedServer) return undefined;
      const server = ownedServer;
      const metadata = ownedServerMetadata;
      const stopProcessTree = async (force) => {
        if (process.platform === 'win32') {
          await execFileAsync('taskkill.exe', [
            '/PID',
            String(server.pid),
            '/T',
            ...(force ? ['/F'] : []),
          ]);
        } else if (server.pid && !server.killed) {
          process.kill(-server.pid, force ? 'SIGKILL' : 'SIGTERM');
        }
      };
      if (!server.killed) await stopProcessTree(false);
      let exitStatus = await waitForOwnedServerExit(
        MANAGED_SERVER_SHUTDOWN_TIMEOUT_MS,
      );
      let forced = false;
      if (!exitStatus) {
        forced = true;
        await stopProcessTree(true);
        exitStatus = await waitForOwnedServerExit(5_000);
      }
      const evidence = {
        ...metadata,
        stoppedAt: new Date().toISOString(),
        exitCode: exitStatus?.exitCode ?? null,
        exitSignal: exitStatus?.exitSignal ?? null,
        spawnError: exitStatus?.error ?? null,
        stderr: ownedServerStderr,
        stderrTruncated: ownedServerStderrTruncated,
        forced,
        timedOut: !exitStatus,
      };
      await writeReceiptJson('managed-storybook-exit.json', evidence);
      ownedServer = undefined;
      ownedServerMetadata = undefined;
      ownedServerExitPromise = undefined;
      ownedServerExitStatus = undefined;
      ownedServerStderr = '';
      ownedServerStderrTruncated = false;
      if (evidence.timedOut) {
        throw new Error('managed Storybook did not exit after shutdown');
      }
      return evidence;
    },
    runGate: async (name, context) => {
      const definition = GATES.find(([gateName]) => gateName === name);
      if (!definition) throw new Error(`unknown closure gate: ${name}`);
      const env =
        name === 'gate-7-storybook-bdd'
          ? {
              ...process.env,
              STORYBOOK_TEST_URL: context.target.baseURL,
              STORYBOOK_TEST_SERVER_MODE: 'external',
              STORYBOOK_CLOSURE_FREEZE_ID: context.freezeId,
              STORYBOOK_CLOSURE_PRODUCER_ID: context.producerId,
              STORYBOOK_CLOSURE_INPUT_DIGEST: context.inputDigest,
              STORYBOOK_CLOSURE_PRODUCER_IDENTITY_DIGEST:
                context.producerIdentityDigest,
              STORYBOOK_CLOSURE_CHILD_PID: String(context.childEpoch.pid),
              STORYBOOK_CLOSURE_CHILD_CREATED_AT: context.childEpoch.createdAt,
            }
          : process.env;
      await runCommand(
        definition[1],
        context.checkout ?? process.cwd(),
        context.signal,
        env,
      );
      if (name === 'gate-5-storybook-build' || name === 'gate-8-docs') {
        const index = JSON.parse(
          await readFile(
            path.join(context.checkout, 'storybook-static', 'index.json'),
            'utf8',
          ),
        );
        const snapshotName =
          name === 'gate-5-storybook-build'
            ? 'frozen-full-index.json'
            : 'frozen-docs-index.json';
        const digestKey =
          name === 'gate-5-storybook-build'
            ? 'fullIndexDigest'
            : 'docsIndexDigest';
        context.freeze[digestKey] = computeIndexDigest(index);
        await writeReceiptJson(snapshotName, index);
        await writeReceiptJson('freeze.json', context.freeze);
      }
      return {
        name,
        ok: true,
        inputDigest: context.inputDigest,
        producerIdentityDigest: context.producerIdentityDigest,
        freezeId: context.freezeId,
      };
    },
    assertStableIdentity: async (context) => {
      if (context.freeze.inputDigest !== context.inputDigest) {
        throw Object.assign(new Error('frozen source input changed'), {
          code: FAILURE_CODES.INPUT_STALE,
        });
      }
      const currentInputDigest = computeInputDigest({
        files: collectInputFiles(
          ownedCheckout ?? path.resolve(context.checkout ?? process.cwd()),
        ),
      });
      if (currentInputDigest !== context.inputDigest) {
        throw Object.assign(new Error('frozen source input changed'), {
          code: FAILURE_CODES.INPUT_STALE,
        });
      }
      if (
        producerIdentityDigest(context.producer) !==
        context.producerIdentityDigest
      ) {
        throw Object.assign(new Error('producer identity changed'), {
          code: FAILURE_CODES.INPUT_STALE,
        });
      }
    },
    writeAwaitingMcp: async ({
      receipts,
      freeze,
      producer,
      target,
      timeout,
    }) => {
      const receiptRoot = ownedReceipts ?? path.resolve(receipts);
      await mkdir(receiptRoot, { recursive: true });
      await writeFile(
        path.join(receiptRoot, 'awaiting-mcp.json'),
        JSON.stringify(
          {
            freezeId: freeze.freezeId,
            producerId: producer.producerId,
            mcpURL: target.mcpURL,
            timeout,
          },
          null,
          2,
        ),
      );
    },
    produceMcpReceipts: async ({
      receipts,
      freeze,
      producer,
      timeout,
      signal,
    }) => {
      if (ownedServerExitStatus) {
        throw new Error(
          'managed Storybook exited before MCP receipt production',
        );
      }
      const receiptRoot = ownedReceipts ?? path.resolve(receipts);
      const index = JSON.parse(
        await readFile(
          path.join(receiptRoot, 'frozen-full-index.json'),
          'utf8',
        ),
      );
      const storyIds = deriveExecutableStorySet({ index }).storyIds;
      if (storyIds.length === 0) {
        throw new Error('MCP receipt production has no executable stories');
      }
      const childEpoch = {
        pid: producer.serverPid,
        createdAt: producer.serverStartedAt,
      };
      const receiptFiles = [];
      for (
        let offset = 0;
        offset < storyIds.length;
        offset += MCP_STORY_BATCH_SIZE
      ) {
        const requestedStoryIds = storyIds.slice(
          offset,
          offset + MCP_STORY_BATCH_SIZE,
        );
        const requestId = offset / MCP_STORY_BATCH_SIZE + 1;
        const response = await executeMcpTestRun({
          mcpURL: producer.mcpURL,
          storyIds: requestedStoryIds,
          requestId: requestId * 10,
          signal,
        });
        await writeReceiptJson(`mcp-response-${requestId}.json`, response);
        const normalized = normalizeMcpReceipt({
          requestId,
          requestedStoryIds,
          response,
          freezeId: freeze.freezeId,
          producerId: producer.producerId,
          inputDigest: freeze.inputDigest,
          producerIdentityDigest: producer.producerIdentityDigest,
          mcpURL: producer.mcpURL,
          childEpoch,
          expectedInputDigest: freeze.inputDigest,
          expectedProducerIdentityDigest: producer.producerIdentityDigest,
        });
        assertResult(
          normalized,
          `MCP receipt is invalid for request ${requestId}`,
        );
        const receiptFile = `receipt-mcp-${requestId}.json`;
        await writeReceiptJson(receiptFile, {
          ...normalized.receipt,
          observedChildEpoch: childEpoch,
        });
        receiptFiles.push(receiptFile);
      }
      const completion = {
        freezeId: freeze.freezeId,
        producerId: producer.producerId,
        receiptFiles,
        completedAt: new Date().toISOString(),
        timeout,
      };
      await writeReceiptJson('mcp-complete.json', completion);
      return completion;
    },
    readReceipt: async ({ receipts, receiptFile }) => {
      const receiptRoot = ownedReceipts ?? receipts;
      const receipt = JSON.parse(
        await readFile(
          await resolveOwnedPath(receiptRoot, receiptFile),
          'utf8',
        ),
      );
      const responseFile = `mcp-response-${String(receipt.requestId)}.json`;
      try {
        return {
          ...receipt,
          response: JSON.parse(
            await readFile(
              await resolveOwnedPath(receiptRoot, responseFile),
              'utf8',
            ),
          ),
        };
      } catch (error_) {
        if (error_.code !== 'ENOENT') throw error_;
        return receipt;
      }
    },
    normalizeReceipt: ({ value, freeze, producer }) =>
      normalizeMcpReceipt({
        ...value,
        freezeId: freeze.freezeId,
        producerId: producer.producerId,
        expectedInputDigest: freeze.inputDigest,
        expectedProducerIdentityDigest: producer.producerIdentityDigest,
      }),
    validateFreezeRecord: ({ freeze, selectedPaths }) =>
      validateFreezeRecord({
        freeze,
        expectedInputDigest: freeze.inputDigest,
        selectedPaths,
      }),
    validateProducerIdentity,
    observeChildEpoch: async ({ receipt }) => {
      if (!receipt.observedChildEpoch) {
        throw new Error(
          'receipt is missing independently observed child provenance',
        );
      }
      return receipt.observedChildEpoch;
    },
  };
};

export async function main(argv = process.argv.slice(2), runtime = {}) {
  const parsed = parseArguments(argv);
  if (!parsed.ok)
    return failure(FAILURE_CODES.INVALID_INVOCATION, parsed.message, []);
  const adapters = await createProductionAdapters();
  return runClosure({ ...parsed.options, signal: runtime.signal }, adapters);
}

const isEntrypoint =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isEntrypoint) {
  const abortController = new AbortController();
  const onSignal = (signal) => {
    if (!abortController.signal.aborted) {
      abortController.abort(new Error(`closure interrupted by ${signal}`));
    }
  };
  const onSigint = () => onSignal('SIGINT');
  const onSigterm = () => onSignal('SIGTERM');
  process.once('SIGINT', onSigint);
  process.once('SIGTERM', onSigterm);
  let result;
  try {
    result = await main(process.argv.slice(2), {
      signal: abortController.signal,
    });
  } finally {
    process.removeListener('SIGINT', onSigint);
    process.removeListener('SIGTERM', onSigterm);
  }
  if (!result.ok) console.error(`${result.code}: ${result.message}`);
  process.exitCode = result.ok ? 0 : 1;
}
