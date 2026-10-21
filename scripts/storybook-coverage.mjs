import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { readdirSync, readFileSync } from 'node:fs';
import * as ts from 'typescript';

export const FAILURE_CODES = Object.freeze({
  CLAIM_DUPLICATE: 'CLAIM_DUPLICATE',
  EVIDENCE_MISSING: 'EVIDENCE_MISSING',
  EXECUTION_INCOMPLETE: 'EXECUTION_INCOMPLETE',
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
  while (/\s/u.test(text[next] ?? '')) next += 1;
  return next;
};

const parseJsonString = (text, start) => {
  let index = start + 1;
  let escaped = false;
  while (index < text.length) {
    const character = text[index];
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

const assertUniqueJsonKeys = (text) => {
  let index = 0;

  const parseValue = () => {
    index = skipJsonWhitespace(text, index);
    const character = text[index];
    if (character === '"') {
      const parsed = parseJsonString(text, index);
      index = parsed.next;
      return;
    }
    if (character === '{') {
      index += 1;
      index = skipJsonWhitespace(text, index);
      const keys = new Set();
      if (text[index] === '}') {
        index += 1;
        return;
      }
      while (index < text.length) {
        index = skipJsonWhitespace(text, index);
        if (text[index] !== '"')
          throw new Error('manifest JSON object key is invalid');
        const key = parseJsonString(text, index);
        index = skipJsonWhitespace(text, key.next);
        if (text[index] !== ':')
          throw new Error('manifest JSON object is missing a colon');
        if (keys.has(key.value)) {
          throw new Error(`duplicate manifest JSON key: ${key.value}`);
        }
        keys.add(key.value);
        index += 1;
        parseValue();
        index = skipJsonWhitespace(text, index);
        if (text[index] === '}') {
          index += 1;
          return;
        }
        if (text[index] !== ',')
          throw new Error('manifest JSON object is missing a comma');
        index += 1;
      }
      throw new Error('manifest JSON object is unterminated');
    }
    if (character === '[') {
      index += 1;
      index = skipJsonWhitespace(text, index);
      if (text[index] === ']') {
        index += 1;
        return;
      }
      while (index < text.length) {
        parseValue();
        index = skipJsonWhitespace(text, index);
        if (text[index] === ']') {
          index += 1;
          return;
        }
        if (text[index] !== ',')
          throw new Error('manifest JSON array is missing a comma');
        index += 1;
      }
      throw new Error('manifest JSON array is unterminated');
    }

    const literal =
      /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/u.exec(
        text.slice(index)
      );
    if (literal === null) throw new Error('manifest JSON value is invalid');
    index += literal[0].length;
  };

  parseValue();
  index = skipJsonWhitespace(text, index);
  if (index !== text.length)
    throw new Error('manifest JSON has trailing content');
};

const canonicaliseJson = (value, segments = []) => {
  if (Array.isArray(value)) {
    return value.map((entry, index) =>
      canonicaliseJson(entry, [...segments, index])
    );
  }
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .filter(
        (key) =>
          !(
            key === 'reviewedSourceDigest' &&
            segments.length === 3 &&
            segments[0] === 'records' &&
            Number.isInteger(segments[1]) &&
            segments[2] === 'review'
          )
      )
      .map((key) => [key, canonicaliseJson(value[key], [...segments, key])])
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
        JSON.stringify(canonicaliseJson(JSON.parse(manifestText))),
        'utf8'
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
      Buffer.from(right.filePath, 'utf8')
    )
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
      error(FAILURE_CODES.EXECUTION_INCOMPLETE, 'freezeId is required')
    );
  }
  if (freeze.inputDigest !== expectedInputDigest) {
    errors.push(
      error(FAILURE_CODES.EXECUTION_INCOMPLETE, 'freeze inputDigest is stale')
    );
  }
  if (!Array.isArray(selectedPaths) || selectedPaths.length === 0) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'selected input paths are required'
      )
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
      (selectedPath) => !protectedPathSet.has(selectedPath)
    ) ||
    [...protectedPathSet].some(
      (protectedPath) => !selectedPathSet.has(protectedPath)
    )
  ) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'freeze does not protect every selected path'
      )
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
    if (
      !denialProbes.some(
        (probe) => probe?.operation === operation && probe.denied === true
      )
    ) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `freeze denial probe did not reject ${operation}`
        )
      );
    }
  }
  if (freeze.restored !== false) {
    errors.push(
      error(FAILURE_CODES.EXECUTION_INCOMPLETE, 'freeze ACLs are not active')
    );
  }
  return result(errors);
}

