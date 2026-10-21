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
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

import {
  computeInputDigest,
  computeIndexDigest,
  normalizeMcpReceipt,
  validateFreezeRecord,
  validateProducerIdentity,
} from './storybook-coverage.mjs';

const execFileAsync = promisify(execFile);
const MANAGED_SERVER_SHUTDOWN_TIMEOUT_MS = 15_000;
const MAX_MANAGED_SERVER_STDERR_LENGTH = 1_000_000;

const FAILURE_CODES = {
  INVALID_INVOCATION: 'INVALID_INVOCATION',
  INPUT_STALE: 'INPUT_STALE',
  EXECUTION_INCOMPLETE: 'EXECUTION_INCOMPLETE',
};

const STORYBOOK_INPUT_ROOTS = [
  'ClientApp/src',
  '.storybook',
  'scripts',
  'tests',
];

const collectInputFiles = (checkout) => {
  const files = [];
  const resolvedCheckout = realpathSync(checkout);
  const visit = (absolutePath) => {
    const resolvedPath = realpathSync(absolutePath);
    const relativeToCheckout = path.relative(resolvedCheckout, resolvedPath);
    if (
      relativeToCheckout.startsWith('..') ||
      path.isAbsolute(relativeToCheckout)
    ) {
      throw new Error(
        `input symlink escapes the owned checkout: ${absolutePath}`
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
    files.push({ path: relativePath, content: readFileSync(absolutePath) });
  };
  for (const inputRoot of STORYBOOK_INPUT_ROOTS) {
    const absolutePath = path.resolve(checkout, inputRoot);
    visit(absolutePath);
  }
  for (const inputFile of [
    'package.json',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'vite.config.ts',
    'vite.config.mts',
    'vitest.unit.config.ts',
    'vitest.storybook.config.ts',
    'vitest.storybook.runtime.ts',
  ]) {
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
    'gate-6-storybook-bdd',
    ['npm', 'run', 'test:e2e:storybook', '--', '--workers=1'],
  ],
  ['gate-7-docs', ['npm', 'run', 'storybook:verify:docs']],
  [
    'gate-8-closure',
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
      'reports/storybook-coverage',
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

const throwIfAborted = (signal) => {
  if (!signal?.aborted) return;
  const reason = signal.reason;
  throw Object.assign(
    new Error(
      reason instanceof Error ? reason.message : 'closure was interrupted'
    ),
    { code: FAILURE_CODES.EXECUTION_INCOMPLETE }
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
      }
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
        typeof file !== 'string' || file.includes('..') || path.isAbsolute(file)
    )
  ) {
    throw Object.assign(new Error('MCP handoff is missing or stale'), {
      code: FAILURE_CODES.EXECUTION_INCOMPLETE,
    });
  }
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
      'freeze record is invalid'
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

    for (const [name] of GATES.slice(0, 5)) {
      throwIfAborted(signal);
      const gate = await adapters.runGate(name, context);
      phases.push(name);
      assertGate(gate, { ...context, name });
      await adapters.assertStableIdentity(context);
    }

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

    const completion = await adapters.waitForMcpCompletion({
      receipts: options.receipts,
      freeze,
      producer,
      timeout,
    });
    phases.push('mcp-complete');
    assertHandoff(completion, freeze, producer);

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
        `receipt producer identity is invalid: ${receiptFile}`
      );
      receipts.push(normalized.receipt);
    }

    for (const [name] of GATES.slice(5)) {
      throwIfAborted(signal);
      const gate = await adapters.runGate(name, context);
      phases.push(name);
      assertGate(gate, { ...context, name });
      await adapters.assertStableIdentity(context);
    }

    outcome = { ok: true, phases };
  } catch (error_) {
    const errorCode =
      isRecord(error_) && typeof error_.code === 'string'
        ? error_.code
        : FAILURE_CODES.EXECUTION_INCOMPLETE;
    outcome = failure(
      errorCode,
      error_ instanceof Error ? error_.message : String(error_),
      phases
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
    if (cleanupError && outcome?.ok) {
      outcome = failure(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        cleanupError instanceof Error
          ? cleanupError.message
          : String(cleanupError),
        phases
      );
    }
  }

  if (!outcome) {
    return failure(
      FAILURE_CODES.EXECUTION_INCOMPLETE,
      'closure ended without a result',
      phases
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
    await import('../.storybook/storybook-test-target.ts');
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
      'utf8'
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
    env = process.env,
    signal
  ) => {
    const executable =
      process.platform === 'win32' && command === 'npm' ? 'npm.cmd' : command;
    try {
      await execFileAsync(executable, args, {
        cwd,
        env,
        shell: process.platform === 'win32' && command === 'npm',
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
    } catch {
      return { operation, denied: true, target };
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

  return {
    resolveTarget: (targetOptions) => resolveStorybookTestTarget(targetOptions),
    assertOwnedPaths: async ({ checkout, receipts }) => {
      const checkoutPath = path.resolve(checkout);
      if (process.env.STORYBOOK_CLOSURE_OWNED_CHECKOUT !== checkoutPath) {
        throw new Error(
          'STORYBOOK_CLOSURE_OWNED_CHECKOUT must identify the owned integration checkout'
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
        `.acl-backup-${randomUUID()}`
      );
      await mkdir(backupDirectory, { recursive: true });
      const identity = currentIdentity();
      freezeIdentity = identity;
      const selectedPaths = STORYBOOK_INPUT_ROOTS.map((inputRoot) =>
        resolveInside(ownedCheckout ?? path.resolve(checkout), inputRoot)
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
              `.storybook-closure-probe-${operation}-${randomUUID()}`
            )
          );
          await Promise.all(
            probePaths.map((probePath) => writeFile(probePath, 'probe'))
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
                probePaths[operationIndex]
              )
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
        for (const frozenTarget of frozenTargets.reverse()) {
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
              rm(probePath, { force: true }).catch(() => undefined)
            )
          );
        }
        await rm(backupDirectory, { recursive: true, force: true }).catch(
          () => undefined
        );
        throw error_;
      }
    },
    releaseFreeze: async () => {
      if (!activeFreeze) return;
      let firstError;
      for (const frozenTarget of [...frozenTargets].reverse()) {
        try {
          await runIcacls(frozenTarget.target, [
            '/remove:d',
            `${activeFreeze.ownerIdentity ?? freezeIdentity}`,
            '/t',
            '/c',
          ]);
          await runIcacls(frozenTarget.target, [
            '/restore',
            frozenTarget.backupPath,
            '/c',
          ]);
        } catch (error_) {
          firstError ??= error_;
        }
        await Promise.all(
          frozenTarget.probePaths.map((probePath) =>
            rm(probePath, { force: true }).catch(() => undefined)
          )
        );
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
            'external producer identity must be supplied by an owned adapter'
          );
        }
        const producer = JSON.parse(
          await readFile(
            await resolveOwnedPath(ownedReceipts, producerPath),
            'utf8'
          )
        );
        if (
          producer.mcpURL !== target.mcpURL ||
          producer.freezeId !== freeze.freezeId ||
          producer.inputDigest !== freeze.inputDigest
        ) {
          throw new Error(
            'external producer identity does not match the frozen target'
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
      if (!server.killed) server.kill('SIGTERM');
      let exitStatus = await waitForOwnedServerExit(
        MANAGED_SERVER_SHUTDOWN_TIMEOUT_MS
      );
      let forced = false;
      if (!exitStatus) {
        forced = true;
        server.kill('SIGKILL');
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
        name === 'gate-6-storybook-bdd'
          ? {
              ...process.env,
              STORYBOOK_TEST_URL: context.target.baseURL,
              STORYBOOK_TEST_SERVER_MODE: 'external',
            }
          : process.env;
      await runCommand(
        definition[1],
        context.checkout ?? process.cwd(),
        env,
        context.signal
      );
      if (name === 'gate-5-storybook-build' || name === 'gate-7-docs') {
        const index = JSON.parse(
          await readFile(
            path.join(context.checkout, 'storybook-static', 'index.json'),
            'utf8'
          )
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
          2
        )
      );
    },
    waitForMcpCompletion: async ({ receipts, timeout }) => {
      const receiptRoot = ownedReceipts ?? path.resolve(receipts);
      const started = Date.now();
      while (Date.now() - started < timeout) {
        if (ownedServerExitStatus) {
          const exitDescription = ownedServerExitStatus.error
            ? `spawn error ${ownedServerExitStatus.error}`
            : `exit code ${ownedServerExitStatus.exitCode ?? 'null'} / signal ${ownedServerExitStatus.exitSignal ?? 'none'}`;
          const stderr = ownedServerStderr.trim();
          throw Object.assign(
            new Error(
              `managed Storybook exited before MCP completion (${exitDescription})${stderr ? `\nstderr:\n${stderr}` : ''}`
            ),
            { code: FAILURE_CODES.EXECUTION_INCOMPLETE }
          );
        }
        try {
          const completionPath = await resolveOwnedPath(
            receiptRoot,
            'mcp-complete.json'
          );
          return JSON.parse(await readFile(completionPath, 'utf8'));
        } catch (error_) {
          if (error_.code !== 'ENOENT') throw error_;
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
      throw new Error('timed out waiting for mcp-complete.json');
    },
    readReceipt: async ({ receipts, receiptFile }) =>
      JSON.parse(
        await readFile(
          await resolveOwnedPath(ownedReceipts ?? receipts, receiptFile),
          'utf8'
        )
      ),
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
          'receipt is missing independently observed child provenance'
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
