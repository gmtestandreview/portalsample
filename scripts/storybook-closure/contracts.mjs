import path from 'node:path';

export const FAILURE_CODES = {
  INVALID_INVOCATION: 'INVALID_INVOCATION',
  INPUT_STALE: 'INPUT_STALE',
  EXECUTION_INCOMPLETE: 'EXECUTION_INCOMPLETE',
};

export const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const codedError = (code, message) =>
  Object.assign(new Error(message), { code });

export const failure = (code, message, phases) => ({
  ok: false,
  code,
  message,
  phases: [...phases],
});

export const throwIfAborted = (signal) => {
  if (!signal?.aborted) return;
  const reason = signal.reason;
  throw codedError(
    FAILURE_CODES.EXECUTION_INCOMPLETE,
    reason instanceof Error ? reason.message : 'closure was interrupted',
  );
};

export const assertResult = (value, fallbackMessage) => {
  if (!isRecord(value) || value.ok !== true) {
    const message =
      isRecord(value) && Array.isArray(value.errors) && value.errors.length > 0
        ? value.errors.map((entry) => entry.message).join('; ')
        : fallbackMessage;
    throw codedError(FAILURE_CODES.EXECUTION_INCOMPLETE, message);
  }
};

export const assertGate = (gate, context) => {
  if (!isRecord(gate) || gate.ok !== true) {
    throw codedError(
      FAILURE_CODES.EXECUTION_INCOMPLETE,
      `gate failed: ${context.name}`,
    );
  }
  if (
    gate.inputDigest !== context.inputDigest ||
    gate.producerIdentityDigest !== context.producerIdentityDigest ||
    gate.freezeId !== context.freezeId
  ) {
    throw codedError(
      FAILURE_CODES.INPUT_STALE,
      `gate input identity changed: ${context.name}`,
    );
  }
};

export const assertHandoff = (completion, freeze, producer) => {
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
    throw codedError(
      FAILURE_CODES.EXECUTION_INCOMPLETE,
      'MCP handoff is missing or stale',
    );
  }
};
