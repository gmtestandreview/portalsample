import { createHash } from 'node:crypto';
import path from 'node:path';
import process from 'node:process';

import { computeInputDigest } from '../storybook-coverage.mjs';

import { FAILURE_CODES, codedError } from './contracts.mjs';
import { collectInputFiles } from './input-inventory.mjs';

export const producerIdentityDigest = (producer) => {
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

const stale = (message) => codedError(FAILURE_CODES.INPUT_STALE, message);

export const assertStableIdentity = async (context, ownedCheckout) => {
  if (context.freeze.inputDigest !== context.inputDigest) {
    throw stale('frozen source input changed');
  }
  const currentInputDigest = computeInputDigest({
    files: collectInputFiles(
      ownedCheckout ?? path.resolve(context.checkout ?? process.cwd()),
    ),
  });
  if (currentInputDigest !== context.inputDigest) {
    throw stale('frozen source input changed');
  }
  if (
    producerIdentityDigest(context.producer) !== context.producerIdentityDigest
  ) {
    throw stale('producer identity changed');
  }
};
