/**
 * Shared helpers for Storybook BDD step definitions.
 *
 * Extracted to keep storybook.steps.ts below the Lizard NLOC threshold and
 * to co-locate protocol utilities with the other support modules in this
 * directory.
 */

import { expect } from 'vitest';
import process from 'node:process';
import {
  expect,
  type APIRequestContext,
  type APIResponse,
  type Page,
} from '@playwright/test';
import { resolveStorybookTestTarget } from '../../../.storybook/storybook-test-target';

const storybookTestURL = process.env['STORYBOOK_TEST_URL'];
const storybookServerMode = process.env['STORYBOOK_TEST_SERVER_MODE'];
const storybookTarget = resolveStorybookTestTarget({
  ...(storybookTestURL === undefined ? {} : { url: storybookTestURL }),
  ...(storybookServerMode === undefined
    ? {}
    : { serverMode: storybookServerMode }),
  ci: Boolean(process.env['CI']),
});

export const STORYBOOK_BASE = storybookTarget.baseURL;
export const STORYBOOK_MCP = storybookTarget.mcpURL;

/** Ceiling for waiting on a story bundle to compile and render on first hit. */
export const STORY_RENDER_TIMEOUT_MS = 15_000;

export const MCP_HEADERS = {
  accept: 'application/json, text/event-stream',
  'content-type': 'application/json',
};
const MCP_TRANSPORT_RETRY_DELAYS_MS = [1_000, 2_000] as const;

export type McpEnvelope = {
  id?: number | string;
  error?: unknown;
  result?: {
    serverInfo?: { name?: string };
    tools?: Array<{ name: string }>;
    structuredContent?: unknown;
    content?: Array<{ type?: string; text?: string }>;
  };
};

const isTransientMcpTransportError = (error: unknown): boolean =>
  /ECONNRESET|ECONNREFUSED|socket hang up/i.test(
    error instanceof Error ? error.message : String(error)
  );

export async function executeMcpTestRun(
  request: APIRequestContext,
  storyIds: string[]
): Promise<APIResponse> {
  let lastError: unknown;

  for (
    let attempt = 0;
    attempt <= MCP_TRANSPORT_RETRY_DELAYS_MS.length;
    attempt += 1
  ) {
    try {
      const initialize = await request.post(STORYBOOK_MCP, {
        headers: MCP_HEADERS,
        data: {
          jsonrpc: '2.0',
          id: 10,
          method: 'initialize',
          params: {
            protocolVersion: '2025-03-26',
            capabilities: {},
            clientInfo: {
              name: 'storybook-coverage-remediation',
              version: '1.0.0',
            },
          },
        },
      });

      expect(initialize.status()).toBe(200);

      const sessionId = initialize.headers()['mcp-session-id'];
      if (sessionId === undefined) {
        throw new Error('MCP initialize response did not provide a session ID');
      }
      await readMcpEvent(initialize, 10);

      const sessionHeaders = {
        ...MCP_HEADERS,
        'mcp-session-id': sessionId,
      };
      const initialized = await request.post(STORYBOOK_MCP, {
        headers: sessionHeaders,
        data: { jsonrpc: '2.0', method: 'notifications/initialized' },
      });

      expect(initialized.status()).toBe(202);

      return await request.post(STORYBOOK_MCP, {
        headers: sessionHeaders,
        timeout: 150_000,
        data: {
          jsonrpc: '2.0',
          id: 11,
          method: 'tools/call',
          params: {
            name: 'test-run',
            arguments: {
              a11y: true,
              stories: storyIds.map((storyId) => ({ storyId })),
            },
          },
        },
      });
    } catch (error) {
      lastError = error;
      const delay = MCP_TRANSPORT_RETRY_DELAYS_MS.at(attempt);
      if (!isTransientMcpTransportError(error) || delay === undefined) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('MCP test-run failed without a transport error');
}

export async function readMcpEvent(
  response: APIResponse,
  expectedId?: number | string
): Promise<McpEnvelope> {
  const body = await response.text();
  const contentType = response.headers()['content-type'] ?? '';
  if (contentType.includes('application/json')) {
    const envelope = JSON.parse(body) as McpEnvelope;
    if (expectedId !== undefined && envelope.id !== expectedId) {
      throw new Error(
        `MCP JSON-RPC response ID ${String(envelope.id)} did not match ${String(expectedId)}`
      );
    }
    return envelope;
  }
  const events = body
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data: '))
    .map((line) => JSON.parse(line.slice('data: '.length)) as McpEnvelope);

  const matchingEvents =
    expectedId === undefined
      ? events
      : events.filter((candidate) => candidate.id === expectedId);
  const errorEvent = matchingEvents.find(
    (candidate) => candidate.error !== undefined
  );
  if (errorEvent !== undefined) {
    throw new Error(
      `MCP JSON-RPC response contained an error: ${JSON.stringify(errorEvent.error)}`
    );
  }
  const event =
    matchingEvents.find(
      (candidate) => candidate.result?.structuredContent !== undefined
    ) ?? matchingEvents.at(-1);

  if (event === undefined) {
    throw new Error(
      expectedId === undefined
        ? `MCP response did not contain an SSE data event: ${body}`
        : `MCP response did not contain JSON-RPC response ID ${String(expectedId)}`
    );
  }

  return event;
}

/** Navigate to a Storybook story iframe and wait for the story to actually render. */
export async function loadStoryIframe(page: Page, storyId: string) {
  await page.goto(`${STORYBOOK_BASE}/iframe.html?id=${storyId}&viewMode=story`);
  // #storybook-root exists in the iframe shell immediately; the story bundle is
  // compiled lazily on first hit, so waiting only for 'attached' lets assertions
  // race a story that has not mounted yet. Storybook toggles body.sb-show-main
  // once the story has rendered (sb-show-preparing before, sb-show-errordisplay
  // on failure) — a portal-safe signal, unlike #storybook-root content which
  // stays empty for modal/toast stories. Best-effort: the step's own assertion
  // keeps its own timeout and remains the source of truth for a broken story.
  await page
    .waitForFunction(
      () => document.body.classList.contains('sb-show-main'),
      undefined,
      {
        timeout: STORY_RENDER_TIMEOUT_MS,
        polling: 100,
      }
    )
    .catch(() => {
      // Slow cold compile — fall through to the assertion's own wait.
    });
  // Let late XHRs (MSW handlers, lazy assets) settle; best-effort as before.
  await page
    .waitForLoadState('networkidle', { timeout: STORY_RENDER_TIMEOUT_MS })
    .catch(() => {
      // networkidle can be flaky with MSW; continue after domcontentloaded
    });
}

/** Navigate directly to a Storybook docs iframe and wait for Docs to render. */
export async function loadDocsIframe(page: Page, docsId: string) {
  await page.goto(`${STORYBOOK_BASE}/iframe.html?id=${docsId}&viewMode=docs`);

  await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/u, {
    timeout: STORY_RENDER_TIMEOUT_MS,
  });
}

export function visibleSource(page: Page) {
  return page.locator('pre:visible');
}
