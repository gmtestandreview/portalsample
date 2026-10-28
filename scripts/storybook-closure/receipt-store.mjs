import path from 'node:path';

import { openOwnedRoot } from './owned-fs.mjs';

const RECEIPT_EXTENSION = '.json';

// Receipts are written by fixed or generated base names only, never by a path
// derived from external content.
export const assertReceiptFileName = (fileName) => {
  if (
    typeof fileName !== 'string' ||
    !fileName.endsWith(RECEIPT_EXTENSION) ||
    fileName.includes('/') ||
    fileName.includes('\\') ||
    path.basename(fileName) !== fileName
  ) {
    throw new Error(`receipt file name is not permitted: ${String(fileName)}`);
  }
};

export const assertRequestId = (requestId) => {
  if (!Number.isSafeInteger(requestId) || requestId < 1) {
    throw new Error(`receipt requestId is not permitted: ${String(requestId)}`);
  }
};

export const writeReceiptJson = async (paths, fileName, value) => {
  if (!paths.receipts)
    throw new Error('owned receipt directory is not established');
  assertReceiptFileName(fileName);
  const owned = await openOwnedRoot(paths.receipts);
  await owned.writeFile(fileName, JSON.stringify(value, null, 2), 'utf8');
};

export const writeAwaitingMcp = (
  paths,
  { freeze, producer, target, timeout },
) =>
  writeReceiptJson(paths, 'awaiting-mcp.json', {
    freezeId: freeze.freezeId,
    producerId: producer.producerId,
    mcpURL: target.mcpURL,
    timeout,
  });

export const readReceipt = async (paths, { receipts, receiptFile }) => {
  const owned = await openOwnedRoot(paths.receipts ?? receipts);
  const receipt = await owned.readJson(receiptFile);
  assertRequestId(receipt.requestId);
  try {
    return {
      ...receipt,
      response: await owned.readJson(
        `mcp-response-${receipt.requestId}${RECEIPT_EXTENSION}`,
      ),
    };
  } catch (error_) {
    if (error_.code !== 'ENOENT') throw error_;
    return receipt;
  }
};
