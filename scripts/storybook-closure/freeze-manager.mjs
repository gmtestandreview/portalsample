import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { computeInputDigest } from '../storybook-coverage.mjs';

import { runIcacls } from './commands.mjs';
import {
  STORYBOOK_INPUT_ROOTS,
  collectFiles,
  collectInputFiles,
} from './input-inventory.mjs';
import { openOwnedRoot } from './owned-fs.mjs';
import { resolveInside } from './paths.mjs';
import { writeReceiptJson } from './receipt-store.mjs';
import {
  assertFreezeIdentityNotDenied,
  createProbeRecords,
  currentIdentity,
  describeAcl,
  releaseSingleFrozenTarget,
  removeProbeFile,
  runDenialProbe,
  writeProbeFile,
} from './windows-acl.mjs';

export const createFreezeState = () => ({
  active: undefined,
  targets: [],
  identity: undefined,
});

const assertPathsEstablished = (paths) => {
  if (!paths.checkout || !paths.receipts) {
    throw new Error('owned checkout and receipt directory are not established');
  }
};

// ACL backups live only under the owned receipts directory.
const createBackupDirectory = async (paths, backupDirectory) => {
  const owned = await openOwnedRoot(paths.receipts);
  await owned.mkdir(backupDirectory);
};

const removeBackupDirectory = async (paths, backupDirectory) => {
  const owned = await openOwnedRoot(paths.receipts);
  await owned.rm(backupDirectory, { recursive: true, force: true });
};

const denyWrites = async (target, identity) => {
  await runIcacls(target, [
    '/deny',
    `${identity}:(OI)(CI)(WD,AD,DC)`,
    '/t',
    '/c',
  ]);
  for (const filePath of collectFiles(target)) {
    await runIcacls(filePath, ['/deny', `${identity}:(WD,AD,WA,DE)`, '/c']);
  }
};

// Each probe is paired with its own operation and path, so the ACL evidence
// recorded for an unenforced deny always describes the probe that ran.
const runTargetProbes = async (target, probes, identity) => {
  const results = [];
  for (const { operation, probePath } of probes) {
    const probe = await runDenialProbe(operation, target, probePath);
    results.push(
      probe.denied
        ? probe
        : { ...probe, identity, acl: await describeAcl(probePath) },
    );
  }
  return results;
};

const freezeTarget = async ({
  freezeState,
  target,
  index,
  backupDirectory,
  identity,
}) => {
  const probes = createProbeRecords(target);
  const probePaths = probes.map(({ probePath }) => probePath);
  await Promise.all(
    probePaths.map((probePath) => writeProbeFile(target, probePath)),
  );
  const backupPath = path.join(backupDirectory, `${index}.acl`);
  freezeState.targets.push({ target, backupPath, probePaths });
  await runIcacls(target, ['/save', backupPath, '/t', '/c']);
  await denyWrites(target, identity);
  return runTargetProbes(target, probes, identity);
};

const rollbackFreeze = async (
  freezeState,
  paths,
  identity,
  backupDirectory,
) => {
  for (const frozenTarget of freezeState.targets.toReversed()) {
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
        removeProbeFile(frozenTarget.target, probePath).catch(() => undefined),
      ),
    );
  }
  await removeBackupDirectory(paths, backupDirectory).catch(() => undefined);
};

export const acquireFreezeTransaction = async ({
  freezeState,
  paths,
  freezeId,
}) => {
  assertPathsEstablished(paths);
  const inputDigest = computeInputDigest({
    files: collectInputFiles(paths.checkout),
  });
  const backupDirectory = path.join(
    paths.receipts,
    `.acl-backup-${randomUUID()}`,
  );
  await createBackupDirectory(paths, backupDirectory);
  const identity = currentIdentity();
  freezeState.identity = identity;
  const selectedPaths = STORYBOOK_INPUT_ROOTS.map((inputRoot) =>
    resolveInside(paths.checkout, inputRoot),
  );
  freezeState.targets = [];
  try {
    const denialProbes = [];
    for (const [index, target] of selectedPaths.entries()) {
      denialProbes.push(
        ...(await freezeTarget({
          freezeState,
          target,
          index,
          backupDirectory,
          identity,
        })),
      );
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
    freezeState.active = freeze;
    await writeReceiptJson(paths, 'freeze.json', freeze);
    return freeze;
  } catch (error_) {
    await rollbackFreeze(freezeState, paths, identity, backupDirectory);
    throw error_;
  }
};

const restoreTargets = async (targets, ownerIdentity) => {
  let firstError;
  for (const frozenTarget of targets.toReversed()) {
    const targetError = await releaseSingleFrozenTarget(
      frozenTarget,
      ownerIdentity,
    );
    firstError ??= targetError;
  }
  return firstError;
};

const findResidualDeny = async (targets, ownerIdentity) => {
  let firstError;
  for (const frozenTarget of targets.toReversed()) {
    try {
      await assertFreezeIdentityNotDenied(frozenTarget.target, ownerIdentity);
    } catch (error_) {
      firstError ??= error_;
    }
  }
  return firstError;
};

const recordRestoreFailure = async (paths, freeze, firstError) => {
  freeze.restored = false;
  try {
    await writeReceiptJson(paths, 'freeze.json', freeze);
  } catch (writeError) {
    throw new AggregateError(
      [firstError, writeError],
      'ACL restoration failed and recovery evidence could not be written',
      { cause: writeError },
    );
  }
  throw firstError;
};

export const releaseFreezeTransaction = async (freezeState, paths) => {
  const freeze = freezeState.active;
  if (!freeze) return;
  const ownerIdentity = `${freeze.ownerIdentity ?? freezeState.identity}`;
  const { targets } = freezeState;
  const firstError =
    (await restoreTargets(targets, ownerIdentity)) ??
    (await findResidualDeny(targets, ownerIdentity));
  if (firstError) await recordRestoreFailure(paths, freeze, firstError);
  await removeBackupDirectory(paths, freeze.aclBackupDirectory);
  freeze.restored = true;
  await writeReceiptJson(paths, 'freeze.json', freeze);
  freezeState.targets = [];
  freezeState.active = undefined;
  freezeState.identity = undefined;
};
