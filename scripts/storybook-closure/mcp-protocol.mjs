import { parseJsonDocument } from '../storybook-coverage.mjs';

import { FAILURE_CODES, codedError, isRecord } from './contracts.mjs';

export const MCP_REQUEST_TIMEOUT_MS = 150_000;

// The configured MCP timeout bounds the whole receipt production. Every HTTP
// request gets at most what is left of it (capped per request), and none
// starts once it has expired.
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
const MCP_PROTOCOL_VERSION = '2025-03-26';
const SSE_DATA_FIELD = 'data:';

// One SSE event is a block of lines ended by a blank line; its `data:` lines
// are joined with newlines into a single payload. Comments, `event:` and
// `id:` lines and empty events (heartbeats) carry no payload.
export const parseSseEvents = (body) =>
  body
    .split(/\r?\n\r?\n/u)
    .map((block) =>
      block
        .split(/\r?\n/u)
        .filter((line) => line.startsWith(SSE_DATA_FIELD))
        .map((line) => line.slice(SSE_DATA_FIELD.length).replace(/^ /u, ''))
        .join('\n'),
    )
    .filter((payload) => payload !== '');

const parseEnvelopes = (body, contentType) => {
  try {
    return contentType.includes('application/json')
      ? [parseJsonDocument(body)]
      : parseSseEvents(body).map((payload) => parseJsonDocument(payload));
  } catch (error_) {
    throw new Error(
      `MCP response was not valid JSON: ${
        error_ instanceof Error ? error_.message : String(error_)
      }`,
      { cause: error_ },
    );
  }
};

export const parseMcpEnvelope = async (response, expectedId) => {
  const body = await response.text();
  const contentType = response.headers.get('content-type') ?? '';
  const envelopes = parseEnvelopes(body, contentType);
  const matching = envelopes.filter(
    (envelope) =>
      isRecord(envelope) &&
      envelope.jsonrpc === '2.0' &&
      (expectedId === undefined || envelope.id === expectedId),
  );
  if (matching.length !== 1) {
    throw new Error(
      `MCP response did not contain exactly one JSON-RPC response ID ${String(expectedId)}`,
    );
  }
  const envelope = matching[0];
  const hasResult = Object.hasOwn(envelope, 'result');
  const hasError = Object.hasOwn(envelope, 'error');
  if (hasResult === hasError) {
    throw new Error('MCP response must contain exactly one result or error');
  }
  if (hasError) {
    throw new Error(
      `MCP response contained an error: ${JSON.stringify(envelope.error)}`,
    );
  }
  if (!isRecord(envelope.result))
    throw new Error('MCP response result must be an object');
  return envelope;
};

// The time left is recomputed for every request, so the three requests of one
// batch cannot together outlast the overall deadline.
const createMcpRequester =
  (mcpURL, signal, deadline) =>
  async (body, headers = {}, expectedStatus = 200) => {
    const timeoutSignal = AbortSignal.timeout(remainingMcpTime(deadline));
    const response = await fetch(mcpURL, {
      method: 'POST',
      headers: {
        accept: 'application/json, text/event-stream',
        'content-type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
    });
    if (response.status !== expectedStatus) {
      throw new Error(
        `MCP ${body.method} returned HTTP ${response.status}, expected ${expectedStatus}`,
      );
    }
    return response;
  };

const initializeSession = async (request, requestId) => {
  const initialize = await request({
    jsonrpc: '2.0',
    id: requestId,
    method: 'initialize',
    params: {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'storybook-closure', version: '1.0.0' },
    },
  });
  const sessionId = initialize.headers.get('mcp-session-id');
  if (!sessionId)
    throw new Error('MCP initialize response did not provide a session ID');
  await parseMcpEnvelope(initialize, requestId);
  const sessionHeaders = { 'mcp-session-id': sessionId };
  await request(
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    sessionHeaders,
    202,
  );
  return sessionHeaders;
};

export const executeMcpTestRun = async ({
  mcpURL,
  storyIds,
  requestId,
  signal,
  deadline = Number.POSITIVE_INFINITY,
}) => {
  const request = createMcpRequester(mcpURL, signal, deadline);
  const sessionHeaders = await initializeSession(request, requestId);
  const testRun = await request(
    {
      jsonrpc: '2.0',
      id: requestId + 1,
      method: 'tools/call',
      params: {
        name: 'test-run',
        arguments: {
          a11y: true,
          stories: storyIds.map((storyId) => ({ storyId })),
        },
      },
    },
    sessionHeaders,
  );
  const envelope = await parseMcpEnvelope(testRun, requestId + 1);
  if (!envelope.result)
    throw new Error('MCP test-run response is missing a result');
  return envelope.result;
};
