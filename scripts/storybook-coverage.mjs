import path from 'node:path';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { TextDecoder } from 'node:util';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import * as ts from 'typescript';

export const FAILURE_CODES = Object.freeze({
  CLAIM_DUPLICATE: 'CLAIM_DUPLICATE',
  EVIDENCE_MISSING: 'EVIDENCE_MISSING',
  EXECUTION_INCOMPLETE: 'EXECUTION_INCOMPLETE',
  INPUT_STALE: 'INPUT_STALE',
  INVALID_INVOCATION: 'INVALID_INVOCATION',
  MANIFEST_SCHEMA_INVALID: 'MANIFEST_SCHEMA_INVALID',
  REFERENCE_MISSING: 'REFERENCE_MISSING',
  SOURCE_UNRESOLVED: 'SOURCE_UNRESOLVED',
});

const SUCCESS_STATUS = 'status-value:success';

const RENDERABLE_CLASSIFICATIONS = new Set([
  'direct',
  'consumer',
  'forwarding',
]);
const CLASSIFICATIONS = new Set([...RENDERABLE_CLASSIFICATIONS, 'nonvisual']);
const MANIFEST_KEYS = ['schemaVersion', 'records'];
const RECORD_KEYS = [
  'source',
  'export',
  'classification',
  'owner',
  'reason',
  'docsOwnerId',
  'states',
  'review',
];
const STATE_KEYS = [
  'name',
  'applicability',
  'outcome',
  'storyFile',
  'storyExport',
  'storyId',
  'assertionFile',
  'assertionExport',
  'assertionMarker',
  'rationale',
];
const REVIEW_KEYS = ['reviewer', 'rationale', 'reviewedSourceDigest'];

const isRecord = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasOwn = (value, key) => Object.hasOwn(value, key);

const sameKeys = (value, expected) => {
  return (
    Object.keys(value).length === expected.length &&
    expected.every((key) => hasOwn(value, key))
  );
};

const nonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const normalisePathSeparators = (value) => value.replaceAll('\\', '/');

const hasRelativePathSegments = (value) =>
  !value.startsWith('/') &&
  !/^[A-Za-z]:\//u.test(value) &&
  !value.split('/').some((part) => part === '' || part === '..');

const isRelativePath = (value) => {
  if (!nonEmptyString(value)) return false;
  const normalised = normalisePathSeparators(value);
  return normalised === value && hasRelativePathSegments(normalised);
};

const error = (code, message, pathValue) => ({
  code,
  message,
  ...(pathValue ? { path: pathValue } : {}),
});

const result = (errors = []) => ({
  ok: errors.length === 0,
  errors,
});

const skipJsonWhitespace = (text, index) => {
  let next = index;
  while (/\s/u.test(text.charAt(next))) next += 1;
  return next;
};

const parseJsonString = (text, start) => {
  let index = start + 1;
  let escaped = false;
  while (index < text.length) {
    const character = text.charAt(index);
    if (escaped) {
      escaped = false;
      index += 1;
      continue;
    }
    if (character === '\\') {
      escaped = true;
      index += 1;
      continue;
    }
    if (character === '"') {
      const raw = text.slice(start, index + 1);
      return { value: JSON.parse(raw), next: index + 1 };
    }
    if (character < ' ')
      throw new Error('manifest JSON contains a control character');
    index += 1;
  }
  throw new Error('manifest JSON contains an unterminated string');
};

const isJsonDigit = (value) => value >= '0' && value <= '9';

const skipJsonDigits = (text, start) => {
  let index = start;
  while (isJsonDigit(text.charAt(index))) index += 1;
  return index;
};

const skipJsonFraction = (text, start) => {
  if (text.charAt(start) !== '.') return start;
  const decimalStart = start + 1;
  const end = skipJsonDigits(text, decimalStart);
  return end === decimalStart ? start : end;
};

const skipJsonExponent = (text, start) => {
  const marker = text.charAt(start);
  if (marker !== 'e' && marker !== 'E') return start;
  let exponentStart = start + 1;
  if (
    text.charAt(exponentStart) === '+' ||
    text.charAt(exponentStart) === '-'
  ) {
    exponentStart += 1;
  }
  const end = skipJsonDigits(text, exponentStart);
  return end === exponentStart ? start : end;
};

const skipJsonNumber = (text, start) => {
  let index = start;
  if (text.charAt(index) === '-') index += 1;
  const firstDigit = text.charAt(index);
  if (firstDigit === '0') {
    index += 1;
  } else if (firstDigit >= '1' && firstDigit <= '9') {
    index = skipJsonDigits(text, index);
  } else {
    throw new Error('manifest JSON value is invalid');
  }
  return skipJsonExponent(text, skipJsonFraction(text, index));
};

function skipJsonObject(text, start) {
  let index = skipJsonWhitespace(text, start + 1);
  if (text.charAt(index) === '}') return index + 1;
  const keys = new Set();
  while (index < text.length) {
    index = skipJsonWhitespace(text, index);
    if (text.charAt(index) !== '"')
      throw new Error('manifest JSON object key is invalid');
    const key = parseJsonString(text, index);
    index = skipJsonWhitespace(text, key.next);
    if (text.charAt(index) !== ':')
      throw new Error('manifest JSON object is missing a colon');
    if (keys.has(key.value)) {
      throw new Error(`duplicate manifest JSON key: ${key.value}`);
    }
    keys.add(key.value);
    index = skipJsonWhitespace(text, skipJsonValue(text, index + 1));
    if (text.charAt(index) === '}') return index + 1;
    if (text.charAt(index) !== ',')
      throw new Error('manifest JSON object is missing a comma');
    index += 1;
  }
  throw new Error('manifest JSON object is unterminated');
}

function skipJsonArray(text, start) {
  let index = skipJsonWhitespace(text, start + 1);
  if (text.charAt(index) === ']') return index + 1;
  while (index < text.length) {
    index = skipJsonWhitespace(text, skipJsonValue(text, index));
    if (text.charAt(index) === ']') return index + 1;
    if (text.charAt(index) !== ',')
      throw new Error('manifest JSON array is missing a comma');
    index += 1;
  }
  throw new Error('manifest JSON array is unterminated');
}

function skipJsonValue(text, start) {
  const index = skipJsonWhitespace(text, start);
  const character = text.charAt(index);
  if (character === '"') return parseJsonString(text, index).next;
  if (character === '{') return skipJsonObject(text, index);
  if (character === '[') return skipJsonArray(text, index);
  const literal = ['true', 'false', 'null'].find((candidate) =>
    text.startsWith(candidate, index),
  );
  if (literal) return index + literal.length;
  return skipJsonNumber(text, index);
}

const assertUniqueJsonKeys = (text) => {
  const index = skipJsonWhitespace(text, skipJsonValue(text, 0));
  if (index !== text.length)
    throw new Error('manifest JSON has trailing content');
};

export const parseJsonDocument = (text) => {
  if (typeof text !== 'string') {
    throw new TypeError('JSON document must be a string');
  }
  assertUniqueJsonKeys(text);
  return JSON.parse(text);
};

const compareKeys = (left, right) => {
  if (left < right) return -1;
  return left > right ? 1 : 0;
};

const canonicaliseJson = (value, segments = []) => {
  if (Array.isArray(value)) {
    return value.map((entry, index) =>
      canonicaliseJson(entry, [...segments, index]),
    );
  }
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value)
      .sort(([leftKey], [rightKey]) => compareKeys(leftKey, rightKey))
      .filter(
        ([key]) =>
          !(
            key === 'reviewedSourceDigest' &&
            segments.length === 3 &&
            segments[0] === 'records' &&
            Number.isInteger(segments[1]) &&
            segments[2] === 'review'
          ),
      )
      .map(([key, entryValue]) => [
        key,
        canonicaliseJson(entryValue, [...segments, key]),
      ]),
  );
};

const normaliseInputPath = (value) => {
  if (typeof value !== 'string') throw new Error('input path must be a string');
  const normalised = normalisePathSeparators(value.normalize('NFC'));
  if (normalised.startsWith('/') || /^[A-Za-z]:\//u.test(normalised)) {
    throw new Error(`input path must be relative: ${value}`);
  }
  const parts = normalised.split('/');
  if (parts.some((part) => part === '' || part === '..')) {
    throw new Error(`input path contains an invalid segment: ${value}`);
  }
  const compact = parts.filter((part) => part !== '.').join('/');
  if (compact === '') throw new Error(`input path is empty: ${value}`);
  return compact;
};

const bytesForInput = (content) => {
  if (typeof content === 'string') return Buffer.from(content, 'utf8');
  if (content instanceof Uint8Array || ArrayBuffer.isView(content)) {
    return Buffer.from(content.buffer, content.byteOffset, content.byteLength);
  }
  throw new Error('input content must be a string or Uint8Array');
};

export function computeInputDigest({
  files,
  manifestPath = 'ClientApp/src/storybook/coverageManifest.json',
}) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('input files must be a non-empty array');
  }

  const canonicalManifestPath = normaliseInputPath(manifestPath);
  const normalizedFiles = files.map((file) => {
    if (!isRecord(file)) throw new Error('input file must be an object');
    const filePath = normaliseInputPath(file.path);
    let content = bytesForInput(file.content);
    if (filePath === canonicalManifestPath) {
      const manifestText =
        typeof file.content === 'string'
          ? file.content
          : new TextDecoder().decode(file.content);
      assertUniqueJsonKeys(manifestText);
      content = Buffer.from(
        JSON.stringify(canonicaliseJson(parseJsonDocument(manifestText))),
        'utf8',
      );
    }
    return { filePath, content };
  });

  const seenPaths = new Set();
  const seenCaseFoldedPaths = new Set();
  for (const { filePath } of normalizedFiles) {
    if (
      seenPaths.has(filePath) ||
      seenCaseFoldedPaths.has(filePath.toLowerCase())
    ) {
      throw new Error(`input path collision: ${filePath}`);
    }
    seenPaths.add(filePath);
    seenCaseFoldedPaths.add(filePath.toLowerCase());
  }

  if (!seenPaths.has(canonicalManifestPath)) {
    throw new Error('input files must include the canonical coverage manifest');
  }

  normalizedFiles.sort((left, right) =>
    Buffer.compare(
      Buffer.from(left.filePath, 'utf8'),
      Buffer.from(right.filePath, 'utf8'),
    ),
  );
  const hash = createHash('sha256');
  hash.update(Buffer.from('storybook-coverage-input-v1\0', 'utf8'));
  for (const { filePath, content } of normalizedFiles) {
    const pathBytes = Buffer.from(filePath, 'utf8');
    const pathLength = Buffer.alloc(8);
    pathLength.writeBigUInt64BE(BigInt(pathBytes.length));
    const contentLength = Buffer.alloc(8);
    contentLength.writeBigUInt64BE(BigInt(content.length));
    hash
      .update(pathLength)
      .update(pathBytes)
      .update(contentLength)
      .update(content);
  }
  return `sha256:${hash.digest('hex')}`;
}

