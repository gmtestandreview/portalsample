/**
 * Shared helpers for Storybook BDD step definitions.
 *
 * Extracted to keep storybook.steps.ts below the Lizard NLOC threshold and
 * to co-locate protocol utilities with the other support modules in this
 * directory.
 */

import process from 'node:process';
import {
  expect,
  type APIRequestContext,
  type APIResponse,
  type FrameLocator,
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
const STORYBOOK_PREVIEW_IFRAME_SELECTOR = '#storybook-preview-iframe';

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
    error instanceof Error ? error.message : String(error),
  );

export async function executeMcpTestRun(
  request: APIRequestContext,
  storyIds: string[],
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
  expectedId?: number | string,
): Promise<McpEnvelope> {
  const body = await response.text();
  const contentType = response.headers()['content-type'] ?? '';
  if (contentType.includes('application/json')) {
    const envelope = JSON.parse(body) as McpEnvelope;
    if (expectedId !== undefined && envelope.id !== expectedId) {
      throw new Error(
        `MCP JSON-RPC response ID ${String(envelope.id)} did not match ${String(expectedId)}`,
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
    (candidate) => candidate.error !== undefined,
  );
  if (errorEvent !== undefined) {
    throw new Error(
      `MCP JSON-RPC response contained an error: ${JSON.stringify(errorEvent.error)}`,
    );
  }
  const event =
    matchingEvents.find(
      (candidate) => candidate.result?.structuredContent !== undefined,
    ) ?? matchingEvents.at(-1);

  if (event === undefined) {
    throw new Error(
      expectedId === undefined
        ? `MCP response did not contain an SSE data event: ${body}`
        : `MCP response did not contain JSON-RPC response ID ${String(expectedId)}`,
    );
  }

  return event;
}

export function storybookPreviewFrame(page: Page): FrameLocator {
  return page.frameLocator(STORYBOOK_PREVIEW_IFRAME_SELECTOR);
}

/** Switch the manager's preview iframe to a story and wait for it to render. */
export async function loadStoryIframe(page: Page, storyId: string) {
  const previewIframe = page.locator(STORYBOOK_PREVIEW_IFRAME_SELECTOR);
  if ((await previewIframe.count()) === 0) {
    await page.goto(STORYBOOK_BASE);
  }

  await expect(page.getByRole('heading', { name: 'Storybook' })).toBeVisible({
    timeout: STORY_RENDER_TIMEOUT_MS,
  });
  await expect(previewIframe).toBeVisible({
    timeout: STORY_RENDER_TIMEOUT_MS,
  });

  await page.evaluate((nextStoryId) => {
    const storybookUrl = new URL(globalThis.location.href);
    storybookUrl.searchParams.set('path', `/story/${nextStoryId}`);
    storybookUrl.hash = '';
    globalThis.history.pushState({}, '', storybookUrl);
    globalThis.dispatchEvent(new PopStateEvent('popstate'));
  }, storyId);

  await page.waitForFunction(
    (expectedStoryId) => {
      const iframe = document.querySelector('#storybook-preview-iframe');
      if (!(iframe instanceof HTMLIFrameElement)) {
        return false;
      }

      const previewHref = iframe.contentWindow?.location.href;
      if (previewHref === undefined) {
        return false;
      }

      try {
        return new URL(previewHref).searchParams.get('id') === expectedStoryId;
      } catch {
        return false;
      }
    },
    storyId,
    { timeout: STORY_RENDER_TIMEOUT_MS, polling: 100 },
  );

  await expect(storybookPreviewFrame(page).locator('body')).toHaveClass(
    /\bsb-show-main\b/u,
    { timeout: STORY_RENDER_TIMEOUT_MS },
  );
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