const statusEntries = (value, label, requestedIds, errors) => {
  if (!Array.isArray(value)) {
    errors.push(
      error(FAILURE_CODES.EXECUTION_INCOMPLETE, `${label} must be an array`)
    );
    return [];
  }

  const seen = new Set();
  for (const entry of value) {
    if (!isRecord(entry) || !nonEmptyString(entry.storyId)) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `${label} contains a result without a storyId`
        )
      );
      continue;
    }

    if (seen.has(entry.storyId)) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `${label} contains a duplicate storyId: ${entry.storyId}`
        )
      );
    }
    seen.add(entry.storyId);

    if (!requestedIds.has(entry.storyId)) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `${label} contains an unknown storyId: ${entry.storyId}`
        )
      );
    }

    if (entry.status !== SUCCESS_STATUS) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `${label} did not pass for ${entry.storyId}`
        )
      );
    }
  }

  for (const storyId of requestedIds) {
    if (!seen.has(storyId)) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `${label} is missing the requested storyId: ${storyId}`
        )
      );
    }
  }

  return value;
};

const markdownSectionEntries = (markdown, heading) => {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const headingMatch = new RegExp(`^## ${escapedHeading}\\s*$`, 'm').exec(
    markdown
  );
  if (headingMatch === null) return [];

  const sectionStart = headingMatch.index + headingMatch[0].length;
  const nextHeading = /^## .+$/m.exec(markdown.slice(sectionStart));
  const section = markdown.slice(
    sectionStart,
    nextHeading === null ? markdown.length : sectionStart + nextHeading.index
  );
  return section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- ') || line.startsWith('### '))
    .map((line) => line.slice(line.startsWith('- ') ? 2 : 4).trim())
    .filter(Boolean);
};

const normalizeMarkdownMcpReport = (response, requestedIds, errors) => {
  const markdown = Array.isArray(response?.content)
    ? response.content
        .filter(
          (block) => block?.type === 'text' && typeof block.text === 'string'
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
        'MCP markdown response is missing Passing Stories'
      )
    );
  }
  const failingStoryIds = markdownSectionEntries(markdown, 'Failing Stories');
  const accessibilityViolationStoryIds = markdownSectionEntries(
    markdown,
    'Accessibility Violations'
  );
  const unhandledErrors = markdownSectionEntries(markdown, 'Unhandled Errors');
  if (failingStoryIds.length > 0) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'MCP markdown response contains failing stories'
      )
    );
  }
  if (accessibilityViolationStoryIds.length > 0) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'MCP markdown response contains accessibility violations'
      )
    );
  }
  if (unhandledErrors.length > 0) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'MCP markdown response contains unhandled errors'
      )
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
    errors
  );
  const a11yStatuses = statusEntries(
    statuses,
    'a11yStatuses',
    requestedIds,
    errors
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
        (heading) => markdownSectionEntries(markdown, heading).length === 0
      ),
    },
  };
};

