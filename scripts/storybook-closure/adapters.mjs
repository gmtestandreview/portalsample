import { randomUUID } from 'node:crypto';

import { validateProducerIdentity } from '../storybook-coverage.mjs';
import { resolveStorybookTestTargetImplementation } from '../../.storybook/storybook-test-target.mjs';

import {
  acquireFreezeTransaction,
  createFreezeState,
  releaseFreezeTransaction,
} from './freeze-manager.mjs';
import { runGate } from './gates.mjs';
import { assertStableIdentity } from './identity.mjs';
import {
  normalizeFrozenReceipt,
  observeChildEpoch,
  produceMcpReceipts,
  validateFreezeContract,
} from './mcp-receipts.mjs';
import { createOwnedPaths, establishOwnedPaths } from './paths.mjs';
import { readReceipt, writeAwaitingMcp } from './receipt-store.mjs';
import {
  createServerState,
  establishProducer,
  startOwnedServer,
  stopOwnedServer,
} from './server.mjs';

// Composition root: every adapter below closes over one per-run state set
// (owned paths, managed server, freeze transaction) created here.
export const createProductionAdapters = async () => {
  const paths = createOwnedPaths();
  const serverState = createServerState();
  const freezeState = createFreezeState();

  const acquireFreeze = async ({ checkout, receipts, target, signal }) => {
    const freezeId = `freeze-${randomUUID()}`;
    if (target?.webServer && !serverState.process) {
      await startOwnedServer(serverState, paths, {
        checkout,
        receipts,
        target,
        freezeId,
        signal,
      });
    }
    return acquireFreezeTransaction({ freezeState, paths, freezeId });
  };

  return {
    resolveTarget: (targetOptions) =>
      resolveStorybookTestTargetImplementation(targetOptions),
    assertOwnedPaths: (args) => establishOwnedPaths(paths, args),
    acquireFreeze,
    releaseFreeze: () => releaseFreezeTransaction(freezeState, paths),
    establishProducer: (args) => establishProducer(serverState, paths, args),
    stopOwnedServer: () => stopOwnedServer(serverState, paths),
    runGate: (name, context) => runGate(paths, name, context),
    assertStableIdentity: (context) =>
      assertStableIdentity(context, paths.checkout),
    writeAwaitingMcp: (args) => writeAwaitingMcp(paths, args),
    produceMcpReceipts: (args) => produceMcpReceipts(serverState, paths, args),
    readReceipt: (args) => readReceipt(paths, args),
    normalizeReceipt: normalizeFrozenReceipt,
    validateFreezeRecord: validateFreezeContract,
    validateProducerIdentity,
    observeChildEpoch: observeChildEpoch(serverState),
  };
};
