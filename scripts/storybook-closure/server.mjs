import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

import { execFileAsync, splitCommandLine } from './commands.mjs';
import { isRecord, throwIfAborted } from './contracts.mjs';
import { producerIdentityDigest } from './identity.mjs';
import { readOwnedJson } from './owned-fs.mjs';
import { writeReceiptJson } from './receipt-store.mjs';

const MANAGED_SERVER_SHUTDOWN_TIMEOUT_MS = 15_000;
const FORCED_SHUTDOWN_TIMEOUT_MS = 5_000;
const SERVER_READY_TIMEOUT_MS = 120_000;
const READINESS_PROBE_TIMEOUT_MS = 2_000;
const READINESS_POLL_INTERVAL_MS = 250;
const MAX_MANAGED_SERVER_STDERR_LENGTH = 1_000_000;

export const createServerState = () => ({
  process: undefined,
  metadata: undefined,
  exitPromise: undefined,
  exitStatus: undefined,
  stderr: '',
  stderrTruncated: false,
});

export const waitForServer = async (url, timeout, signal) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    throwIfAborted(signal);
    try {
      const probeSignal = AbortSignal.timeout(READINESS_PROBE_TIMEOUT_MS);
      const response = await fetch(url, {
        signal: signal ? AbortSignal.any([signal, probeSignal]) : probeSignal,
      });
      if (response.ok || response.status < 500) return;
    } catch {
      throwIfAborted(signal);
      // Readiness is bounded by the loop deadline.
    }
    await new Promise((resolve) =>
      setTimeout(resolve, READINESS_POLL_INTERVAL_MS),
    );
  }
  throw new Error(`Storybook server did not become ready: ${url}`);
};

const captureStderr = (serverState, chunk) => {
  const text = String(chunk);
  if (serverState.stderr.length >= MAX_MANAGED_SERVER_STDERR_LENGTH) {
    serverState.stderrTruncated = true;
    return;
  }
  const remaining =
    MAX_MANAGED_SERVER_STDERR_LENGTH - serverState.stderr.length;
  if (text.length > remaining) serverState.stderrTruncated = true;
  serverState.stderr += text.slice(0, remaining);
};

const trackExit = (serverState, child) =>
  new Promise((resolve) => {
    let spawnError;
    child.once('error', (error_) => {
      spawnError = error_ instanceof Error ? error_.message : String(error_);
    });
    child.once('close', (code, exitSignal) => {
      serverState.exitStatus = {
        exitCode: code,
        exitSignal,
        error: spawnError,
        closedAt: new Date().toISOString(),
      };
      resolve(serverState.exitStatus);
    });
  });

export const startOwnedServer = async (
  serverState,
  paths,
  { checkout, receipts, target, freezeId, signal },
) => {
  if (serverState.process) return;
  const [command, ...args] = splitCommandLine(target.command);
  const startedAt = new Date().toISOString();
  Object.assign(serverState, createServerState());
  const child = spawn(command, args, {
    cwd: checkout,
    detached: process.platform !== 'win32',
    env: {
      ...process.env,
      STORYBOOK_CLOSURE_FREEZE_ID: freezeId,
      STORYBOOK_CLOSURE_RECEIPTS: paths.receipts ?? path.resolve(receipts),
    },
    stdio: ['ignore', 'ignore', 'pipe'],
    windowsHide: true,
  });
  serverState.process = child;
  child.stderr?.setEncoding('utf8');
  child.stderr?.on('data', (chunk) => captureStderr(serverState, chunk));
  serverState.exitPromise = trackExit(serverState, child);
  serverState.metadata = { command, args, startedAt, pid: child.pid };
  await waitForServer(target.baseURL, SERVER_READY_TIMEOUT_MS, signal);
  const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], {
    cwd: checkout,
  });
  serverState.metadata.commit = stdout.trim();
};

export const waitForOwnedServerExit = async (serverState, timeoutMs) => {
  if (!serverState.exitPromise) return undefined;
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(undefined), timeoutMs);
  });
  const result = await Promise.race([serverState.exitPromise, timeout]);
  clearTimeout(timer);
  return result;
};

const establishExternalProducer = async (paths, { target, freeze }) => {
  const producerPath = process.env.STORYBOOK_CLOSURE_PRODUCER_JSON;
  if (!producerPath) {
    throw new Error(
      'external producer identity must be supplied by an owned adapter',
    );
  }
  const producer = await readOwnedJson(paths.receipts, producerPath);
  if (!isRecord(producer)) {
    throw new Error('external producer identity must be a JSON object');
  }
  if (
    producer.mcpURL !== target.mcpURL ||
    producer.freezeId !== freeze.freezeId ||
    producer.inputDigest !== freeze.inputDigest
  ) {
    throw new Error(
      'external producer identity does not match the frozen target',
    );
  }
  await writeReceiptJson(paths, 'producer.json', producer);
  return producer;
};

const establishManagedProducer = async (
  serverState,
  paths,
  { target, checkout, receipts, freeze, signal },
) => {
  if (!serverState.process) {
    await startOwnedServer(serverState, paths, {
      checkout,
      receipts,
      target,
      freezeId: freeze.freezeId,
      signal,
    });
  }
  const { command, args, startedAt, commit } = serverState.metadata;
  const producer = {
    producerId: `producer-${serverState.process.pid}`,
    checkout: paths.checkout,
    commit,
    inputDigest: freeze.inputDigest,
    freezeId: freeze.freezeId,
    mcpURL: target.mcpURL,
    serverPid: serverState.process.pid,
    serverStartedAt: startedAt,
    cwd: paths.checkout,
    launchArguments: [command, ...args],
  };
  producer.producerIdentityDigest = producerIdentityDigest(producer);
  await writeReceiptJson(paths, 'producer.json', producer);
  return producer;
};

export const establishProducer = (serverState, paths, args) =>
  args.serverMode === 'external' ||
  process.env.STORYBOOK_CLOSURE_SERVER_MODE === 'external'
    ? establishExternalProducer(paths, args)
    : establishManagedProducer(serverState, paths, args);

const stopProcessTree = async (server, force) => {
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

export const stopOwnedServer = async (serverState, paths) => {
  const server = serverState.process;
  if (!server) return undefined;
  const metadata = serverState.metadata;
  if (!server.killed) {
    // Windows taskkill without /F cannot end console-less node children
    // and exits non-zero; the forced attempt below is the real stop, and
    // it still throws if the tree survives.
    await stopProcessTree(server, false).catch(() => undefined);
  }
  let exitStatus = await waitForOwnedServerExit(
    serverState,
    MANAGED_SERVER_SHUTDOWN_TIMEOUT_MS,
  );
  let forced = false;
  if (!exitStatus) {
    forced = true;
    await stopProcessTree(server, true);
    exitStatus = await waitForOwnedServerExit(
      serverState,
      FORCED_SHUTDOWN_TIMEOUT_MS,
    );
  }
  const evidence = {
    ...metadata,
    stoppedAt: new Date().toISOString(),
    exitCode: exitStatus?.exitCode ?? null,
    exitSignal: exitStatus?.exitSignal ?? null,
    spawnError: exitStatus?.error ?? null,
    stderr: serverState.stderr,
    stderrTruncated: serverState.stderrTruncated,
    forced,
    timedOut: !exitStatus,
  };
  await writeReceiptJson(paths, 'managed-storybook-exit.json', evidence);
  Object.assign(serverState, createServerState());
  if (evidence.timedOut) {
    throw new Error('managed Storybook did not exit after shutdown');
  }
  return evidence;
};