const validChildEpoch = (value) =>
  isRecord(value) &&
  Number.isInteger(value.pid) &&
  value.pid > 0 &&
  nonEmptyString(value.createdAt);

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
  const errors = [];
  for (const [field, value] of [
    ['freezeId', freezeId],
    ['producerId', producerId],
    ['inputDigest', inputDigest],
    ['producerIdentityDigest', producerIdentityDigest],
  ]) {
    if (!nonEmptyString(value)) {
      errors.push(
        error(FAILURE_CODES.EXECUTION_INCOMPLETE, `receipt is missing ${field}`)
      );
    }
  }
  if (!validChildEpoch(childEpoch)) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'receipt is missing child provenance'
      )
    );
  }
  if (
    expectedInputDigest !== undefined &&
    inputDigest !== expectedInputDigest
  ) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'receipt inputDigest does not match the selected freeze'
      )
    );
  }
  if (
    expectedProducerIdentityDigest !== undefined &&
    producerIdentityDigest !== expectedProducerIdentityDigest
  ) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'receipt producerIdentityDigest does not match the selected producer'
      )
    );
  }
  if (!Array.isArray(requestedStoryIds) || requestedStoryIds.length === 0) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'at least one requested story ID is required'
      )
    );
  }

  const requestedIds = new Set(requestedStoryIds ?? []);
  if (requestedIds.size !== (requestedStoryIds ?? []).length) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'requested story IDs must be unique'
      )
    );
  }

  if (!isRecord(response) || response.isError === true || response.error) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'MCP response contains a protocol error'
      )
    );
  }

  const structuredContent = isRecord(response?.structuredContent)
    ? response.structuredContent
    : normalizeMarkdownMcpReport(response, requestedIds, errors);
  if (structuredContent?.status !== 'completed') {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        `MCP execution status was ${structuredContent?.status ?? 'missing'}`
      )
    );
  }

  const execution = isRecord(structuredContent?.result)
    ? structuredContent.result
    : undefined;
  if (execution === undefined) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'MCP response is missing the structured execution result'
      )
    );
  }

  const componentStatuses = statusEntries(
    execution?.componentTestStatuses,
    'componentTestStatuses',
    requestedIds,
    errors
  );
  const a11yStatuses = statusEntries(
    execution?.a11yStatuses,
    'a11yStatuses',
    requestedIds,
    errors
  );

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
        'MCP result counts do not match the requested story IDs'
      )
    );
  }

  if (!Array.isArray(execution?.unhandledErrors)) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'MCP result is missing unhandledErrors'
      )
    );
  } else if (execution.unhandledErrors.length > 0) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'MCP result contains unhandled errors'
      )
    );
  }

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
  const requiredProducerFields = [
    'producerId',
    'producerIdentityDigest',
    'checkout',
    'commit',
    'inputDigest',
    'freezeId',
    'mcpURL',
    'serverStartedAt',
    'cwd',
  ];

  if (!isRecord(producer) || !isRecord(receipt)) {
    return result([
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'producer and receipt records are required'
      ),
    ]);
  }

  for (const field of requiredProducerFields) {
    if (!nonEmptyString(producer[field])) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `producer is missing ${field}`
        )
      );
    }
  }
  if (!Number.isInteger(producer.serverPid) || producer.serverPid <= 0) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'producer serverPid must be a positive integer'
      )
    );
  }
  if (
    typeof expectedMcpURL !== 'string' ||
    producer.mcpURL !== expectedMcpURL
  ) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'producer native MCP URL does not match the selected endpoint'
      )
    );
  }
  if (producer.freezeId !== expectedFreezeId) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'producer freezeId does not match the selected freeze'
      )
    );
  }

  for (const field of [
    'producerId',
    'producerIdentityDigest',
    'inputDigest',
    'freezeId',
    'mcpURL',
  ]) {
    if (receipt[field] !== producer[field]) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `receipt ${field} does not match producer identity`
        )
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
        'expected and receipt child provenance are required'
      )
    );
  } else if (
    expectedChildEpoch.pid !== receipt.childEpoch.pid ||
    expectedChildEpoch.createdAt !== receipt.childEpoch.createdAt
  ) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'receipt child provenance does not match the producer epoch'
      )
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
        recordPath
      )
    );
    return;
  }

  if (!nonEmptyString(state.name) || !nonEmptyString(state.rationale)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'state name and rationale must be non-empty strings',
        recordPath
      )
    );
  }

  if (!['required', 'not-supported'].includes(state.applicability)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'state applicability must be required or not-supported',
        recordPath
      )
    );
    return;
  }

  const hasValidOutcome = nonEmptyString(state.outcome);
  if (!hasValidOutcome) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'state outcome must be a non-empty string',
        recordPath
      )
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
          recordPath
        )
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
        recordPath
      )
    );
  }
};