export function computeIndexDigest(index) {
  return `sha256:${createHash('sha256')
    .update('storybook-coverage-index-v1\0', 'utf8')
    .update(JSON.stringify(canonicaliseJson(index)), 'utf8')
    .digest('hex')}`;
}

export function validateFreezeRecord({
  freeze,
  expectedInputDigest,
  selectedPaths,
}) {
  const errors = [];
  if (!isRecord(freeze)) {
    return result([
      error(FAILURE_CODES.EXECUTION_INCOMPLETE, 'freeze record is required'),
    ]);
  }
  if (!nonEmptyString(freeze.freezeId)) {
    errors.push(
      error(FAILURE_CODES.EXECUTION_INCOMPLETE, 'freezeId is required'),
    );
  }
  if (freeze.inputDigest !== expectedInputDigest) {
    errors.push(
      error(FAILURE_CODES.EXECUTION_INCOMPLETE, 'freeze inputDigest is stale'),
    );
  }
  if (!Array.isArray(selectedPaths) || selectedPaths.length === 0) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'selected input paths are required',
      ),
    );
  }
  const protectedPaths = Array.isArray(freeze.protectedPaths)
    ? freeze.protectedPaths
    : [];
  const selectedPathSet = new Set(selectedPaths ?? []);
  const protectedPathSet = new Set(protectedPaths);
  if (
    protectedPathSet.size !== protectedPaths.length ||
    selectedPathSet.size !== (selectedPaths ?? []).length ||
    protectedPathSet.size !== selectedPathSet.size ||
    [...selectedPathSet].some(
      (selectedPath) => !protectedPathSet.has(selectedPath),
    ) ||
    [...protectedPathSet].some(
      (protectedPath) => !selectedPathSet.has(protectedPath),
    )
  ) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'freeze does not protect every selected path',
      ),
    );
  }

  const requiredOperations = [
    'overwrite',
    'append',
    'create',
    'delete',
    'rename',
  ];
  const denialProbes = Array.isArray(freeze.denialProbes)
    ? freeze.denialProbes
    : [];
  for (const operation of requiredOperations) {
    const attempts = denialProbes.filter(
      (probe) => probe?.operation === operation,
    );
    if (!attempts.some((probe) => probe.denied === true)) {
      const observed = [
        ...new Set(attempts.map((probe) => probe.errorCode ?? 'succeeded')),
      ].join(',');
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `freeze denial probe did not reject ${operation}` +
            (observed ? ` (observed: ${observed})` : ' (no probe recorded)'),
        ),
      );
    }
  }
  if (freeze.restored !== false) {
    errors.push(
      error(FAILURE_CODES.EXECUTION_INCOMPLETE, 'freeze ACLs are not active'),
    );
  }
  return result(errors);
}

const statusEntries = (value, label, requestedIds, errors) => {
  if (!Array.isArray(value)) {
    errors.push(
      error(FAILURE_CODES.EXECUTION_INCOMPLETE, `${label} must be an array`),
    );
    return [];
  }

  const seen = new Set();
  for (const entry of value) {
    if (!isRecord(entry) || !nonEmptyString(entry.storyId)) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `${label} contains a result without a storyId`,
        ),
      );
      continue;
    }

    if (seen.has(entry.storyId)) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `${label} contains a duplicate storyId: ${entry.storyId}`,
        ),
      );
    }
    seen.add(entry.storyId);

    if (!requestedIds.has(entry.storyId)) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `${label} contains an unknown storyId: ${entry.storyId}`,
        ),
      );
    }

    if (entry.status !== SUCCESS_STATUS) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `${label} did not pass for ${entry.storyId}`,
        ),
      );
    }
  }

  for (const storyId of requestedIds) {
    if (!seen.has(storyId)) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `${label} is missing the requested storyId: ${storyId}`,
        ),
      );
    }
  }

  return value;
};

const markdownSectionEntries = (markdown, heading) => {
  const lines = markdown.split(/\r?\n/u);
  const headingLine = `## ${heading}`;
  const headingIndex = lines.findIndex((line) => line.trim() === headingLine);
  if (headingIndex < 0) return [];

  const entries = [];
  for (const line of lines.slice(headingIndex + 1)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) break;
    if (trimmed.startsWith('- ')) entries.push(trimmed.slice(2).trim());
    if (trimmed.startsWith('### ')) entries.push(trimmed.slice(4).trim());
  }
  return entries.filter(Boolean);
};

const normalizeMarkdownMcpReport = (response, requestedIds, errors) => {
  const markdown = Array.isArray(response?.content)
    ? response.content
        .filter(
          (block) => block?.type === 'text' && typeof block.text === 'string',
        )
        .map((block) => block.text)
        .join('\n')
    : '';
  if (!markdown) return undefined;

  const passingStoryIds = markdownSectionEntries(markdown, 'Passing Stories');
  if (passingStoryIds.length === 0) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'MCP markdown response is missing Passing Stories',
      ),
    );
  }
  const failingStoryIds = markdownSectionEntries(markdown, 'Failing Stories');
  const accessibilityViolationStoryIds = markdownSectionEntries(
    markdown,
    'Accessibility Violations',
  );
  const unhandledErrors = markdownSectionEntries(markdown, 'Unhandled Errors');
  if (failingStoryIds.length > 0) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'MCP markdown response contains failing stories',
      ),
    );
  }
  if (accessibilityViolationStoryIds.length > 0) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'MCP markdown response contains accessibility violations',
      ),
    );
  }
  if (unhandledErrors.length > 0) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'MCP markdown response contains unhandled errors',
      ),
    );
  }

  const statuses = passingStoryIds.map((storyId) => ({
    storyId,
    status: 'status-value:success',
  }));
  const componentTestStatuses = statusEntries(
    statuses,
    'componentTestStatuses',
    requestedIds,
    errors,
  );
  const a11yStatuses = statusEntries(
    statuses,
    'a11yStatuses',
    requestedIds,
    errors,
  );
  return {
    status: 'completed',
    result: {
      componentTestStatuses,
      a11yStatuses,
      counts: {
        requested: passingStoryIds.length,
        executed: passingStoryIds.length,
        component: passingStoryIds.length,
        a11y: passingStoryIds.length,
      },
      unhandledErrors,
    },
    report: {
      passingStoryIds,
      failingStoryIds,
      accessibilityViolationStoryIds,
      unhandledErrors,
      missingSections: [
        'Passing Stories',
        'Failing Stories',
        'Accessibility Violations',
        'Unhandled Errors',
      ].filter(
        (heading) => markdownSectionEntries(markdown, heading).length === 0,
      ),
    },
  };
};

const validChildEpoch = (value) =>
  isRecord(value) &&
  Number.isInteger(value.pid) &&
  value.pid > 0 &&
  nonEmptyString(value.createdAt);

const receiptFieldErrors = ({
  freezeId,
  producerId,
  inputDigest,
  producerIdentityDigest,
  childEpoch,
  expectedInputDigest,
  expectedProducerIdentityDigest,
  requestedStoryIds,
}) => {
  const errors = [];
  for (const [field, value] of [
    ['freezeId', freezeId],
    ['producerId', producerId],
    ['inputDigest', inputDigest],
    ['producerIdentityDigest', producerIdentityDigest],
  ]) {
    if (!nonEmptyString(value)) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `receipt is missing ${field}`,
        ),
      );
    }
  }
  if (!validChildEpoch(childEpoch)) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'receipt is missing child provenance',
      ),
    );
  }
  if (
    expectedInputDigest !== undefined &&
    inputDigest !== expectedInputDigest
  ) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'receipt inputDigest does not match the selected freeze',
      ),
    );
  }
  if (
    expectedProducerIdentityDigest !== undefined &&
    producerIdentityDigest !== expectedProducerIdentityDigest
  ) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'receipt producerIdentityDigest does not match the selected producer',
      ),
    );
  }
  if (!Array.isArray(requestedStoryIds) || requestedStoryIds.length === 0) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'at least one requested story ID is required',
      ),
    );
  }
  const requestedList = requestedStoryIds ?? [];
  if (new Set(requestedList).size !== requestedList.length) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'requested story IDs must be unique',
      ),
    );
  }
  return errors;
};

const executionSummaryErrors = (execution, requestedIds) => {
  const errors = [];
  const counts = execution?.counts;
  if (
    !isRecord(counts) ||
    counts.requested !== requestedIds.size ||
    counts.executed !== requestedIds.size ||
    counts.component !== requestedIds.size ||
    counts.a11y !== requestedIds.size
  ) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'MCP result counts do not match the requested story IDs',
      ),
    );
  }

  if (!Array.isArray(execution?.unhandledErrors)) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'MCP result is missing unhandledErrors',
      ),
    );
  } else if (execution.unhandledErrors.length > 0) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'MCP result contains unhandled errors',
      ),
    );
  }
  return errors;
};

