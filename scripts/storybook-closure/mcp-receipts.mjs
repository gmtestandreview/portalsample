import {
  deriveExecutableStorySet,
  normalizeMcpReceipt,
  validateFreezeRecord,
} from '../storybook-coverage.mjs';

import { FAILURE_CODES, assertResult, codedError } from './contracts.mjs';
import { MCP_REQUEST_TIMEOUT_MS, executeMcpTestRun } from './mcp-protocol.mjs';
import { readOwnedJson } from './owned-fs.mjs';
import { writeReceiptJson } from './receipt-store.mjs';

const MCP_STORY_BATCH_SIZE = 50;
const REQUEST_ID_STRIDE = 10;

export const collectAndValidateReceipts = async (
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

// The configured MCP timeout bounds the whole receipt production: each batch
// request gets at most what is left of it, and no batch starts after expiry.
export const remainingMcpTime = (deadline, now = Date.now()) => {
  const remaining = deadline - now;
  if (remaining <= 0) {
    throw codedError(
      FAILURE_CODES.EXECUTION_INCOMPLETE,
      'MCP receipt production exceeded the configured timeout',
    );
  }
  return Math.min(remaining, MCP_REQUEST_TIMEOUT_MS);
};

const produceBatchReceipt = async ({
  paths,
  freeze,
  producer,
  signal,
  childEpoch,
  requestId,
  requestedStoryIds,
  deadline,
}) => {
  const response = await executeMcpTestRun({
    mcpURL: producer.mcpURL,
    storyIds: requestedStoryIds,
    requestId: requestId * REQUEST_ID_STRIDE,
    signal,
    requestTimeoutMs: remainingMcpTime(deadline),
  });
  await writeReceiptJson(paths, `mcp-response-${requestId}.json`, response);
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
  assertResult(normalized, `MCP receipt is invalid for request ${requestId}`);
  const receiptFile = `receipt-mcp-${requestId}.json`;
  await writeReceiptJson(paths, receiptFile, {
    ...normalized.receipt,
    observedChildEpoch: childEpoch,
  });
  return receiptFile;
};

export const produceMcpReceipts = async (
  serverState,
  paths,
  { receipts, freeze, producer, timeout, signal },
) => {
  if (serverState.exitStatus) {
    throw new Error('managed Storybook exited before MCP receipt production');
  }
  const index = await readOwnedJson(
    paths.receipts ?? receipts,
    'frozen-full-index.json',
  );
  const { storyIds } = deriveExecutableStorySet({ index });
  if (storyIds.length === 0) {
    throw new Error('MCP receipt production has no executable stories');
  }
  const childEpoch = {
    pid: producer.serverPid,
    createdAt: producer.serverStartedAt,
  };
  const deadline = Date.now() + timeout;
  const receiptFiles = [];
  for (
    let offset = 0;
    offset < storyIds.length;
    offset += MCP_STORY_BATCH_SIZE
  ) {
    receiptFiles.push(
      await produceBatchReceipt({
        paths,
        freeze,
        producer,
        signal,
        childEpoch,
        deadline,
        requestId: offset / MCP_STORY_BATCH_SIZE + 1,
        requestedStoryIds: storyIds.slice(
          offset,
          offset + MCP_STORY_BATCH_SIZE,
        ),
      }),
    );
  }
  const completion = {
    freezeId: freeze.freezeId,
    producerId: producer.producerId,
    receiptFiles,
    completedAt: new Date().toISOString(),
    timeout,
  };
  await writeReceiptJson(paths, 'mcp-complete.json', completion);
  return completion;
};

export const normalizeFrozenReceipt = ({ value, freeze, producer }) =>
  normalizeMcpReceipt({
    ...value,
    freezeId: freeze.freezeId,
    producerId: producer.producerId,
    expectedInputDigest: freeze.inputDigest,
    expectedProducerIdentityDigest: producer.producerIdentityDigest,
  });

export const validateFreezeContract = ({ freeze, selectedPaths }) =>
  validateFreezeRecord({
    freeze,
    expectedInputDigest: freeze.inputDigest,
    selectedPaths,
  });

// The epoch a receipt claims must match the managed server this run spawned,
// taken from in-memory state rather than from the receipt file, so a forged
// or stale receipt cannot vouch for itself (R04). This is the process this
// run started, not an OS-level birth-time observation; in external mode there
// is no owned process, so the receipt's own epoch is all that is available.
export const observeChildEpoch =
  (serverState) =>
  async ({ receipt }) => {
    const observed = receipt.observedChildEpoch;
    if (!observed) {
      throw new Error(
        'receipt is missing independently observed child provenance',
      );
    }
    const server = serverState.process;
    if (
      server &&
      (observed.pid !== server.pid ||
        observed.createdAt !== serverState.metadata?.startedAt)
    ) {
      throw new Error(
        'receipt child epoch does not match the managed Storybook process',
      );
    }
    return observed;
  };