const validateRecordDetails = (record, recordPath, errors) => {
  if (!isRelativePath(record.source) || !nonEmptyString(record.export)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'record source and export must identify a relative canonical declaration',
        recordPath
      )
    );
  }
  if (!CLASSIFICATIONS.has(record.classification)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'record classification is not supported by schema v1',
        recordPath
      )
    );
  }
  if (!nonEmptyString(record.owner) || !nonEmptyString(record.reason)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'record owner and reason must be non-empty strings',
        recordPath
      )
    );
  }
  if (!Array.isArray(record.states)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'record states must be an array',
        recordPath
      )
    );
  }
};

const validateRecordReview = (record, recordPath, errors) => {
  if (!isRecord(record.review) || !sameKeys(record.review, REVIEW_KEYS)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'record review must contain exactly the schema v1 review fields',
        recordPath
      )
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
        recordPath
      )
    );
  }
};

const validateRenderableRecord = (record, recordPath, errors) => {
  if (!nonEmptyString(record.docsOwnerId)) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'renderable records need a docsOwnerId',
        recordPath
      )
    );
  }
  if (!Array.isArray(record.states)) return;

  for (const state of record.states) {
    validateState(state, recordPath, errors);
  }
  const requiredStates = record.states.filter(
    (state) => isRecord(state) && state.applicability === 'required'
  );
  if (requiredStates.every((state) => !isMeaningfulOutcome(state))) {
    errors.push(
      error(
        FAILURE_CODES.EVIDENCE_MISSING,
        'renderable records need a meaningful required baseline state',
        recordPath
      )
    );
  }
};

const validateNonvisualRecord = (record, recordPath, errors) => {
  if (record.docsOwnerId !== null) {
    errors.push(
      error(
        FAILURE_CODES.MANIFEST_SCHEMA_INVALID,
        'nonvisual records must have a null docsOwnerId',
        recordPath
      )
    );
  }
  if (!Array.isArray(record.states) || record.states.length !== 0) {
    errors.push(
      error(
        FAILURE_CODES.EVIDENCE_MISSING,
        'nonvisual records cannot carry UI states',
        recordPath
      )
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
        recordPath
      )
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
        'manifest must be an object with schemaVersion 1 and records'
      ),
    ]);
  }
  manifest.records.forEach((record, index) =>
    validateRecord(record, index, errors)
  );
  return result(errors);
}

const excludedSourcePath = (filePath) =>
  /(^|\/)(\.claude|\.git|stories?|tests?|__tests__|vendor|external|generated|node_modules|reports|storybook-static|dist)(\/|$)/u.test(
    filePath
  ) || /\.(stories|test|spec|d)\.(tsx?|jsx?)$/u.test(filePath);

const sourceFileKind = (node) =>
  ts.isFunctionDeclaration(node) ||
  ts.isClassDeclaration(node) ||
  ts.isVariableStatement(node)
    ? 'renderable'
    : 'nonvisual';