export function normalizeMcpReceipt({
  requestId,
  requestedStoryIds,
  response,
  freezeId,
  producerId,
  inputDigest,
  producerIdentityDigest,
  mcpURL,
  childEpoch,
  expectedInputDigest,
  expectedProducerIdentityDigest,
}) {
  const errors = receiptFieldErrors({
    freezeId,
    producerId,
    inputDigest,
    producerIdentityDigest,
    childEpoch,
    expectedInputDigest,
    expectedProducerIdentityDigest,
    requestedStoryIds,
  });
  const requestedIds = new Set(requestedStoryIds ?? []);

  if (!isRecord(response) || response.isError === true || response.error) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'MCP response contains a protocol error',
      ),
    );
  }

  const structuredContent = isRecord(response?.structuredContent)
    ? response.structuredContent
    : normalizeMarkdownMcpReport(response, requestedIds, errors);
  if (structuredContent?.status !== 'completed') {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        `MCP execution status was ${structuredContent?.status ?? 'missing'}`,
      ),
    );
  }

  const execution = isRecord(structuredContent?.result)
    ? structuredContent.result
    : undefined;
  if (execution === undefined) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'MCP response is missing the structured execution result',
      ),
    );
  }

  const componentStatuses = statusEntries(
    execution?.componentTestStatuses,
    'componentTestStatuses',
    requestedIds,
    errors,
  );
  const a11yStatuses = statusEntries(
    execution?.a11yStatuses,
    'a11yStatuses',
    requestedIds,
    errors,
  );
  errors.push(...executionSummaryErrors(execution, requestedIds));

  if (errors.length > 0) return { ...result(errors) };

  return {
    ...result(),
    receipt: {
      receiptId: `receipt-${String(requestId)}`,
      requestId,
      requestedStoryIds: [...requestedStoryIds],
      executedStoryIds: componentStatuses.map((entry) => entry.storyId),
      componentTestStatuses: componentStatuses,
      a11yStatuses,
      freezeId,
      producerId,
      inputDigest,
      producerIdentityDigest,
      ...(nonEmptyString(mcpURL) ? { mcpURL } : {}),
      childEpoch,
      ...(structuredContent.report ? { report: structuredContent.report } : {}),
      verdict: 'passed',
    },
  };
}

export function validateProducerIdentity({
  producer,
  receipt,
  expectedMcpURL,
  expectedFreezeId,
  expectedChildEpoch,
}) {
  const errors = [];
  if (!isRecord(producer) || !isRecord(receipt)) {
    return result([
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'producer and receipt records are required',
      ),
    ]);
  }

  const producerFieldValues = [
    ['producerId', producer.producerId],
    ['producerIdentityDigest', producer.producerIdentityDigest],
    ['checkout', producer.checkout],
    ['commit', producer.commit],
    ['inputDigest', producer.inputDigest],
    ['freezeId', producer.freezeId],
    ['mcpURL', producer.mcpURL],
    ['serverStartedAt', producer.serverStartedAt],
    ['cwd', producer.cwd],
  ];
  for (const [field, value] of producerFieldValues) {
    if (!nonEmptyString(value)) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `producer is missing ${field}`,
        ),
      );
    }
  }
  if (!Number.isInteger(producer.serverPid) || producer.serverPid <= 0) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'producer serverPid must be a positive integer',
      ),
    );
  }
  if (
    typeof expectedMcpURL !== 'string' ||
    producer.mcpURL !== expectedMcpURL
  ) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'producer native MCP URL does not match the selected endpoint',
      ),
    );
  }
  if (producer.freezeId !== expectedFreezeId) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'producer freezeId does not match the selected freeze',
      ),
    );
  }

  for (const [field, receiptValue, producerValue] of [
    ['producerId', receipt.producerId, producer.producerId],
    [
      'producerIdentityDigest',
      receipt.producerIdentityDigest,
      producer.producerIdentityDigest,
    ],
    ['inputDigest', receipt.inputDigest, producer.inputDigest],
    ['freezeId', receipt.freezeId, producer.freezeId],
    ['mcpURL', receipt.mcpURL, producer.mcpURL],
  ]) {
    if (receiptValue !== producerValue) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `receipt ${field} does not match producer identity`,
        ),
      );
    }
  }

  if (
    !validChildEpoch(expectedChildEpoch) ||
    !validChildEpoch(receipt.childEpoch)
  ) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'expected and receipt child provenance are required',
      ),
    );
  } else if (
    expectedChildEpoch.pid !== receipt.childEpoch.pid ||
    expectedChildEpoch.createdAt !== receipt.childEpoch.createdAt
  ) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'receipt child provenance does not match the producer epoch',
      ),
    );
  }

  return result(errors);
}

const isRenderable = (classification) =>
  RENDERABLE_CLASSIFICATIONS.has(classification);

const isMeaningfulOutcome = (state) => {
  if (
    !nonEmptyString(state.outcome) ||
    !nonEmptyString(state.assertionMarker)
  ) {
    return false;
  }
  const outcome = state.outcome.trim().toLowerCase();
  const marker = state.assertionMarker.trim().toLowerCase();
  const smokeOutcomes = new Set([
    'mounts',
    'renders',
    'renders without throwing',
    'exists',
    'is present',
    'smoke',
  ]);
  return !smokeOutcomes.has(outcome) && marker !== 'rendered';
};

const validateState = (state, recordPath, errors) => {
  if (!isRecord(state) || !sameKeys(state, STATE_KEYS)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'state must contain exactly the schema v1 state fields',
        recordPath,
      ),
    );
    return;
  }

  if (!nonEmptyString(state.name) || !nonEmptyString(state.rationale)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'state name and rationale must be non-empty strings',
        recordPath,
      ),
    );
  }

  if (!['required', 'not-supported'].includes(state.applicability)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'state applicability must be required or not-supported',
        recordPath,
      ),
    );
    return;
  }

  const hasValidOutcome = nonEmptyString(state.outcome);
  if (!hasValidOutcome) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'state outcome must be a non-empty string',
        recordPath,
      ),
    );
  }

  if (state.applicability === 'required') {
    if (
      !nonEmptyString(state.storyFile) ||
      !nonEmptyString(state.storyExport) ||
      !nonEmptyString(state.storyId) ||
      !nonEmptyString(state.assertionFile) ||
      !nonEmptyString(state.assertionExport) ||
      !nonEmptyString(state.assertionMarker) ||
      !isMeaningfulOutcome(state)
    ) {
      errors.push(
        error(
          FAILURE_CODES.EVIDENCE_MISSING,
          'required state needs a meaningful outcome and complete story/assertion references',
          recordPath,
        ),
      );
    }
  } else if (
    state.storyFile !== null ||
    state.storyExport !== null ||
    state.storyId !== null ||
    state.assertionFile !== null ||
    state.assertionExport !== null ||
    state.assertionMarker !== null ||
    !hasValidOutcome ||
    state.outcome.trim().length < 12
  ) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'not-supported state needs a specific rationale and no story/assertion references',
        recordPath,
      ),
    );
  }
};

const validateRecordDetails = (record, recordPath, errors) => {
  if (!isRelativePath(record.source) || !nonEmptyString(record.export)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'record source and export must identify a relative canonical declaration',
        recordPath,
      ),
    );
  }
  if (!CLASSIFICATIONS.has(record.classification)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'record classification is not supported by schema v1',
        recordPath,
      ),
    );
  }
  if (!nonEmptyString(record.owner) || !nonEmptyString(record.reason)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'record owner and reason must be non-empty strings',
        recordPath,
      ),
    );
  }
  if (!Array.isArray(record.states)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'record states must be an array',
        recordPath,
      ),
    );
  }
};

const validateRecordReview = (record, recordPath, errors) => {
  if (!isRecord(record.review) || !sameKeys(record.review, REVIEW_KEYS)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'record review must contain exactly the schema v1 review fields',
        recordPath,
      ),
    );
  } else if (
    !nonEmptyString(record.review.reviewer) ||
    !nonEmptyString(record.review.rationale) ||
    !nonEmptyString(record.review.reviewedSourceDigest)
  ) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'review fields must be non-empty strings',
        recordPath,
      ),
    );
  }
};

const validateRenderableRecord = (record, recordPath, errors) => {
  if (!nonEmptyString(record.docsOwnerId)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'renderable records need a docsOwnerId',
        recordPath,
      ),
    );
  }
  if (!Array.isArray(record.states)) return;

  for (const state of record.states) {
    validateState(state, recordPath, errors);
  }
  const requiredStates = record.states.filter(
    (state) => isRecord(state) && state.applicability === 'required',
  );
  if (requiredStates.every((state) => !isMeaningfulOutcome(state))) {
    errors.push(
      error(
        FAILURE_CODES.EVIDENCE_MISSING,
        'renderable records need a meaningful required baseline state',
        recordPath,
      ),
    );
  }
};

const validateNonvisualRecord = (record, recordPath, errors) => {
  if (record.docsOwnerId !== null) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'nonvisual records must have a null docsOwnerId',
        recordPath,
      ),
    );
  }
  if (!Array.isArray(record.states) || record.states.length !== 0) {
    errors.push(
      error(
        FAILURE_CODES.EVIDENCE_MISSING,
        'nonvisual records cannot carry UI states',
        recordPath,
      ),
    );
  }
};

const validateRecord = (record, index, errors) => {
  const recordPath = `records[${index}]`;
  if (!isRecord(record) || !sameKeys(record, RECORD_KEYS)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'record must contain exactly the schema v1 record fields',
        recordPath,
      ),
    );
    return;
  }

  validateRecordDetails(record, recordPath, errors);
  validateRecordReview(record, recordPath, errors);
  if (isRenderable(record.classification)) {
    validateRenderableRecord(record, recordPath, errors);
  } else {
    validateNonvisualRecord(record, recordPath, errors);
  }
};

export function validateManifest(manifest) {
  const errors = [];
  if (
    !isRecord(manifest) ||
    !sameKeys(manifest, MANIFEST_KEYS) ||
    manifest.schemaVersion !== 1 ||
    !Array.isArray(manifest.records)
  ) {
    return result([
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'manifest must be an object with schemaVersion 1 and records',
      ),
    ]);
  }
  manifest.records.forEach((record, index) =>
    validateRecord(record, index, errors),
  );
  return result(errors);
}

const excludedSourcePath = (filePath) =>
  /(^|\/)(\.claude|\.git|stories?|tests?|__tests__|vendor|external|generated|node_modules|reports|storybook-static|dist)(\/|$)/u.test(
    filePath,
  ) || /\.(stories|test|spec|d)\.(tsx?|jsx?)$/u.test(filePath);

const sourceFileKind = (node) =>
  ts.isFunctionDeclaration(node) ||
  ts.isClassDeclaration(node) ||
  ts.isVariableStatement(node)
    ? 'renderable'
    : 'nonvisual';

const exported = (node) =>
  node.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
  ) ?? false;

const declarationName = (node) => {
  if ('name' in node && node.name && ts.isIdentifier(node.name)) {
    return node.name.text;
  }
  return undefined;
};

const moduleSpecifierText = (node) =>
  node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)
    ? node.moduleSpecifier.text
    : undefined;

