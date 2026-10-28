import {
  DEFAULT_MCP_TIMEOUT_MS,
  assertOptions,
  assertPermittedUrl,
} from './cli.mjs';
import {
  FAILURE_CODES,
  assertHandoff,
  assertResult,
  failure,
  isRecord,
  throwIfAborted,
} from './contracts.mjs';
import { GATES, runGateSequence } from './gates.mjs';
import { collectAndValidateReceipts } from './mcp-receipts.mjs';

const PRE_MCP_GATE_COUNT = 6;

const runCleanup = async ({ options, adapters, freeze, producer, phases }) => {
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
  return cleanupError;
};

const applyCleanupError = (outcome, cleanupError, phases) => {
  if (!cleanupError) return outcome;
  const cleanupMessage =
    cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
  if (outcome?.ok) {
    return failure(FAILURE_CODES.EXECUTION_INCOMPLETE, cleanupMessage, phases);
  }
  return {
    ...outcome,
    ok: false,
    code: FAILURE_CODES.EXECUTION_INCOMPLETE,
    message: `${outcome.message}; cleanup failed: ${cleanupMessage}`,
  };
};

const failureFromError = (error_, phases) =>
  failure(
    isRecord(error_) && typeof error_.code === 'string'
      ? error_.code
      : FAILURE_CODES.EXECUTION_INCOMPLETE,
    error_ instanceof Error ? error_.message : String(error_),
    phases,
  );

const resolvePermittedTarget = async (options, adapters) => {
  const target = await adapters.resolveTarget({
    url: options.url,
    serverMode: options.serverMode,
    ci: true,
  });
  const targetUrlError = assertPermittedUrl(
    target?.baseURL ?? options.url,
    options.serverMode,
  );
  if (targetUrlError) throw new Error(targetUrlError);
  return target;
};

// `resources` is filled as soon as each resource exists so the caller's
// cleanup can release it even when a later step throws.
const acquireFrozenProducer = async (
  { options, adapters, target, phases, signal },
  resources,
) => {
  const { checkout, receipts, serverMode } = options;
  const freeze = await adapters.acquireFreeze({
    checkout,
    receipts,
    target,
    signal,
  });
  resources.freeze = freeze;
  phases.push('freeze');
  assertResult(
    await adapters.validateFreezeRecord({
      freeze,
      expectedInputDigest: freeze.inputDigest,
      selectedPaths: freeze.protectedPaths,
    }),
    'freeze record is invalid',
  );
  const producer = await adapters.establishProducer({
    checkout,
    receipts,
    target,
    freeze,
    serverMode,
    signal,
  });
  resources.producer = producer;
  phases.push('producer');
  return { freeze, producer };
};

const runMcpHandoff = async (run, context) => {
  const { options, adapters, phases, timeout } = run;
  const { freeze, producer, target } = context;
  await adapters.writeAwaitingMcp({
    checkout: options.checkout,
    receipts: options.receipts,
    freeze,
    producer,
    target,
    timeout,
    signal: context.signal,
  });
  phases.push('awaiting-mcp');

  const completion = await adapters.produceMcpReceipts({
    receipts: options.receipts,
    freeze,
    producer,
    timeout,
    signal: context.signal,
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
};

const executeClosure = async (run, resources) => {
  const { options, adapters, phases, signal } = run;
  throwIfAborted(signal);
  const target = await resolvePermittedTarget(options, adapters);
  await adapters.assertOwnedPaths({
    checkout: options.checkout,
    receipts: options.receipts,
  });
  phases.push('paths');

  const { freeze, producer } = await acquireFrozenProducer(
    { ...run, target },
    resources,
  );
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

  await runGateSequence(
    GATES.slice(0, PRE_MCP_GATE_COUNT),
    context,
    phases,
    adapters,
  );
  await runMcpHandoff(run, context);
  await runGateSequence(
    GATES.slice(PRE_MCP_GATE_COUNT),
    context,
    phases,
    adapters,
  );
  return { ok: true, phases };
};

export async function runClosure(options, adapters) {
  const phases = [];
  const optionError = assertOptions(options);
  if (optionError)
    return failure(FAILURE_CODES.INVALID_INVOCATION, optionError, phases);

  const run = {
    options,
    adapters,
    phases,
    signal: options.signal,
    timeout: options.mcpTimeoutMs ?? DEFAULT_MCP_TIMEOUT_MS,
  };
  const resources = {};
  let outcome;
  try {
    outcome = await executeClosure(run, resources);
  } catch (error_) {
    outcome = failureFromError(error_, phases);
  } finally {
    const cleanupError = await runCleanup({
      options,
      adapters,
      freeze: resources.freeze,
      producer: resources.producer,
      phases,
    });
    outcome = applyCleanupError(outcome, cleanupError, phases);
  }
  return { ...outcome, phases };
}