const exported = (node) =>
  node.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
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
  if (name) {
    const entry = {
      export: name,
      kind: sourceFileKind(statement),
    };
    locals.set(name, entry);
    if (exported(statement)) {
      direct.push({ source: filePath, ...entry });
    }
  }
  if (
    exported(statement) &&
    statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword
    )
  ) {
    direct.push({
      source: filePath,
      export: 'default',
      kind: sourceFileKind(statement),
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
      direct.push({ source: filePath, ...entry });
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
  direct
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
    file.path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
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
    path.posix.join(fromDirectory, specifier.replace(/\.jsx?$/u, ''))
  );
  const candidates = [
    requested,
    `${requested}.ts`,
    `${requested}.tsx`,
    `${requested}/index.ts`,
    `${requested}/index.tsx`,
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

const resolveLocalReExport = ({
  filePath,
  reExport,
  module,
  nextStack,
  cache,
  parsed,
  filesByPath,
  addUnresolved,
}) => {
  const local = module.locals.get(reExport.local);
  if (local) {
    return [
      {
        source: filePath,
        ...local,
        export: reExport.exported,
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
    });
  }

  addUnresolved({
    source: filePath,
    export: reExport.exported,
    reason: 'export declaration has no local source',
  });
  return [];
};

const resolveModuleReExport = ({
  filePath,
  reExport,
  nextStack,
  cache,
  parsed,
  filesByPath,
  addUnresolved,
}) => {
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
    (entry) => entry.export === reExport.imported
  );
  if (!target) {
    addUnresolved({
      source: filePath,
      export: reExport.exported,
      reason: 're-export target is unresolved',
    });
    return [];
  }
  return [{ ...target, export: target.export }];
};

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
        !excludedSourcePath(file.path)
    )
    .sort((left, right) => left.path.localeCompare(right.path));
  const filesByPath = new Map(sourceFiles.map((file) => [file.path, file]));
  const parsed = new Map(
    sourceFiles.map((file) => [file.path, parseSourceFile(file)])
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

  const exports = sourceFiles.flatMap((file) =>
    visitSourceFile({
      filePath: file.path,
      cache,
      parsed,
      filesByPath,
      addUnresolved,
    })
  );
  return { exports: uniqueEntries(exports), unresolved };
}

export function validateSourceClaims(manifest, discovery) {
  const manifestResult = validateManifest(manifest);
  if (!manifestResult.ok) return manifestResult;
  const errors = [];
  if (manifest.records.length === 0) {
    errors.push(
      error(
        FAILURE_CODES.EVIDENCE_MISSING,
        'source inventory must contain at least one reviewed claim'
      )
    );
  }
  for (const unresolved of discovery.unresolved) {
    errors.push(
      error(
        FAILURE_CODES.SOURCE_UNRESOLVED,
        `${unresolved.source}#${unresolved.export}: ${unresolved.reason}`,
        unresolved.source
      )
    );
  }
  const discovered = new Set(
    discovery.exports.map((entry) => `${entry.source}|${entry.export}`)
  );
  const claims = new Set();
  for (const [index, record] of manifest.records.entries()) {
    const key = `${record.source}|${record.export}`;
    if (claims.has(key)) {
      errors.push(
        error(
          FAILURE_CODES.CLAIM_DUPLICATE,
          `duplicate canonical claim ${record.source}#${record.export}`,
          `records[${index}]`
        )
      );
    }
    claims.add(key);
    if (!discovered.has(key)) {
      errors.push(
        error(
          FAILURE_CODES.SOURCE_UNRESOLVED,
          `canonical source/export was not discovered: ${record.source}#${record.export}`,
          record.source
        )
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
          discoveredExport.source
        )
      );
    }
  }
  return result(errors);
}

export function validateReferences(manifest, index) {
  const manifestResult = validateManifest(manifest);
  if (!manifestResult.ok) return manifestResult;

  const errors = [];
  const entries = isRecord(index?.entries) ? Object.values(index.entries) : [];
  const entriesById = new Map(
    entries
      .filter((entry) => isRecord(entry) && nonEmptyString(entry.id))
      .map((entry) => [entry.id, entry])
  );

  if (entriesById.size === 0) {
    errors.push(
      error(
        FAILURE_CODES.REFERENCE_MISSING,
        'generated Storybook index contains no entries'
      )
    );
    return result(errors);
  }

  for (const [indexValue, record] of manifest.records.entries()) {
    const recordPath = `records[${indexValue}]`;
    if (isRenderable(record.classification)) {
      const docsEntry = entriesById.get(record.docsOwnerId);
      if (docsEntry?.type !== 'docs') {
        errors.push(
          error(
            FAILURE_CODES.REFERENCE_MISSING,
            `docsOwnerId does not resolve to a generated docs entry: ${record.docsOwnerId}`,
            recordPath
          )
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
              recordPath
            )
          );
        }
      }
    }
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

const hasExportModifier = (node) =>
  node.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
  ) ?? false;

const identifierText = (node) =>
  node && ts.isIdentifier(node) ? node.text : undefined;

const findNamedStoryDeclaration = (sourceFile, exportName) => {
  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement) && hasExportModifier(statement)) {
      const declaration = statement.declarationList.declarations.find(
        (candidate) => identifierText(candidate.name) === exportName
      );
      if (declaration) return declaration;
    }
    if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement)) &&
      hasExportModifier(statement) &&
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