const isDeclarationStatement = (statement) =>
  ts.isFunctionDeclaration(statement) ||
  ts.isClassDeclaration(statement) ||
  ts.isInterfaceDeclaration(statement) ||
  ts.isTypeAliasDeclaration(statement) ||
  ts.isEnumDeclaration(statement);

const collectDeclaration = (statement, filePath, locals, direct) => {
  const name = declarationName(statement);
  const isDefault = statement.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword,
  );
  if (name) {
    const entry = {
      export: name,
      kind: sourceFileKind(statement),
    };
    locals.set(name, entry);
    if (exported(statement) && !isDefault) {
      direct.push({ source: filePath, ...entry, provenance: 'direct' });
    }
  }
  if (exported(statement) && isDefault) {
    direct.push({
      source: filePath,
      export: 'default',
      kind: sourceFileKind(statement),
      provenance: 'direct',
    });
  }
};

const collectVariableStatement = (statement, filePath, locals, direct) => {
  for (const declaration of statement.declarationList.declarations) {
    if (!ts.isIdentifier(declaration.name)) continue;
    const entry = {
      export: declaration.name.text,
      kind: 'renderable',
    };
    locals.set(declaration.name.text, entry);
    if (exported(statement)) {
      direct.push({ source: filePath, ...entry, provenance: 'direct' });
    }
  }
};

const collectImportDeclaration = (statement, imports) => {
  const module = moduleSpecifierText(statement);
  const importClause = statement.importClause;
  if (!module || !importClause) return;

  if (importClause.name) {
    imports.set(importClause.name.text, { module, imported: 'default' });
  }

  if (
    importClause.namedBindings &&
    ts.isNamedImports(importClause.namedBindings)
  ) {
    for (const element of importClause.namedBindings.elements) {
      imports.set(element.name.text, {
        module,
        imported: element.propertyName?.text ?? element.name.text,
      });
    }
  }
};

const collectExportAssignment = (
  statement,
  filePath,
  locals,
  reExports,
  direct,
) => {
  if (
    ts.isIdentifier(statement.expression) &&
    locals.has(statement.expression.text)
  ) {
    reExports.push({
      local: statement.expression.text,
      exported: 'default',
    });
    return;
  }
  direct.push({
    source: filePath,
    export: 'default',
    kind: 'renderable',
    provenance: 'direct',
  });
};

const collectExportDeclaration = (statement, reExports) => {
  const module = moduleSpecifierText(statement);
  const namedExports =
    statement.exportClause && ts.isNamedExports(statement.exportClause)
      ? statement.exportClause.elements
      : undefined;
  if (namedExports) {
    for (const element of namedExports) {
      reExports.push({
        ...(module
          ? { module }
          : { local: element.propertyName?.text ?? element.name.text }),
        ...(module
          ? { imported: element.propertyName?.text ?? element.name.text }
          : {}),
        exported: element.name.text,
      });
    }
  } else if (module) {
    reExports.push({ module, star: true });
  }
};

const parseSourceFile = (file) => {
  const sourceFile = ts.createSourceFile(
    file.path,
    file.content,
    ts.ScriptTarget.Latest,
    true,
    file.path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const locals = new Map();
  const imports = new Map();
  const direct = [];
  const reExports = [];

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      collectImportDeclaration(statement, imports);
    } else if (isDeclarationStatement(statement)) {
      collectDeclaration(statement, file.path, locals, direct);
    } else if (ts.isVariableStatement(statement)) {
      collectVariableStatement(statement, file.path, locals, direct);
    } else if (ts.isExportAssignment(statement)) {
      collectExportAssignment(statement, file.path, locals, reExports, direct);
    } else if (ts.isExportDeclaration(statement)) {
      collectExportDeclaration(statement, reExports);
    }
  }

  return { locals, imports, direct, reExports };
};

const resolveModule = (fromPath, specifier, filesByPath) => {
  if (!specifier.startsWith('.')) {
    return { error: 'non-relative module' };
  }
  const fromDirectory = path.posix.dirname(fromPath);
  const requested = path.posix.normalize(
    path.posix.join(
      fromDirectory,
      specifier.replace(/[.](?:[cm]?[jt]sx?)$/u, ''),
    ),
  );
  const candidates = [
    requested,
    `${requested}.ts`,
    `${requested}.tsx`,
    `${requested}.mts`,
    `${requested}.cts`,
    `${requested}/index.ts`,
    `${requested}/index.tsx`,
    `${requested}/index.mts`,
    `${requested}/index.cts`,
  ].filter((candidate) => filesByPath.has(candidate));
  const uniqueCandidates = [...new Set(candidates)];
  if (uniqueCandidates.length !== 1) {
    return {
      error:
        uniqueCandidates.length === 0
          ? 'module not found'
          : 'ambiguous module resolution',
    };
  }
  return { path: uniqueCandidates[0] };
};

const uniqueEntries = (entries) => {
  const unique = [];
  const keys = new Set();
  for (const entry of entries) {
    const key = `${entry.source}|${entry.export}`;
    if (!keys.has(key)) {
      keys.add(key);
      unique.push(entry);
    }
  }
  return unique;
};

function resolveLocalReExport({
  filePath,
  reExport,
  module,
  nextStack,
  cache,
  parsed,
  filesByPath,
  addUnresolved,
}) {
  const local = module.locals.get(reExport.local);
  if (local) {
    return [
      {
        source: filePath,
        ...local,
        export: reExport.exported,
        provenance: 'forwarding',
      },
    ];
  }

  const imported = module.imports.get(reExport.local);
  if (imported) {
    return resolveModuleReExport({
      filePath,
      reExport: { ...imported, exported: reExport.exported },
      nextStack,
      cache,
      parsed,
      filesByPath,
      addUnresolved,
    }).map((entry) => ({ ...entry, provenance: 'consumer' }));
  }

  addUnresolved({
    source: filePath,
    export: reExport.exported,
    reason: 'export declaration has no local source',
  });
  return [];
}

function resolveModuleReExport({
  filePath,
  reExport,
  nextStack,
  cache,
  parsed,
  filesByPath,
  addUnresolved,
}) {
  if (!reExport.module.startsWith('.')) return [];

  const resolved = resolveModule(filePath, reExport.module, filesByPath);
  if (!resolved.path) {
    addUnresolved({
      source: filePath,
      export: reExport.star ? '*' : reExport.exported,
      reason: resolved.error,
    });
    return [];
  }

  const targetEntries = visitSourceFile({
    filePath: resolved.path,
    stack: nextStack,
    cache,
    parsed,
    filesByPath,
    addUnresolved,
  });
  if (reExport.star) {
    return targetEntries.filter((entry) => entry.export !== 'default');
  }

  const target = targetEntries.find(
    (entry) => entry.export === reExport.imported,
  );
  if (!target) {
    addUnresolved({
      source: filePath,
      export: reExport.exported,
      reason: 're-export target is unresolved',
    });
    return [];
  }
  return [{ ...target, export: reExport.exported, provenance: 'forwarding' }];
}

function visitSourceFile({
  filePath,
  stack = new Set(),
  cache,
  parsed,
  filesByPath,
  addUnresolved,
}) {
  if (cache.has(filePath)) return cache.get(filePath);
  if (stack.has(filePath)) {
    addUnresolved({
      source: filePath,
      export: '*',
      reason: 'cyclic re-export',
    });
    return [];
  }
  const module = parsed.get(filePath);
  if (!module) return [];

  const nextStack = new Set(stack).add(filePath);
  const entries = [...module.direct];
  for (const reExport of module.reExports) {
    const resolvedEntries = reExport.module
      ? resolveModuleReExport({
          filePath,
          reExport,
          nextStack,
          cache,
          parsed,
          filesByPath,
          addUnresolved,
        })
      : resolveLocalReExport({
          filePath,
          reExport,
          module,
          nextStack,
          cache,
          parsed,
          filesByPath,
          addUnresolved,
        });
    entries.push(...resolvedEntries);
  }

  const unique = uniqueEntries(entries);
  cache.set(filePath, unique);
  return unique;
}

const isInventorySourcePath = (filePath) =>
  filePath.startsWith('ClientApp/src/components/') ||
  filePath.startsWith('ClientApp/src/routes/');

export function discoverSourceExports({ files }) {
  const sourceFiles = files
    .filter(
      (file) =>
        isRecord(file) &&
        isRelativePath(file.path) &&
        typeof file.content === 'string' &&
        /\.(tsx?|mts|cts)$/u.test(file.path) &&
        isInventorySourcePath(file.path) &&
        !excludedSourcePath(file.path),
    )
    .sort((left, right) => left.path.localeCompare(right.path));
  const filesByPath = new Map(sourceFiles.map((file) => [file.path, file]));
  const parsed = new Map(
    sourceFiles.map((file) => [file.path, parseSourceFile(file)]),
  );
  const unresolved = [];
  const cache = new Map();
  const unresolvedKeys = new Set();

  const addUnresolved = (entry) => {
    const key = `${entry.source}|${entry.export}|${entry.reason}`;
    if (!unresolvedKeys.has(key)) {
      unresolvedKeys.add(key);
      unresolved.push({
        source: entry.source,
        export: entry.export,
        code: FAILURE_CODES.SOURCE_UNRESOLVED,
        reason: entry.reason,
      });
    }
  };

  const discoveredEntries = sourceFiles.flatMap((file) =>
    visitSourceFile({
      filePath: file.path,
      cache,
      parsed,
      filesByPath,
      addUnresolved,
    }),
  );
  const exports = uniqueEntries(discoveredEntries);
  return {
    exports: exports.map(({ source, export: exportName, kind }) => ({
      source,
      export: exportName,
      kind,
    })),
    provenance: exports.map(({ source, export: exportName, provenance }) => ({
      source,
      export: exportName,
      kind: provenance ?? 'direct',
    })),
    unresolved,
  };
}

