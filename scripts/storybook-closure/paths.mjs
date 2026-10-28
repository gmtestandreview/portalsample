import path from 'node:path';
import process from 'node:process';

import { isOutsideRoot, openOwnedRoot } from './owned-fs.mjs';

export const createOwnedPaths = () => ({
  checkout: undefined,
  receipts: undefined,
});

// Lexical containment only; canonical ownership is enforced by owned-fs.
export const resolveInside = (root, candidate) => {
  const rootPath = path.resolve(root);
  const candidatePath = path.resolve(root, candidate);
  if (isOutsideRoot(path.relative(rootPath, candidatePath))) {
    throw new Error(`path is outside the owned checkout: ${candidate}`);
  }
  return candidatePath;
};

export const establishOwnedPaths = async (paths, { checkout, receipts }) => {
  const checkoutPath = path.resolve(checkout);
  if (process.env.STORYBOOK_CLOSURE_OWNED_CHECKOUT !== checkoutPath) {
    throw new Error(
      'STORYBOOK_CLOSURE_OWNED_CHECKOUT must identify the owned integration checkout',
    );
  }
  const receiptsPath = resolveInside(checkoutPath, receipts);
  if (receiptsPath === checkoutPath)
    throw new Error('receipt directory must be nested');
  // Ownership is decided on the nearest existing ancestor before anything is
  // created, so a symlinked parent cannot redirect the mkdir (R05).
  const owned = await openOwnedRoot(checkoutPath);
  await owned.mkdir(receiptsPath);
  paths.checkout = owned.canonicalRoot;
  paths.receipts = await owned.resolve(receiptsPath);
};