const findPlayProperty = (storyDeclaration) => {
  const initializer =
    ts.isVariableDeclaration(storyDeclaration) && storyDeclaration.initializer
      ? unwrapExpression(storyDeclaration.initializer)
      : undefined;
  if (!initializer || !ts.isObjectLiteralExpression(initializer)) {
    return undefined;
  }
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

const hasStringLiteral = (node, expected) => {
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

const sourceDigest = (content) =>
  `sha256:${createHash('sha256').update(bytesForInput(content)).digest('hex')}`;

const storyEvidenceError = (message, pathValue) =>
  error(FAILURE_CODES.EVIDENCE_MISSING, message, pathValue);

export function validateStoryEvidence({ manifest, files, index }) {
  const manifestResult = validateManifest(manifest);
  if (!manifestResult.ok) return manifestResult;

  if (!Array.isArray(files)) {
    return result([
      error(
        FAILURE_CODES.SOURCE_UNRESOLVED,
        'story evidence requires an input file list'
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
    const recordPath = `records[${indexValue}]`;
    const sourceFile = filesByPath.get(record.source);
    if (
      !isInventorySourcePath(record.source) ||
      !sourceFile ||
      !isRelativePath(record.source)
    ) {
      errors.push(
        error(
          FAILURE_CODES.SOURCE_UNRESOLVED,
          `source file could not be resolved: ${record.source}`,
          recordPath
        )
      );
      continue;
    }

    const discovered = discovery.exports.some(
      (entry) =>
        entry.source === record.source && entry.export === record.export
    );
    if (!discovered) {
      errors.push(
        error(
          FAILURE_CODES.SOURCE_UNRESOLVED,
          `named source export could not be resolved: ${record.source}#${record.export}`,
          recordPath
        )
      );
    }

    if (
      record.review.reviewedSourceDigest !== sourceDigest(sourceFile.content)
    ) {
      errors.push(
        storyEvidenceError(
          `reviewed source digest is stale for ${record.source}`,
          recordPath
        )
      );
    }

    if (!isRenderable(record.classification)) continue;
    for (const state of record.states) {
      if (state.applicability !== 'required') continue;
      const statePath = `${recordPath}.states`;
      if (state.storyFile !== state.assertionFile) {
        errors.push(
          storyEvidenceError(
            'storyFile and assertionFile must identify the same story source',
            statePath
          )
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
            statePath
          )
        );
        continue;
      }

      const storyFile = filesByPath.get(state.storyFile);
      const storySource = ts.createSourceFile(
        state.storyFile,
        textForInput(storyFile.content),
        ts.ScriptTarget.Latest,
        true,
        state.storyFile.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );
      const storyDeclaration = findNamedStoryDeclaration(
        storySource,
        state.storyExport
      );
      if (!storyDeclaration) {
        errors.push(
          storyEvidenceError(
            `named story export could not be resolved: ${state.storyExport}`,
            statePath
          )
        );
        continue;
      }

      if (state.assertionExport !== `${state.storyExport}.play`) {
        errors.push(
          storyEvidenceError(
            `assertionExport must be ${state.storyExport}.play`,
            statePath
          )
        );
        continue;
      }
      const playProperty = findPlayProperty(storyDeclaration);
      if (!playProperty) {
        errors.push(
          storyEvidenceError(
            `story export has no play property: ${state.storyExport}`,
            statePath
          )
        );
        continue;
      }
      if (!hasStringLiteral(playBody(playProperty), state.assertionMarker)) {
        errors.push(
          storyEvidenceError(
            `assertionMarker is not an exact string literal in ${state.storyExport}.play`,
            statePath
          )
        );
      }
    }
  }

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
        }))
      );
    }
  }

  if (!isRecord(freeze) || !nonEmptyString(freeze.freezeId)) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'closure freeze identity is required'
      )
    );
  }
  if (!isRecord(producer) || !nonEmptyString(producer.producerId)) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'closure producer identity is required'
      )
    );
  }

  for (const [label, index, digestKey] of [
    ['full', fullIndex, 'fullIndexDigest'],
    ['docs', docsIndex, 'docsIndexDigest'],
  ]) {
    if (freeze?.[digestKey] !== computeIndexDigest(index)) {
      errors.push(
        error(
          FAILURE_CODES.INPUT_STALE,
          `${label} Storybook index does not match the frozen digest`
        )
      );
    }
  }

  const requiredStoryIds = (manifest?.records ?? [])
    .filter((record) => isRecord(record) && isRenderable(record.classification))
    .flatMap((record) =>
      (record.states ?? [])
        .filter((state) => state.applicability === 'required')
        .map((state) => state.storyId)
    );
  const executable = deriveExecutableStorySet({
    index: fullIndex,
    requiredStoryIds,
  });
  const requiredSet = new Set(requiredStoryIds);
  const skippedRequired = executable.skipped.filter((storyId) =>
    requiredSet.has(storyId)
  );
  for (const storyId of skippedRequired) {
    errors.push(
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        `required story is skipped: ${storyId}`
      )
    );
  }

  const receiptList = Array.isArray(receipts) ? receipts : [];
  const executed = new Set();
  for (const receipt of receiptList) {
    if (!isRecord(receipt) || receipt.verdict !== 'passed') {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          'closure receipt is not a passing receipt'
        )
      );
      continue;
    }
    if (
      receipt.freezeId !== freeze?.freezeId ||
      receipt.producerId !== producer?.producerId ||
      receipt.inputDigest !== freeze?.inputDigest ||
      receipt.producerIdentityDigest !== producer?.producerIdentityDigest
    ) {
      errors.push(
        error(
          FAILURE_CODES.INPUT_STALE,
          'closure receipt does not match the frozen producer identity'
        )
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
          !nonEmptyString(storyId) || !executable.storyIds.includes(storyId)
      )
    ) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          'closure receipt requests duplicate, invalid, or non-executable stories'
        )
      );
    }
    const executedValues = Array.isArray(receipt.executedStoryIds)
      ? receipt.executedStoryIds
      : [];
    const executedStoryIds = new Set(executedValues);
    const componentStatuses = statusEntries(
      receipt.componentTestStatuses,
      'component test statuses',
      requested,
      errors
    );
    const a11yStatuses = statusEntries(
      receipt.a11yStatuses,
      'a11y statuses',
      requested,
      errors
    );
    const componentPassed = new Set(
      componentStatuses
        .filter((entry) => entry?.status === SUCCESS_STATUS)
        .map((entry) => entry.storyId)
    );
    const a11yPassed = new Set(
      a11yStatuses
        .filter((entry) => entry?.status === SUCCESS_STATUS)
        .map((entry) => entry.storyId)
    );
    if (
      requested.size === 0 ||
      executedStoryIds.size !== executedValues.length ||
      executedStoryIds.size !== requested.size ||
      [...requested].some((storyId) => !executedStoryIds.has(storyId)) ||
      [...executedStoryIds].some((storyId) => !requested.has(storyId)) ||
      requested.size !== componentPassed.size ||
      requested.size !== a11yPassed.size ||
      [...requested].some(
        (storyId) => !componentPassed.has(storyId) || !a11yPassed.has(storyId)
      )
    ) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          'closure receipt is missing exact component or a11y story results'
        )
      );
    }
    for (const storyId of requested) executed.add(storyId);
  }

  for (const storyId of requiredSet) {
    if (!executed.has(storyId)) {
      errors.push(
        error(
          FAILURE_CODES.EXECUTION_INCOMPLETE,
          `required story has no passing receipt: ${storyId}`
        )
      );
    }
  }

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
    (state) => state.applicability === 'required'
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
        Buffer.from(`${right.source}#${right.export}`)
      )
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
        'cannot generate inventory regions from an empty manifest'
      ),
    ]);
  }

  const components = manifest.records.filter((record) =>
    record.source.startsWith('ClientApp/src/components/')
  );
  const routes = manifest.records.filter((record) =>
    record.source.startsWith('ClientApp/src/routes/')
  );
  const renderableCount = manifest.records.filter((record) =>
    isRenderable(record.classification)
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

const replaceGeneratedRegion = (filePath, generatedRegion) => {
  const content = ts.sys.readFile(filePath);
  if (content === undefined) {
    throw new Error(`inventory document could not be read: ${filePath}`);
  }
  const markerPattern =
    /(?:<!-- storybook-coverage:generated:start -->|\{\/\* storybook-coverage:generated:start \*\/\})[\s\S]*?(?:<!-- storybook-coverage:generated:end -->|\{\/\* storybook-coverage:generated:end \*\/\})/gu;
  const matches = content.match(markerPattern) ?? [];
  if (matches.length !== 1) {
    throw new Error(
      `inventory document must contain exactly one generated region: ${filePath}`
    );
  }
  const usesJsxComments = matches[0].startsWith('{/*');
  const replacement = usesJsxComments
    ? generatedRegion
        .replace(
          '<!-- storybook-coverage:generated:start -->',
          '{/* storybook-coverage:generated:start */}'
        )
        .replace(
          '<!-- storybook-coverage:generated:end -->',
          '{/* storybook-coverage:generated:end */}'
        )
    : generatedRegion;
  ts.sys.writeFile(filePath, content.replace(markerPattern, replacement));
};

export const writeInventoryRegions = ({ inventory, root = process.cwd() }) => {
  const files = {
    components: path.resolve(
      root,
      'ClientApp/src/components/ComponentInventory.docs.mdx'
    ),
    routes: path.resolve(root, 'ClientApp/src/routes/RouteInventory.docs.mdx'),
    matrix: path.resolve(
      root,
      'ClientApp/src/storybook/CoverageMatrix.docs.mdx'
    ),
  };
  for (const [region, filePath] of Object.entries(files)) {
    replaceGeneratedRegion(filePath, inventory.regions[region]);
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
        (includeStories || !excludedSourcePath(relativePathValue))
    )
    .map(({ filePath, relativePathValue }) => {
      const realFilePath = ts.sys.realpath?.(filePath) ?? filePath;
      if (!isPathInside(realSourceRoot, realFilePath)) {
        throw new Error(
          `SOURCE_UNRESOLVED: symlink input ${relativePathValue}`
        );
      }

      const content = ts.sys.readFile(filePath);
      if (content === undefined) {
        throw new Error(
          `SOURCE_UNRESOLVED: unreadable input ${relativePathValue}`
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
            `invalid or incomplete option: ${flag ?? '(missing)'}`
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
              `invalid or incomplete option: ${flag ?? '(missing)'}`
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
          'mode must be source, references, or closure'
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
          '--write-inventory is permitted only with references mode'
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
        'references mode requires --index'
      ),
    ]);
  }
  const indexContent = ts.sys.readFile(path.resolve(args.index));
  if (indexContent === undefined) {
    return failureResult([
      error(
        FAILURE_CODES.REFERENCE_MISSING,
        `generated Storybook index could not be read: ${args.index}`
      ),
    ]);
  }
  try {
    const referenceResult = validateReferences(
      manifest,
      JSON.parse(indexContent)
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
        `generated Storybook index is invalid: ${message}`
      ),
    ]);
  }
};