export function validateSourceClaims(manifest, discovery) {
  const manifestResult = validateManifest(manifest);
  if (!manifestResult.ok) return manifestResult;
  const errors = [];
  if (manifest.records.length === 0) {
    errors.push(
      error(
        FAILURE_CODES.EVIDENCE_MISSING,
        'source inventory must contain at least one reviewed claim',
      ),
    );
  }
  for (const unresolved of discovery.unresolved) {
    errors.push(
      error(
        FAILURE_CODES.SOURCE_UNRESOLVED,
        `${unresolved.source}#${unresolved.export}: ${unresolved.reason}`,
        unresolved.source,
      ),
    );
  }
  const discovered = new Set(
    discovery.exports.map((entry) => `${entry.source}|${entry.export}`),
  );
  const claims = new Set();
  for (const [index, record] of manifest.records.entries()) {
    const key = `${record.source}|${record.export}`;
    if (claims.has(key)) {
      errors.push(
        error(
          FAILURE_CODES.CLAIM_DUPLICATE,
          `duplicate canonical claim ${record.source}#${record.export}`,
          `records[${index}]`,
        ),
      );
    }
    claims.add(key);
    if (!discovered.has(key)) {
      errors.push(
        error(
          FAILURE_CODES.SOURCE_UNRESOLVED,
          `canonical source/export was not discovered: ${record.source}#${record.export}`,
          record.source,
        ),
      );
    }
  }
  for (const discoveredExport of discovery.exports) {
    const key = `${discoveredExport.source}|${discoveredExport.export}`;
    if (!claims.has(key)) {
      errors.push(
        error(
          FAILURE_CODES.EVIDENCE_MISSING,
          `discovered export has no reviewed claim: ${discoveredExport.source}#${discoveredExport.export}`,
          discoveredExport.source,
        ),
      );
    }
  }
  return result(errors);
}

const recordReferenceErrors = (record, recordPath, entriesById) => {
  if (!isRenderable(record.classification)) return [];
  const errors = [];
  const docsEntry = entriesById.get(record.docsOwnerId);
  if (docsEntry?.type !== 'docs') {
    errors.push(
      error(
        FAILURE_CODES.REFERENCE_MISSING,
        `docsOwnerId does not resolve to a generated docs entry: ${record.docsOwnerId}`,
        recordPath,
      ),
    );
  }
  for (const state of record.states) {
    if (state.applicability !== 'required') continue;
    const storyEntry = entriesById.get(state.storyId);
    if (storyEntry?.type !== 'story') {
      errors.push(
        error(
          FAILURE_CODES.REFERENCE_MISSING,
          `required storyId does not resolve to a generated story entry: ${state.storyId}`,
          recordPath,
        ),
      );
    }
  }
  return errors;
};

export function validateReferences(manifest, index) {
  const manifestResult = validateManifest(manifest);
  if (!manifestResult.ok) return manifestResult;

  const errors = [];
  const entries = isRecord(index?.entries) ? Object.values(index.entries) : [];
  const entriesById = new Map(
    entries
      .filter((entry) => isRecord(entry) && nonEmptyString(entry.id))
      .map((entry) => [entry.id, entry]),
  );

  if (entriesById.size === 0) {
    errors.push(
      error(
        FAILURE_CODES.REFERENCE_MISSING,
        'generated Storybook index contains no entries',
      ),
    );
    return result(errors);
  }

  for (const [indexValue, record] of manifest.records.entries()) {
    errors.push(
      ...recordReferenceErrors(record, `records[${indexValue}]`, entriesById),
    );
  }
  return result(errors);
}

const isStorySourcePath = (filePath) =>
  isInventorySourcePath(filePath) &&
  /\.(stories|story)\.(tsx?|jsx?)$/u.test(filePath);

const textForInput = (content) =>
  typeof content === 'string'
    ? content
    : Buffer.from(bytesForInput(content)).toString('utf8');

const identifierText = (node) =>
  node && ts.isIdentifier(node) ? node.text : undefined;

const findNamedStoryDeclaration = (sourceFile, exportName) => {
  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement) && exported(statement)) {
      const declaration = statement.declarationList.declarations.find(
        (candidate) => identifierText(candidate.name) === exportName,
      );
      if (declaration) return declaration;
    }
    if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement)) &&
      exported(statement) &&
      identifierText(statement.name) === exportName
    ) {
      return statement;
    }
  }
  return undefined;
};

const propertyNameText = (name) => {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  return undefined;
};

const unwrapExpression = (expression) => {
  let current = expression;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isSatisfiesExpression(current)
  ) {
    current = current.expression;
  }
  return current;
};

// CSF Factories declare a story as `meta.story({ ... })`; the story config is
// the call's first argument.
const FACTORY_STORY_METHOD = 'story';

const storyConfigObject = (storyDeclaration) => {
  const initializer =
    ts.isVariableDeclaration(storyDeclaration) && storyDeclaration.initializer
      ? unwrapExpression(storyDeclaration.initializer)
      : undefined;
  if (!initializer) return undefined;
  if (ts.isObjectLiteralExpression(initializer)) return initializer;
  if (
    !ts.isCallExpression(initializer) ||
    !ts.isPropertyAccessExpression(initializer.expression) ||
    initializer.expression.name.text !== FACTORY_STORY_METHOD
  ) {
    return undefined;
  }
  const config = initializer.arguments[0]
    ? unwrapExpression(initializer.arguments[0])
    : undefined;
  return config && ts.isObjectLiteralExpression(config) ? config : undefined;
};

const findPlayProperty = (storyDeclaration) => {
  const initializer = storyConfigObject(storyDeclaration);
  if (!initializer) return undefined;
  return initializer.properties.find((property) => {
    if (
      !ts.isPropertyAssignment(property) &&
      !ts.isMethodDeclaration(property)
    ) {
      return false;
    }
    return propertyNameText(property.name) === 'play';
  });
};

const playBody = (playProperty) => {
  if (ts.isPropertyAssignment(playProperty)) {
    const initializer = unwrapExpression(playProperty.initializer);
    if (
      ts.isArrowFunction(initializer) ||
      ts.isFunctionExpression(initializer)
    ) {
      return initializer.body;
    }
    return undefined;
  }
  return ts.isMethodDeclaration(playProperty) ? playProperty.body : undefined;
};

const isAssertionCall = (expression) => {
  if (ts.isIdentifier(expression)) {
    return ['assert', 'assertThat', 'expect', 'storybookExpect'].includes(
      expression.text,
    );
  }
  return (
    ts.isPropertyAccessExpression(expression) &&
    ['assert', 'assertThat', 'expect'].includes(expression.name.text)
  );
};

const containsStringLiteral = (node, expected) => {
  let found = false;
  const visit = (candidate) => {
    if (found) return;
    if (ts.isStringLiteral(candidate) && candidate.text === expected) {
      found = true;
      return;
    }
    ts.forEachChild(candidate, visit);
  };
  visit(node);
  return found;
};

// True when a callee is `expect(...)` itself or a matcher chained from it, such
// as `expect(x).not.toHaveAttribute`.
const isAssertionChain = (callee) => {
  if (isAssertionCall(callee)) return true;
  let current = callee;
  while (current) {
    if (ts.isCallExpression(current)) {
      if (isAssertionCall(current.expression)) return true;
      current = current.expression;
    } else if (ts.isPropertyAccessExpression(current)) {
      current = current.expression;
    } else if (ts.isAwaitExpression(current)) {
      current = current.expression;
    } else if (ts.isParenthesizedExpression(current)) {
      current = current.expression;
    } else {
      return false;
    }
  }
  return false;
};

// The marker must appear inside an assertion call's arguments or a chained
// matcher's arguments, including a nested locator such as
// `expect(canvas.getByText('marker'))`. A literal outside any assertion does not
// count.
const hasAssertionMarker = (node, expected) => {
  let found = false;
  const visit = (candidate) => {
    if (found) return;
    if (
      ts.isCallExpression(candidate) &&
      isAssertionChain(candidate.expression) &&
      candidate.arguments.some((argument) =>
        containsStringLiteral(argument, expected),
      )
    ) {
      found = true;
      return;
    }
    ts.forEachChild(candidate, visit);
  };
  visit(node);
  return found;
};

const sourceDigest = (content) =>
  `sha256:${createHash('sha256').update(bytesForInput(content)).digest('hex')}`;

const storyEvidenceError = (message, pathValue) =>
  error(FAILURE_CODES.EVIDENCE_MISSING, message, pathValue);

const storyAssertionErrors = ({ state, storyFile, statePath }) => {
  const storySource = ts.createSourceFile(
    state.storyFile,
    textForInput(storyFile.content),
    ts.ScriptTarget.Latest,
    true,
    state.storyFile.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const storyDeclaration = findNamedStoryDeclaration(
    storySource,
    state.storyExport,
  );
  if (!storyDeclaration) {
    return [
      storyEvidenceError(
        `named story export could not be resolved: ${state.storyExport}`,
        statePath,
      ),
    ];
  }
  if (state.assertionExport !== `${state.storyExport}.play`) {
    return [
      storyEvidenceError(
        `assertionExport must be ${state.storyExport}.play`,
        statePath,
      ),
    ];
  }
  const playProperty = findPlayProperty(storyDeclaration);
  if (!playProperty) {
    return [
      storyEvidenceError(
        `story export has no play property: ${state.storyExport}`,
        statePath,
      ),
    ];
  }
  if (!hasAssertionMarker(playBody(playProperty), state.assertionMarker)) {
    return [
      storyEvidenceError(
        `assertionMarker is not an exact string literal in ${state.storyExport}.play`,
        statePath,
      ),
    ];
  }
  return [];
};

const requiredStateErrors = ({ state, recordPath, filesByPath }) => {
  const statePath = `${recordPath}.states`;
  const errors = [];
  if (state.storyFile !== state.assertionFile) {
    errors.push(
      storyEvidenceError(
        'storyFile and assertionFile must identify the same story source',
        statePath,
      ),
    );
  }
  if (
    !isStorySourcePath(state.storyFile) ||
    !isRelativePath(state.storyFile) ||
    !filesByPath.has(state.storyFile)
  ) {
    errors.push(
      storyEvidenceError(
        `story source could not be resolved: ${state.storyFile}`,
        statePath,
      ),
    );
    return errors;
  }
  errors.push(
    ...storyAssertionErrors({
      state,
      storyFile: filesByPath.get(state.storyFile),
      statePath,
    }),
  );
  return errors;
};

const recordEvidenceErrors = ({
  record,
  recordPath,
  filesByPath,
  discovery,
}) => {
  const sourceFile = filesByPath.get(record.source);
  if (
    !isInventorySourcePath(record.source) ||
    !sourceFile ||
    !isRelativePath(record.source)
  ) {
    return [
      error(
        FAILURE_CODES.SOURCE_UNRESOLVED,
        `source file could not be resolved: ${record.source}`,
        recordPath,
      ),
    ];
  }

  const errors = [];
  const discovered = discovery.exports.some(
    (entry) => entry.source === record.source && entry.export === record.export,
  );
  if (!discovered) {
    errors.push(
      error(
        FAILURE_CODES.SOURCE_UNRESOLVED,
        `named source export could not be resolved: ${record.source}#${record.export}`,
        recordPath,
      ),
    );
  }
  if (record.review.reviewedSourceDigest !== sourceDigest(sourceFile.content)) {
    errors.push(
      storyEvidenceError(
        `reviewed source digest is stale for ${record.source}`,
        recordPath,
      ),
    );
  }

  if (!isRenderable(record.classification)) return errors;
  for (const state of record.states) {
    if (state.applicability !== 'required') continue;
    errors.push(...requiredStateErrors({ state, recordPath, filesByPath }));
  }
  return errors;
};

// A forwarding wrapper is covered by its target's story only while it adds no
// behavior of its own. Each entry maps a wrapper source to the module it must
// forward to, so a wrapper that gains behavior invalidates the exemption.
const FORWARDING_WRAPPER_TARGETS = new Map([
  ['ClientApp/src/routes/ta/manage/index.tsx', './appDetails'],
]);

const forwardingRejection = (source, reason) =>
  error(
    FAILURE_CODES.EVIDENCE_MISSING,
    `forwarding equivalence rejected for ${source}: ${reason}; re-review consumer sufficiency before keeping the forwarding exemption`,
    source,
  );

const forwardingImportName = (statement, targetModule) => {
  const clause = statement.importClause;
  if (
    clause?.name === undefined ||
    clause.isTypeOnly ||
    clause.namedBindings !== undefined ||
    moduleSpecifierText(statement) !== targetModule
  ) {
    return undefined;
  }
  return clause.name.text;
};

const declaredFunction = (statement) => {
  if (ts.isFunctionDeclaration(statement) && statement.name) {
    return { name: statement.name.text, fn: statement };
  }
  if (!ts.isVariableStatement(statement)) return undefined;
  const declarations = statement.declarationList.declarations;
  const [declaration] = declarations;
  const initializer = declaration?.initializer;
  if (
    declarations.length !== 1 ||
    !ts.isIdentifier(declaration.name) ||
    !initializer ||
    !(ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))
  ) {
    return undefined;
  }
  return { name: declaration.name.text, fn: initializer };
};