const runClosureMode = (args, manifest) => {
  if (!args.index || !args.docsIndex || !args.receipts) {
    return failureResult([
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        'closure mode requires --index, --docs-index, and --receipts'
      ),
    ]);
  }
  try {
    const readJson = (filePath) => {
      const content = readFileSync(path.resolve(filePath), 'utf8');
      return JSON.parse(content);
    };
    const receiptDirectory = path.resolve(args.receipts);
    const receiptFiles = readdirSync(receiptDirectory)
      .filter((fileName) => /^receipt-.*\.json$/u.test(fileName))
      .toSorted();
    const closureResult = validateClosure({
      manifest,
      fullIndex: readJson(args.index),
      docsIndex: readJson(args.docsIndex),
      receipts: receiptFiles.map((fileName) =>
        readJson(path.join(receiptDirectory, fileName))
      ),
      freeze: readJson(path.join(receiptDirectory, 'freeze.json')),
      producer: readJson(path.join(receiptDirectory, 'producer.json')),
    });
    return closureResult.ok
      ? failureResult([], 0)
      : failureResult(closureResult.errors);
  } catch (error_) {
    const message = error_ instanceof Error ? error_.message : String(error_);
    return failureResult([
      error(
        FAILURE_CODES.EXECUTION_INCOMPLETE,
        `closure inputs are invalid: ${message}`
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
    const manifest = JSON.parse(manifestContent);
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
      knownCode === FAILURE_CODES.INVALID_INVOCATION ? 2 : 1
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