const isDefaultExportedFunction = (statement) =>
  ts.isFunctionDeclaration(statement) &&
  Boolean(
    statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword,
    ),
  );

const isDefaultExportOf = (statement, name) =>
  ts.isExportAssignment(statement) &&
  !statement.isExportEquals &&
  ts.isIdentifier(statement.expression) &&
  statement.expression.text === name;

const forwardingComponent = (statements) => {
  const [first, second, ...rest] = statements;
  if (!first || rest.length > 0) return undefined;
  if (isDefaultExportedFunction(first)) return second ? undefined : first;
  const declared = declaredFunction(first);
  if (!declared || !second || !isDefaultExportOf(second, declared.name)) {
    return undefined;
  }
  return declared.fn;
};

const returnedExpression = (fn) => {
  if (!fn.body) return undefined;
  if (!ts.isBlock(fn.body)) return fn.body;
  const [only] = fn.body.statements;
  return fn.body.statements.length === 1 && ts.isReturnStatement(only)
    ? only.expression
    : undefined;
};

const isConditionNode = (node) =>
  ts.isIfStatement(node) ||
  ts.isConditionalExpression(node) ||
  ts.isSwitchStatement(node) ||
  (ts.isBinaryExpression(node) &&
    [
      ts.SyntaxKind.AmpersandAmpersandToken,
      ts.SyntaxKind.BarBarToken,
      ts.SyntaxKind.QuestionQuestionToken,
    ].includes(node.operatorToken.kind));

const isAssignmentNode = (node) =>
  ts.isBinaryExpression(node) &&
  node.operatorToken.kind === ts.SyntaxKind.EqualsToken;

const isCallNode = (node) =>
  ts.isCallExpression(node) ||
  ts.isNewExpression(node) ||
  ts.isTaggedTemplateExpression(node);

const forwardingBehaviorReason = (node) => {
  if (isAssignmentNode(node)) return 'wrapper must not perform side effects';
  if (isCallNode(node)) return 'wrapper must not call hooks or functions';
  if (isConditionNode(node)) return 'wrapper must not branch on conditions';
  return ts.forEachChild(node, forwardingBehaviorReason);
};

const hasOnlyWhitespaceChildren = (element) =>
  element.children.every(
    (child) => ts.isJsxText(child) && child.containsOnlyTriviaWhiteSpaces,
  );

const openingElementOf = (element) => {
  if (element && ts.isJsxSelfClosingElement(element)) return element;
  if (element && ts.isJsxElement(element)) return element.openingElement;
  return undefined;
};

const forwardingElementReason = (expression, tagName) => {
  const element = expression ? unwrapExpression(expression) : undefined;
  if (element && ts.isJsxFragment(element)) {
    return 'wrapper must not render a fragment';
  }
  const opening = openingElementOf(element);
  if (!opening) return 'wrapper must return a single forwarding element';
  if (!ts.isIdentifier(opening.tagName) || opening.tagName.text !== tagName) {
    return `wrapper must render only <${tagName} />`;
  }
  if (
    opening.typeArguments !== undefined ||
    opening.attributes.properties.length > 0
  ) {
    return 'wrapper must not pass props';
  }
  return ts.isJsxElement(element) && !hasOnlyWhitespaceChildren(element)
    ? 'wrapper must not render children'
    : undefined;
};

const isPlainFunction = (fn) =>
  fn.parameters.length === 0 &&
  !fn.asteriskToken &&
  !fn.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword,
  );

const forwardingComponentReason = (component, tagName) => {
  if (!isPlainFunction(component)) {
    return 'wrapper component must be synchronous and take no parameters';
  }
  return (
    forwardingBehaviorReason(component) ??
    forwardingElementReason(returnedExpression(component), tagName)
  );
};

const forwardingWrapperReason = (sourceFile, targetModule) => {
  const imports = sourceFile.statements.filter(ts.isImportDeclaration);
  const others = sourceFile.statements.filter(
    (statement) => !ts.isImportDeclaration(statement),
  );
  const tagName =
    imports.length === 1
      ? forwardingImportName(imports[0], targetModule)
      : undefined;
  if (!tagName) {
    return `wrapper must only default-import its forwarding target ${targetModule}`;
  }
  const component = forwardingComponent(others);
  if (!component) {
    return 'wrapper must only declare one component exported as default';
  }
  return forwardingComponentReason(component, tagName);
};

const hasSyntaxErrors = (source, text) =>
  (
    ts.transpileModule(text, {
      fileName: source,
      reportDiagnostics: true,
      compilerOptions: {
        jsx: ts.JsxEmit.Preserve,
        target: ts.ScriptTarget.Latest,
      },
    }).diagnostics ?? []
  ).length > 0;

export function validateForwardingEquivalence({ source, content }) {
  const targetModule = FORWARDING_WRAPPER_TARGETS.get(source);
  if (targetModule === undefined) {
    return result([
      forwardingRejection(source, 'no forwarding target is declared'),
    ]);
  }
  const text = textForInput(content);
  if (hasSyntaxErrors(source, text)) {
    return result([
      forwardingRejection(source, 'wrapper source has syntax errors'),
    ]);
  }
  const sourceFile = ts.createSourceFile(
    source,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const reason = forwardingWrapperReason(sourceFile, targetModule);
  return result(reason ? [forwardingRejection(source, reason)] : []);
}

const ROUTE_SOURCE_PREFIX = 'ClientApp/src/routes/';

const forwardingWrapperErrors = (filesByPath) =>
  [...FORWARDING_WRAPPER_TARGETS.keys()].flatMap((wrapperPath) => {
    const wrapper = filesByPath.get(wrapperPath);
    if (wrapper) {
      return validateForwardingEquivalence({
        source: wrapperPath,
        content: wrapper.content,
      }).errors;
    }
    // Inputs with no route files are not the app tree. Once any route file is
    // present, a missing wrapper means it moved and the guard must not lapse.
    const hasRouteFiles = [...filesByPath.keys()].some((filePath) =>
      filePath.startsWith(ROUTE_SOURCE_PREFIX),
    );
    return hasRouteFiles
      ? [forwardingRejection(wrapperPath, 'wrapper source is missing')]
      : [];
  });

export function validateStoryEvidence({ manifest, files, index }) {
  const manifestResult = validateManifest(manifest);
  if (!manifestResult.ok) return manifestResult;

  if (!Array.isArray(files)) {
    return result([
      error(
        FAILURE_CODES.SOURCE_UNRESOLVED,
        'story evidence requires an input file list',
      ),
    ]);
  }

  const sourceFiles = files.map((file) => ({
    ...file,
    content: textForInput(file.content),
  }));
  const filesByPath = new Map(sourceFiles.map((file) => [file.path, file]));
  const discovery = discoverSourceExports({ files: sourceFiles });
  const errors = [];
  const sourceClaims = validateSourceClaims(manifest, discovery);
  if (!sourceClaims.ok) errors.push(...sourceClaims.errors);

  for (const [indexValue, record] of manifest.records.entries()) {
    errors.push(
      ...recordEvidenceErrors({
        record,
        recordPath: `records[${indexValue}]`,
        filesByPath,
        discovery,
      }),
    );
  }

  errors.push(...forwardingWrapperErrors(filesByPath));

  if (index !== undefined) {
    const referenceResult = validateReferences(manifest, index);
    if (!referenceResult.ok) errors.push(...referenceResult.errors);
  }
  return result(errors);
}

export function deriveExecutableStorySet({ index, requiredStoryIds = [] }) {
  const entries = isRecord(index?.entries) ? Object.values(index.entries) : [];
  const required = new Set(requiredStoryIds);
  const storyIds = [];
  const skipped = [];

  for (const entry of entries
    .filter((candidate) => isRecord(candidate) && candidate.type === 'story')
    .toSorted((left, right) => left.id.localeCompare(right.id))) {
    const tags = Array.isArray(entry.tags) ? entry.tags : [];
    const isSkipped =
      tags.includes('skip-test') ||
      tags.includes('test-disabled') ||
      entry.parameters?.storybookTest?.disable === true;
    if (isSkipped) {
      skipped.push(entry.id);
    } else {
      storyIds.push(entry.id);
    }
  }

  for (const requiredStoryId of required) {
    if (
      !storyIds.includes(requiredStoryId) &&
      !skipped.includes(requiredStoryId)
    ) {
      storyIds.push(requiredStoryId);
    }
  }

  return { storyIds, skipped };
}

const closureReferenceErrors = (manifest, fullIndex, docsIndex) => {
  const errors = [];
  for (const [label, index] of [
    ['full', fullIndex],
    ['docs', docsIndex],
  ]) {
    const referenceResult = validateReferences(manifest, index);
    if (!referenceResult.ok) {
      errors.push(
        ...referenceResult.errors.map((entry) => ({
          ...entry,
          message: `${label} index: ${entry.message}`,
        })),
      );
    }
  }
  return errors;
};

const closureIdentityErrors = (freeze, producer) => {
  const errors = [];
  if (!isRecord(freeze) || !nonEmptyString(freeze.freezeId)) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'closure freeze identity is required',
      ),
    );
  }
  if (!isRecord(producer) || !nonEmptyString(producer.producerId)) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'closure producer identity is required',
      ),
    );
  }
  return errors;
};

const closureDigestErrors = (freeze, fullIndex, docsIndex) => {
  const errors = [];
  for (const [label, index, digest] of [
    ['full', fullIndex, freeze?.fullIndexDigest],
    ['docs', docsIndex, freeze?.docsIndexDigest],
  ]) {
    if (digest !== computeIndexDigest(index)) {
      errors.push(
        error(
          FAILURE_CODES.INPUT_STALE,
          `${label} Storybook index does not match the frozen digest`,
        ),
      );
    }
  }
  return errors;
};

const receiptIdentityMatches = (receipt, freeze, producer) =>
  receipt.freezeId === freeze?.freezeId &&
  receipt.producerId === producer?.producerId &&
  receipt.inputDigest === freeze?.inputDigest &&
  receipt.producerIdentityDigest === producer?.producerIdentityDigest;

const passedStoryIds = (statuses) =>
  new Set(
    statuses
      .filter((entry) => entry?.status === SUCCESS_STATUS)
      .map((entry) => entry.storyId),
  );

const receiptResultsAreIncomplete = ({
  requested,
  executedValues,
  componentPassed,
  a11yPassed,
}) => {
  const executedStoryIds = new Set(executedValues);
  return (
    requested.size === 0 ||
    executedStoryIds.size !== executedValues.length ||
    executedStoryIds.size !== requested.size ||
    [...requested].some((storyId) => !executedStoryIds.has(storyId)) ||
    [...executedStoryIds].some((storyId) => !requested.has(storyId)) ||
    requested.size !== componentPassed.size ||
    requested.size !== a11yPassed.size ||
    [...requested].some(
      (storyId) => !componentPassed.has(storyId) || !a11yPassed.has(storyId),
    )
  );
};

const validateClosureReceipt = ({
  receipt,
  freeze,
  producer,
  executable,
  errors,
}) => {
  if (!isRecord(receipt) || receipt.verdict !== 'passed') {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'closure receipt is not a passing receipt',
      ),
    );
    return new Set();
  }
  if (!receiptIdentityMatches(receipt, freeze, producer)) {
    errors.push(
      error(
        FAILURE_CODES.INPUT_STALE,
        'closure receipt does not match the frozen producer identity',
      ),
    );
  }
  const requestedValues = Array.isArray(receipt.requestedStoryIds)
    ? receipt.requestedStoryIds
    : [];
  const requested = new Set(requestedValues);
  if (
    requested.size !== requestedValues.length ||
    [...requested].some(
      (storyId) =>
        !nonEmptyString(storyId) || !executable.storyIds.includes(storyId),
    )
  ) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'closure receipt requests duplicate, invalid, or non-executable stories',
      ),
    );
  }
  const componentStatuses = statusEntries(
    receipt.componentTestStatuses,
    'component test statuses',
    requested,
    errors,
  );
  const a11yStatuses = statusEntries(
    receipt.a11yStatuses,
    'a11y statuses',
    requested,
    errors,
  );
  const incomplete = receiptResultsAreIncomplete({
    requested,
    executedValues: Array.isArray(receipt.executedStoryIds)
      ? receipt.executedStoryIds
      : [],
    componentPassed: passedStoryIds(componentStatuses),
    a11yPassed: passedStoryIds(a11yStatuses),
  });
  if (incomplete) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'closure receipt is missing exact component or a11y story results',
      ),
    );
  }
  return requested;
};

const closureCoverageErrors = ({ requiredSet, executable, executed }) => {
  const errors = [];
  for (const storyId of requiredSet) {
    if (!executed.has(storyId)) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `required story has no passing receipt: ${storyId}`,
        ),
      );
    }
  }
  const executableSet = new Set(executable.storyIds);
  for (const storyId of executableSet) {
    if (!executed.has(storyId)) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `executable story has no passing receipt: ${storyId}`,
        ),
      );
    }
  }
  for (const storyId of executed) {
    if (!executableSet.has(storyId)) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `receipt covers a story outside the executable set: ${storyId}`,
        ),
      );
    }
  }
  return errors;
};

export function validateClosure({
  manifest,
  fullIndex,
  docsIndex,
  receipts,
  freeze,
  producer,
}) {
  const errors = [];
  const manifestResult = validateManifest(manifest);
  if (!manifestResult.ok) errors.push(...manifestResult.errors);
  errors.push(
    ...closureReferenceErrors(manifest, fullIndex, docsIndex),
    ...closureIdentityErrors(freeze, producer),
    ...closureDigestErrors(freeze, fullIndex, docsIndex),
  );

  const requiredStoryIds = (manifest?.records ?? [])
    .filter((record) => isRecord(record) && isRenderable(record.classification))
    .flatMap((record) =>
      (record.states ?? [])
        .filter((state) => state.applicability === 'required')
        .map((state) => state.storyId),
    );
  const executable = deriveExecutableStorySet({
    index: fullIndex,
    requiredStoryIds,
  });
  const requiredSet = new Set(requiredStoryIds);
  for (const storyId of executable.skipped) {
    if (!requiredSet.has(storyId)) continue;
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        `required story is skipped: ${storyId}`,
      ),
    );
  }

  const executed = new Set();
  for (const receipt of Array.isArray(receipts) ? receipts : []) {
    const requested = validateClosureReceipt({
      receipt,
      freeze,
      producer,
      executable,
      errors,
    });
    for (const storyId of requested) executed.add(storyId);
  }
  errors.push(...closureCoverageErrors({ requiredSet, executable, executed }));

  return errors.length > 0
    ? result(errors)
    : {
        ok: true,
        errors: [],
        counts: {
          required: requiredSet.size,
          executed: executed.size,
          skipped: executable.skipped.length,
        },
      };
}

const inventoryRow = (record) => {
  const requiredStates = record.states.filter(
    (state) => state.applicability === 'required',
  );
  const storyIds = requiredStates
    .map((state) => state.storyId)
    .filter(nonEmptyString)
    .join(', ');
  return `| \`${record.source}#${record.export}\` | ${record.classification} | ${record.owner} | ${requiredStates.length} | ${storyIds || 'none'} |`;
};

const inventoryRegion = (records) => {
  const rows = records
    .toSorted((left, right) =>
      Buffer.compare(
        Buffer.from(`${left.source}#${left.export}`),
        Buffer.from(`${right.source}#${right.export}`),
      ),
    )
    .map(inventoryRow);
  return [
    '<!-- storybook-coverage:generated:start -->',
    '| Source/export | Classification | Owner | Required states | Story IDs |',
    '| --- | --- | --- | ---: | --- |',
    ...rows,
    '<!-- storybook-coverage:generated:end -->',
  ].join('\n');
};

/**
 * Render deterministic, reviewable inventory regions from validated claims.
 * This helper intentionally emits no timestamps, receipt IDs, or inferred claims.
 */
export function generateInventory({ manifest }) {
  const manifestResult = validateManifest(manifest);
  if (!manifestResult.ok) return manifestResult;
  if (manifest.records.length === 0) {
    return result([
      error(
        FAILURE_CODES.EVIDENCE_MISSING,
        'cannot generate inventory regions from an empty manifest',
      ),
    ]);
  }

  const components = manifest.records.filter((record) =>
    record.source.startsWith('ClientApp/src/components/'),
  );
  const routes = manifest.records.filter((record) =>
    record.source.startsWith('ClientApp/src/routes/'),
  );
  const renderableCount = manifest.records.filter((record) =>
    isRenderable(record.classification),
  ).length;
  const nonvisualCount = manifest.records.length - renderableCount;
  const matrix = [
    '<!-- storybook-coverage:generated:start -->',
    `Total records: ${manifest.records.length}`,
    `Renderable records: ${renderableCount}`,
    `Nonvisual records: ${nonvisualCount}`,
    `Component records: ${components.length}`,
    `Route records: ${routes.length}`,
    '<!-- storybook-coverage:generated:end -->',
  ].join('\n');

  return {
    ok: true,
    errors: [],
    regions: {
      components: inventoryRegion(components),
      routes: inventoryRegion(routes),
      matrix,
    },
  };
}

const GENERATED_REGION_MARKERS = [
  {
    start: '<!-- storybook-coverage:generated:start -->',
    end: '<!-- storybook-coverage:generated:end -->',
  },
  {
    start: '{/* storybook-coverage:generated:start */}',
    end: '{/* storybook-coverage:generated:end */}',
  },
];

const findGeneratedRegions = (content, markers) => {
  const regions = [];
  let cursor = 0;
  while (cursor < content.length) {
    const from = content.indexOf(markers.start, cursor);
    if (from === -1) break;
    const endIndex = content.indexOf(markers.end, from + markers.start.length);
    if (endIndex === -1) break;
    const to = endIndex + markers.end.length;
    regions.push({ from, to, markers });
    cursor = to;
  }
  return regions;
};

const replaceGeneratedRegion = (filePath, generatedRegion) => {
  const content = ts.sys.readFile(filePath);
  if (content === undefined) {
    throw new Error(`inventory document could not be read: ${filePath}`);
  }
  const regions = GENERATED_REGION_MARKERS.flatMap((markers) =>
    findGeneratedRegions(content, markers),
  );
  if (regions.length !== 1) {
    throw new Error(
      `inventory document must contain exactly one generated region: ${filePath}`,
    );
  }
  const [{ from, to, markers }] = regions;
  const replacement =
    markers === GENERATED_REGION_MARKERS[0]
      ? generatedRegion
      : generatedRegion
          .replace(
            GENERATED_REGION_MARKERS[0].start,
            GENERATED_REGION_MARKERS[1].start,
          )
          .replace(
            GENERATED_REGION_MARKERS[0].end,
            GENERATED_REGION_MARKERS[1].end,
          );
  ts.sys.writeFile(
    filePath,
    content.slice(0, from) + replacement + content.slice(to),
  );
};

export const writeInventoryRegions = ({ inventory, root = process.cwd() }) => {
  const files = {
    components: path.resolve(
      root,
      'ClientApp/src/components/ComponentInventory.docs.mdx',
    ),
    routes: path.resolve(root, 'ClientApp/src/routes/RouteInventory.docs.mdx'),
    matrix: path.resolve(
      root,
      'ClientApp/src/storybook/CoverageMatrix.docs.mdx',
    ),
  };
  for (const [filePath, generatedRegion] of [
    [files.components, inventory.regions.components],
    [files.routes, inventory.regions.routes],
    [files.matrix, inventory.regions.matrix],
  ]) {
    replaceGeneratedRegion(filePath, generatedRegion);
  }
};

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts'];

const isPathInside = (root, candidate) => {
  const relative = path.relative(root, candidate);
  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  );
};

export const readSourceFiles = (root, { includeStories = false } = {}) => {
  const sourceRoot = path.resolve(root);
  const realSourceRoot = ts.sys.realpath?.(sourceRoot) ?? sourceRoot;

  return ts.sys
    .readDirectory(sourceRoot, SOURCE_EXTENSIONS)
    .map((filePath) => ({
      filePath,
      relativePathValue: path
        .relative(sourceRoot, filePath)
        .replaceAll(path.sep, '/'),
    }))
    .filter(
      ({ relativePathValue }) =>
        isRelativePath(relativePathValue) &&
        isInventorySourcePath(relativePathValue) &&
        (includeStories || !excludedSourcePath(relativePathValue)),
    )
    .map(({ filePath, relativePathValue }) => {
      const realFilePath = ts.sys.realpath?.(filePath) ?? filePath;
      if (!isPathInside(realSourceRoot, realFilePath)) {
        throw new Error(
          `SOURCE_UNRESOLVED: symlink input ${relativePathValue}`,
        );
      }

      const content = ts.sys.readFile(filePath);
      if (content === undefined) {
        throw new Error(
          `SOURCE_UNRESOLVED: unreadable input ${relativePathValue}`,
        );
      }
      return { path: relativePathValue, content };
    });
};

const parseArguments = (argv) => {
  const args = {
    mode: undefined,
    manifest: undefined,
    sourceRoot: undefined,
    index: undefined,
    docsIndex: undefined,
    receipts: undefined,
    writeInventory: false,
  };
  const valueFlags = new Set([
    '--mode',
    '--manifest',
    '--source-root',
    '--index',
    '--docs-index',
    '--receipts',
  ]);

  const remaining = [...argv];
  while (remaining.length > 0) {
    const flag = remaining.shift();
    if (flag === '--write-inventory') {
      args.writeInventory = true;
      continue;
    }

    const value = remaining.shift();
    if (!valueFlags.has(flag) || !value) {
      return {
        ok: false,
        errors: [
          error(
            FAILURE_CODES.INVALID_INVOCATION,
            `invalid or incomplete option: ${flag ?? '(missing)'}`,
          ),
        ],
      };
    }

    switch (flag) {
      case '--mode':
        args.mode = value;
        break;
      case '--manifest':
        args.manifest = value;
        break;
      case '--source-root':
        args.sourceRoot = value;
        break;
      case '--index':
        args.index = value;
        break;
      case '--docs-index':
        args.docsIndex = value;
        break;
      case '--receipts':
        args.receipts = value;
        break;
      default:
        return {
          ok: false,
          errors: [
            error(
              FAILURE_CODES.INVALID_INVOCATION,
              `invalid or incomplete option: ${flag ?? '(missing)'}`,
            ),
          ],
        };
    }
  }
  if (!['source', 'references', 'closure'].includes(args.mode)) {
    return {
      ok: false,
      errors: [
        error(
          FAILURE_CODES.INVALID_INVOCATION,
          'mode must be source, references, or closure',
        ),
      ],
    };
  }
  if (args.writeInventory && args.mode !== 'references') {
    return {
      ok: false,
      errors: [
        error(
          FAILURE_CODES.INVALID_INVOCATION,
          '--write-inventory is permitted only with references mode',
        ),
      ],
    };
  }
  return { ok: true, args };
};

const failureResult = (errors, exitCode = 1) => ({ exitCode, errors });

const runReferencesMode = (args, manifest) => {
  if (!args.index) {
    return failureResult([
      error(
        FAILURE_CODES.REFERENCE_MISSING,
        'references mode requires --index',
      ),
    ]);
  }
  const indexContent = ts.sys.readFile(path.resolve(args.index));
  if (indexContent === undefined) {
    return failureResult([
      error(
        FAILURE_CODES.REFERENCE_MISSING,
        `generated Storybook index could not be read: ${args.index}`,
      ),
    ]);
  }
  try {
    const referenceResult = validateReferences(
      manifest,
      parseJsonDocument(indexContent),
    );
    if (!referenceResult.ok) return failureResult(referenceResult.errors);
    if (args.writeInventory) {
      const inventory = generateInventory({ manifest });
      if (!inventory.ok) return failureResult(inventory.errors);
      writeInventoryRegions({ inventory });
    }
    return failureResult([], 0);
  } catch (error_) {
    const message = error_ instanceof Error ? error_.message : String(error_);
    return failureResult([
      error(
        FAILURE_CODES.REFERENCE_MISSING,
        `generated Storybook index is invalid: ${message}`,
      ),
    ]);
  }
};

const readJsonFile = (filePath) => {
  const resolvedPath = path.resolve(filePath);
  const content = ts.sys.readFile(resolvedPath);
  if (content === undefined) {
    throw new Error(`closure evidence file could not be read: ${filePath}`);
  }
  return parseJsonDocument(content);
};

const readReceiptFiles = (directory) => {
  const receiptDirectory = path.resolve(directory);
  if (!ts.sys.directoryExists(receiptDirectory)) {
    throw new Error(`receipt directory does not exist: ${directory}`);
  }

  const normalizedReceiptDirectory = path.normalize(receiptDirectory);
  const realDirectory = path.normalize(
    ts.sys.realpath?.(receiptDirectory) ?? receiptDirectory,
  );
  return ts.sys
    .readDirectory(
      receiptDirectory,
      ['.json'],
      undefined,
      ['receipt-*.json'],
      1,
    )
    .filter(
      (filePath) =>
        path.dirname(path.normalize(filePath)) === normalizedReceiptDirectory,
    )
    .map((filePath) => {
      const realFilePath = path.normalize(
        ts.sys.realpath?.(filePath) ?? filePath,
      );
      if (path.dirname(realFilePath) !== realDirectory) {
        throw new Error(`receipt file escapes directory: ${filePath}`);
      }
      return filePath;
    })
    .toSorted((a, b) => a.localeCompare(b));
};

const runClosureMode = (args, manifest) => {
  if (!args.index || !args.docsIndex || !args.receipts) {
    return failureResult([
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'closure mode requires --index, --docs-index, and --receipts',
      ),
    ]);
  }
  try {
    const receiptDirectory = path.resolve(args.receipts);
    const receiptFiles = readReceiptFiles(receiptDirectory);
    const closureResult = validateClosure({
      manifest,
      fullIndex: readJsonFile(args.index),
      docsIndex: readJsonFile(args.docsIndex),
      receipts: receiptFiles.map(readJsonFile),
      freeze: readJsonFile(path.join(receiptDirectory, 'freeze.json')),
      producer: readJsonFile(path.join(receiptDirectory, 'producer.json')),
    });
    return closureResult.ok
      ? failureResult([], 0)
      : failureResult(closureResult.errors);
  } catch (error_) {
    const message = error_ instanceof Error ? error_.message : String(error_);
    return failureResult([
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        `closure inputs are invalid: ${message}`,
      ),
    ]);
  }
};

const runMode = (args, manifest) => {
  if (args.mode === 'source') return failureResult([], 0);
  if (args.mode === 'references') return runReferencesMode(args, manifest);
  return runClosureMode(args, manifest);
};

export function main(argv = process.argv.slice(2)) {
  const parsed = parseArguments(argv);
  if (!parsed.ok) return failureResult(parsed.errors, 2);
  const args = parsed.args;
  try {
    const manifestPath =
      args.manifest ?? 'ClientApp/src/storybook/coverageManifest.json';
    const sourceRoot = path.resolve(args.sourceRoot ?? process.cwd());
    const manifestContent = ts.sys.readFile(path.resolve(manifestPath));
    if (manifestContent === undefined) {
      throw new Error(`manifest could not be read: ${manifestPath}`);
    }
    const manifest = parseJsonDocument(manifestContent);
    const evidenceFiles = readSourceFiles(sourceRoot, {
      includeStories: true,
    });
    const sourceResult = validateStoryEvidence({
      manifest,
      files: evidenceFiles,
    });
    if (!sourceResult.ok) return failureResult(sourceResult.errors);
    return runMode(args, manifest);
  } catch (error_) {
    const message = error_ instanceof Error ? error_.message : String(error_);
    const code = /^([A-Z_]+):/u.exec(message)?.[1];
    const knownCode = Object.values(FAILURE_CODES).includes(code)
      ? code
      : FAILURE_CODES.INVALID_INVOCATION;
    const cleanMessage =
      knownCode !== FAILURE_CODES.INVALID_INVOCATION &&
      message.startsWith(`${knownCode}: `)
        ? message.slice(knownCode.length + 2)
        : message;
    return failureResult(
      [error(knownCode, cleanMessage)],
      knownCode === FAILURE_CODES.INVALID_INVOCATION ? 2 : 1,
    );
  }
}

const isEntrypoint =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isEntrypoint) {
  const cliResult = main();
  for (const cliError of cliResult.errors) {
    console.error(`${cliError.code}: ${cliError.message}`);
  }
  process.exitCode = cliResult.exitCode;
}
