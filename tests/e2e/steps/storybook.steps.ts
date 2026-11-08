/**
 * Storybook BDD step definitions.
 *
 * These steps navigate Storybook's manager preview iframe and assert that the
 * rendered component matches the expectations described in the story files.
 *
 * Story manager URL pattern:
 *   http://localhost:6006/?path=/story/<story-id>
 *
 * The steps use absolute URLs so they work regardless of the Playwright
 * project's baseURL setting.
 */

import {
  expect,
  type ConsoleMessage,
  type Page,
  type Request,
  type Response as PlaywrightResponse,
} from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import {
  STORYBOOK_BASE,
  STORYBOOK_MCP,
  STORY_RENDER_TIMEOUT_MS,
  MCP_HEADERS,
  executeMcpTestRun,
  readMcpEvent,
  loadStoryIframe,
  loadDocsIframe,
  storybookPreviewFrame,
  visibleSource,
} from '../support/storybookHelpers';
import {
  parseMcpMarkdownReport,
  type StorybookMcpMarkdownReport,
} from '../support/storybookMcpReport';

const { Given, When, Then, After } = createBdd();

const REPRESENTATIVE_DOCS_ID = 'components-pill--documentation';
const REPRESENTATIVE_STORY_ID = 'components-pill--dashboard-statuses';
const STYLE_GUIDE_DOCS_ID = 'documentation-style-guide--documentation';
const AUTOSUGGEST_DOCS_ID = 'components-inputs-autosuggest--documentation';
const ACCEPT_QUOTE_DOCS_ID = 'routes-acceptquote--documentation';
const ROUTE_LEAVING_GUARD_DOCS_ID =
  'components-routeleavingguard--documentation';

interface StorybookPageIssueMonitor {
  pageErrorHandler: (error: Error) => void;
  consoleErrorHandler: (message: ConsoleMessage) => void;
  messages: string[];
}

const storybookPageIssueMonitors = new WeakMap<
  Page,
  StorybookPageIssueMonitor
>();
interface DocsIsolationProbe {
  endpointRequests: string[];
  mockedResponses: string[];
  liveSends: string[];
  unmatchedRequests: string[];
  failedRequests: string[];
}

interface ProviderLifecycleEvent {
  type: 'storybook-portal-provider';
  phase: 'mounted' | 'cleaned';
  sentinel: string;
}

interface AccountContextLifecycleEvent {
  type: 'storybook-account-context';
  phase: 'active' | 'cleaned';
  sentinel: string;
  targetOrganisationName: string | null;
}

const docsIsolationResults = new WeakMap<Page, { completed: boolean }>();
const LATE_UNMOUNT_SIGNAL =
  /(?:can't perform a React state update on an unmounted component|state update on an unmounted component|update(?:d)? after unmount)/i;
const MSW_FAILURE_SIGNAL =
  /(?:unhandled request|without a matching request handler|network request failed|cannot bypass)/iu;
const PAYMENT_DETAILS_ENDPOINT = '/api/accept-quote/123/payment-details';
const PAYMENT_DETAILS_STEP_FRAME =
  '#iframe--routes-acceptquote--payment-details-step';
const PAYMENT_DETAILS_POSTPAID_FRAME =
  '#iframe--routes-acceptquote--payment-details-postpaid';
const PAYMENT_DETAILS_PREPAID_SESSION_KEY =
  'storybook:accept-quote:payment-details:prepaid';
const PAYMENT_DETAILS_POSTPAID_SESSION_KEY =
  'storybook:accept-quote:payment-details:postpaid';

const captureLateUnmountSignal = (
  messages: string[],
  source: string,
  message: string,
) => {
  if (LATE_UNMOUNT_SIGNAL.test(message)) {
    messages.push(`${source}: ${message}`);
  }
};

const cleanupStorybookPageIssueMonitor = (page: Page) => {
  const monitor = storybookPageIssueMonitors.get(page);
  if (monitor === undefined) {
    return;
  }

  page.off('pageerror', monitor.pageErrorHandler);
  page.off('console', monitor.consoleErrorHandler);
  storybookPageIssueMonitors.delete(page);
};

// ---------------------------------------------------------------------------
// MCP protocol compatibility
// ---------------------------------------------------------------------------

Given('the Storybook MCP server is running', async ({ page, request }) => {
  const response = await request.get(STORYBOOK_MCP, {
    headers: { accept: 'text/html' },
  });

  expect(response.status()).toBe(200);
  expect(await response.text()).toContain(
    'Storybook MCP server successfully running',
  );

  await page.goto(STORYBOOK_BASE);

  await expect(page.getByRole('heading', { name: 'Storybook' })).toBeVisible({
    timeout: 15_000,
  });
});

Then(
  'the Storybook MCP endpoint should initialize and list configured tools',
  async ({ request }) => {
    const initialize = await request.post(STORYBOOK_MCP, {
      headers: MCP_HEADERS,
      data: {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: { name: 'dependency-security-test', version: '1.0.0' },
        },
      },
    });

    expect(initialize.status()).toBe(200);

    const sessionId = initialize.headers()['mcp-session-id'];
    if (sessionId === undefined) {
      throw new Error('MCP initialize response did not provide a session ID');
    }
    const initializeEnvelope = await readMcpEvent(initialize, 1);

    expect(initializeEnvelope.result?.serverInfo?.name).toBe(
      '@storybook/addon-mcp',
    );

    const sessionHeaders = {
      ...MCP_HEADERS,
      'mcp-session-id': sessionId,
    };
    const initialized = await request.post(STORYBOOK_MCP, {
      headers: sessionHeaders,
      data: { jsonrpc: '2.0', method: 'notifications/initialized' },
    });

    expect(initialized.status()).toBe(202);

    const toolsList = await request.post(STORYBOOK_MCP, {
      headers: sessionHeaders,
      data: { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
    });

    expect(toolsList.status()).toBe(200);

    const toolsEnvelope = await readMcpEvent(toolsList, 2);
    const toolNames =
      toolsEnvelope.result?.tools?.map(({ name }) => name) ?? [];

    expect(toolNames).toEqual(
      expect.arrayContaining([
        'docs-list',
        'stories-preview',
        'review-create',
        'test-run',
      ]),
    );
  },
);

interface NormalizedReceipt {
  ok: boolean;
  errors: { code: string; message: string }[];
  report?: StorybookMcpMarkdownReport;
  receipt?: {
    requestedStoryIds: string[];
    executedStoryIds: string[];
    componentTestStatuses: { storyId: string; status: string }[];
    a11yStatuses: { storyId: string; status: string }[];
  };
}

interface McpStatus {
  storyId: string;
  status: string;
}

let latestMcpExecution: NormalizedReceipt | undefined;

When(
  'I execute the native MCP test-run for stories {string}',
  async ({ request }, storyIdsText: string) => {
    const storyIds = storyIdsText
      .split(',')
      .map((storyId) => storyId.trim())
      .filter(Boolean);
    const testRun = await executeMcpTestRun(request, storyIds);

    expect(testRun.status()).toBe(200);

    const envelope = await readMcpEvent(testRun, 11);

    expect(envelope.error).toBeUndefined();

    const textBlocks = envelope.result?.content?.flatMap((block) =>
      block.type === 'text' && block.text !== undefined ? [block.text] : [],
    );
    const contentText = textBlocks?.join('\n');
    const contentStructured = textBlocks
      ?.map((text) => {
        try {
          return JSON.parse(text) as unknown;
        } catch {
          return undefined;
        }
      })
      .find(
        (value) =>
          value !== undefined &&
          typeof value === 'object' &&
          value !== null &&
          'status' in value,
      );
    const structuredContent =
      envelope.result?.structuredContent ?? contentStructured;
    let componentTestStatuses: McpStatus[];
    let a11yStatuses: McpStatus[];
    let reportEvidence: StorybookMcpMarkdownReport | undefined;

    if (structuredContent !== undefined) {
      const completedContent = structuredContent as {
        status?: string;
        result?: {
          componentTestStatuses?: McpStatus[];
          a11yStatuses?: McpStatus[];
          counts?: {
            requested?: number;
            executed?: number;
            component?: number;
            a11y?: number;
          };
          unhandledErrors?: unknown[];
        };
      };
      const execution = completedContent.result;
      componentTestStatuses = execution?.componentTestStatuses ?? [];
      a11yStatuses = execution?.a11yStatuses ?? [];

      expect(completedContent.status).toBe('completed');
      expect(
        componentTestStatuses
          .map(({ storyId }) => storyId)
          .sort((a, b) => a.localeCompare(b)),
      ).toEqual([...storyIds].sort((a, b) => a.localeCompare(b)));
      expect(
        a11yStatuses
          .map(({ storyId }) => storyId)
          .sort((a, b) => a.localeCompare(b)),
      ).toEqual([...storyIds].sort((a, b) => a.localeCompare(b)));
      expect(
        componentTestStatuses.every(
          ({ status }) => status === 'status-value:success',
        ),
      ).toBe(true);
      expect(
        a11yStatuses.every(({ status }) => status === 'status-value:success'),
      ).toBe(true);
      expect(execution?.counts).toEqual({
        requested: storyIds.length,
        executed: storyIds.length,
        component: storyIds.length,
        a11y: storyIds.length,
      });
      expect(execution?.unhandledErrors).toEqual([]);
    } else {
      const report = parseMcpMarkdownReport(contentText ?? '');
      reportEvidence = report;
      const passingStoryIds = [...new Set(report.passingStoryIds)].sort(
        (a, b) => a.localeCompare(b),
      );
      const requestedStoryIds = [...storyIds].sort((a, b) =>
        a.localeCompare(b),
      );

      expect(report.missingSections).not.toContain('Passing Stories');
      expect(passingStoryIds).toEqual(requestedStoryIds);
      expect(
        report.failingStoryIds.filter((storyId) => storyIds.includes(storyId)),
      ).toEqual([]);
      expect(report.accessibilityViolationStoryIds).toEqual([]);
      expect(report.unhandledErrors).toEqual([]);

      componentTestStatuses = [];
      a11yStatuses = [];
    }

    const componentStoryIds =
      reportEvidence?.passingStoryIds ??
      componentTestStatuses.map(({ storyId }) => storyId);
    latestMcpExecution = {
      ok: true,
      errors: [],
      ...(reportEvidence === undefined ? {} : { report: reportEvidence }),
      receipt: {
        requestedStoryIds: storyIds,
        executedStoryIds: componentStoryIds,
        componentTestStatuses,
        a11yStatuses,
      },
    };
  },
);

Then(
  'the native MCP report should list exact passing stories without accessibility violations',
  () => {
    expect(latestMcpExecution).toMatchObject({ ok: true });

    if (latestMcpExecution?.report !== undefined) {
      expect(latestMcpExecution.report.missingSections).not.toContain(
        'Passing Stories',
      );
      expect(latestMcpExecution.report.failingStoryIds).toEqual([]);
      expect(latestMcpExecution.report.accessibilityViolationStoryIds).toEqual(
        [],
      );
      expect(latestMcpExecution.report.unhandledErrors).toEqual([]);

      return;
    }

    expect(latestMcpExecution?.receipt?.requestedStoryIds).toEqual(
      latestMcpExecution?.receipt?.executedStoryIds,
    );
    expect(latestMcpExecution?.receipt?.componentTestStatuses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'status-value:success' }),
      ]),
    );
    expect(latestMcpExecution?.receipt?.a11yStatuses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'status-value:success' }),
      ]),
    );
  },
);

// ---------------------------------------------------------------------------
// Background steps
// ---------------------------------------------------------------------------

Given('Storybook is running', async ({ page }) => {
  const response = await page.goto(STORYBOOK_BASE);

  expect(response?.ok()).toBe(true);
  await expect(page.getByRole('heading', { name: 'Storybook' })).toBeVisible({
    timeout: 15_000,
  });
});

Given('I am viewing Storybook stories for alerts', async () => {
  // Intentionally empty — navigation happens in the When step
});

Given('I am viewing Storybook stories for the accordion', async () => {
  // Intentionally empty — navigation happens in the When step
});
Given('I am viewing Storybook stories for body text', async () => {
  // Intentionally empty — navigation happens in the When step
});
Given('I am viewing Storybook stories for breadcrumbs', async () => {
  // Intentionally empty — navigation happens in the When step
});
Given('I am viewing Storybook stories for buttons', async () => {
  // Intentionally empty — navigation happens in the When step
});
Given('I am viewing Storybook stories for header intro text', async () => {
  // Intentionally empty — navigation happens in the When step
});
Given('I am viewing Storybook stories for stepped navigation', async () => {
  // Intentionally empty — navigation happens in the When step
});
Given('I am viewing Storybook stories for summary display', async () => {
  // Intentionally empty — navigation happens in the When step
});
Given('I am viewing Storybook stories for pill status badges', async () => {
  // Intentionally empty — navigation happens in the When step
});
Given('I am viewing Storybook stories for pagination', async () => {
  // Intentionally empty — navigation happens in the When step
});
Given('I am viewing Storybook stories for the site header', async () => {
  // Intentionally empty — navigation happens in the When step
});
Given('I am viewing Storybook stories for the site footer', async () => {
  // Intentionally empty — navigation happens in the When step
});
Given('I am viewing Storybook stories for search filter', async () => {
  // Intentionally empty — navigation happens in the When step
});
Given(
  'I am viewing Storybook stories for dashboard request items',
  async () => {
    // Intentionally empty — navigation happens in the When step
  },
);
Given('I am viewing Storybook stories for form inputs', async () => {
  // Intentionally empty — navigation happens in the When step
});
Given('I am viewing Storybook stories for the wizard form', async () => {
  // Intentionally empty — navigation happens in the When step
});
Given('I am viewing Storybook stories for modals', async () => {
  // Intentionally empty — navigation happens in the When step
});

Given(
  'the Storybook sequence is monitored for late unmount updates',
  ({ page }) => {
    cleanupStorybookPageIssueMonitor(page);
    const messages: string[] = [];
    const pageErrorHandler = (error: Error) => {
      captureLateUnmountSignal(messages, 'pageerror', error.message);
    };
    const consoleErrorHandler = (message: ConsoleMessage) => {
      if (message.type() === 'error') {
        captureLateUnmountSignal(messages, 'console', message.text());
      }
    };

    page.on('pageerror', pageErrorHandler);
    page.on('console', consoleErrorHandler);
    storybookPageIssueMonitors.set(page, {
      pageErrorHandler,
      consoleErrorHandler,
      messages,
    });
  },
);

After(({ page }) => {
  cleanupStorybookPageIssueMonitor(page);
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

When(
  'I open a representative component documentation page',
  async ({ page }) => {
    await loadDocsIframe(page, REPRESENTATIVE_DOCS_ID);
  },
);

When(
  'I exercise overlapping request story frames on the generated AcceptQuote documentation page',
  async ({ page }) => {
    const probe: DocsIsolationProbe = {
      endpointRequests: [],
      mockedResponses: [],
      liveSends: [],
      unmatchedRequests: [],
      failedRequests: [],
    };
    const requestHandler = (request: Request) => {
      // Playwright's request event is observation only; it does not replace or
      // bypass the browser transport used by the story's MSW worker.
      if (request.url().includes(PAYMENT_DETAILS_ENDPOINT)) {
        probe.endpointRequests.push(request.url());
      }
    };
    const requestFailedHandler = (request: Request) => {
      if (request.url().includes(PAYMENT_DETAILS_ENDPOINT)) {
        probe.failedRequests.push(request.url());
      }
    };
    const responseHandler = (response: PlaywrightResponse) => {
      if (!response.url().includes(PAYMENT_DETAILS_ENDPOINT)) {
        return;
      }

      const mockName = response.headers()['x-storybook-mock'];
      if (mockName === undefined) {
        probe.liveSends.push(response.url());
      } else {
        probe.mockedResponses.push(mockName);
      }
    };
    const consoleErrorHandler = (message: ConsoleMessage) => {
      if (
        message.type() === 'error' &&
        MSW_FAILURE_SIGNAL.test(message.text())
      ) {
        probe.unmatchedRequests.push(message.text());
      }
    };
    const readProviderEvents = () =>
      page.evaluate(() => {
        const events = (
          globalThis as typeof globalThis & {
            __storybookPortalProviderEvents?: ProviderLifecycleEvent[];
          }
        ).__storybookPortalProviderEvents;
        return events ?? [];
      });
    const readAccountEvents = () =>
      page.evaluate(() => {
        const events = (
          globalThis as typeof globalThis & {
            __storybookAccountLifecycleEvents?: AccountContextLifecycleEvent[];
          }
        ).__storybookAccountLifecycleEvents;
        return events ?? [];
      });
    const readSessionSentinel = (key: string) =>
      page.evaluate(
        (sessionKey) => globalThis.sessionStorage.getItem(sessionKey),
        key,
      );
    const expectSessionSentinel = async (
      key: string,
      expected: string | null,
    ) => {
      await expect.poll(() => readSessionSentinel(key)).toBe(expected);
    };
    const expectMountedProviderPair = async () => {
      await expect
        .poll(async () => {
          const events = await readProviderEvents();
          return events
            .filter((event) => event.phase === 'mounted')
            .map((event) => event.sentinel)
            .sort((a, b) => a.localeCompare(b));
        })
        .toEqual(['payment-details-postpaid', 'payment-details-prepaid']);
    };
    const expectActiveAccountPair = async () => {
      await expect
        .poll(async () => {
          const events = await readAccountEvents();
          return events
            .filter((event) => event.phase === 'active')
            .map((event) => event.sentinel)
            .sort((a, b) => a.localeCompare(b));
        })
        .toEqual(['payment-details-postpaid', 'payment-details-prepaid']);
    };
    const findStoryFrame = (storyId: string) => {
      const frame = page
        .frames()
        .find((candidate) => candidate.url().includes(`id=${storyId}`));
      if (!frame) {
        throw new Error(`Story frame ${storyId} was not found`);
      }
      return frame;
    };
    const fetchPaymentDetails = async (storyId: string) =>
      findStoryFrame(storyId).evaluate(async (endpoint) => {
        const response = await globalThis.fetch(endpoint);
        return {
          status: response.status,
          body: (await response.json()) as {
            acceptQuotePreInfo?: { paymentTerms?: string };
          },
        };
      }, PAYMENT_DETAILS_ENDPOINT);
    const readAccountTargetOrganisation = (storyId: string) =>
      findStoryFrame(storyId).evaluate(
        () =>
          globalThis.document.body.dataset[
            'storybookAccountTargetOrganisation'
          ] ?? null,
      );
    const removeFrame = async (selector: string) => {
      await page
        .locator(selector)
        .first()
        .evaluate((element) => {
          element.remove();
        });
      await expect(page.locator(selector)).toHaveCount(0);
    };

    page.on('request', requestHandler);
    page.on('requestfailed', requestFailedHandler);
    page.on('response', responseHandler);
    page.on('console', consoleErrorHandler);

    let completed = false;
    try {
      await page.addInitScript(() => {
        const target = globalThis as typeof globalThis & {
          __storybookPortalProviderEvents?: ProviderLifecycleEvent[];
          __storybookAccountLifecycleEvents?: AccountContextLifecycleEvent[];
        };
        target.__storybookPortalProviderEvents = [];
        target.__storybookAccountLifecycleEvents = [];
      });
      expect(
        await readSessionSentinel(PAYMENT_DETAILS_PREPAID_SESSION_KEY),
      ).toBeNull();
      expect(
        await readSessionSentinel(PAYMENT_DETAILS_POSTPAID_SESSION_KEY),
      ).toBeNull();
      await loadDocsIframe(page, ACCEPT_QUOTE_DOCS_ID);
      await expect(page.locator(PAYMENT_DETAILS_STEP_FRAME)).toHaveCount(1);
      await expect(page.locator(PAYMENT_DETAILS_POSTPAID_FRAME)).toHaveCount(1);
      await expect(
        page.frameLocator(PAYMENT_DETAILS_STEP_FRAME).locator('body'),
      ).toContainText('Prepayment required', {
        timeout: STORY_RENDER_TIMEOUT_MS,
      });
      await expect(
        page.frameLocator(PAYMENT_DETAILS_POSTPAID_FRAME).locator('body'),
      ).toContainText('Invoices must be paid within 30 days', {
        timeout: STORY_RENDER_TIMEOUT_MS,
      });
      await expectMountedProviderPair();
      await expectActiveAccountPair();
      await expect
        .poll(() =>
          readAccountTargetOrganisation(
            'routes-acceptquote--payment-details-step',
          ),
        )
        .toBe('payment-details-prepaid:active');
      await expect
        .poll(() =>
          readAccountTargetOrganisation(
            'routes-acceptquote--payment-details-postpaid',
          ),
        )
        .toBe('payment-details-postpaid:active');
      await expectSessionSentinel(
        PAYMENT_DETAILS_PREPAID_SESSION_KEY,
        `${PAYMENT_DETAILS_PREPAID_SESSION_KEY}:active`,
      );
      await expectSessionSentinel(
        PAYMENT_DETAILS_POSTPAID_SESSION_KEY,
        `${PAYMENT_DETAILS_POSTPAID_SESSION_KEY}:active`,
      );
      const sessionBefore = await page.evaluate(() =>
        globalThis.sessionStorage.getItem('targetOrganisation'),
      );
      expect(probe.endpointRequests).toHaveLength(2);

      await removeFrame(PAYMENT_DETAILS_STEP_FRAME);
      await expect.poll(readProviderEvents).toEqual(
        expect.arrayContaining([
          {
            type: 'storybook-portal-provider',
            phase: 'cleaned',
            sentinel: 'payment-details-prepaid',
          },
          {
            type: 'storybook-portal-provider',
            phase: 'mounted',
            sentinel: 'payment-details-postpaid',
          },
        ]),
      );
      expect(await readProviderEvents()).not.toEqual(
        expect.arrayContaining([
          {
            type: 'storybook-portal-provider',
            phase: 'cleaned',
            sentinel: 'payment-details-postpaid',
          },
        ]),
      );
      await expect.poll(readAccountEvents).toEqual(
        expect.arrayContaining([
          {
            type: 'storybook-account-context',
            phase: 'cleaned',
            sentinel: 'payment-details-prepaid',
            targetOrganisationName: 'payment-details-prepaid:active',
          },
        ]),
      );
      await expect
        .poll(() =>
          readAccountTargetOrganisation(
            'routes-acceptquote--payment-details-postpaid',
          ),
        )
        .toBe('payment-details-postpaid:active');
      await expectSessionSentinel(PAYMENT_DETAILS_PREPAID_SESSION_KEY, null);
      await expectSessionSentinel(
        PAYMENT_DETAILS_POSTPAID_SESSION_KEY,
        `${PAYMENT_DETAILS_POSTPAID_SESSION_KEY}:active`,
      );
      const postpaidAfterStepCleanup = await fetchPaymentDetails(
        'routes-acceptquote--payment-details-postpaid',
      );
      expect(postpaidAfterStepCleanup).toEqual({
        status: 200,
        body: {
          acceptQuotePreInfo: {
            paymentTerms: 'Invoice',
            quotationIdNum: 'Q-2024-000456',
          },
        },
      });

      await removeFrame(PAYMENT_DETAILS_POSTPAID_FRAME);
      await expect
        .poll(
          () =>
            page
              .frames()
              .filter((frame) => frame.url().includes('payment-details-'))
              .length,
        )
        .toBe(0);
      expect(await readProviderEvents()).toEqual(
        expect.arrayContaining([
          {
            type: 'storybook-portal-provider',
            phase: 'cleaned',
            sentinel: 'payment-details-postpaid',
          },
        ]),
      );
      await expect.poll(readAccountEvents).toEqual(
        expect.arrayContaining([
          {
            type: 'storybook-account-context',
            phase: 'cleaned',
            sentinel: 'payment-details-postpaid',
            targetOrganisationName: 'payment-details-postpaid:active',
          },
        ]),
      );
      await expectSessionSentinel(PAYMENT_DETAILS_POSTPAID_SESSION_KEY, null);
      await expectSessionSentinel(PAYMENT_DETAILS_PREPAID_SESSION_KEY, null);

      await page.goto(
        `${STORYBOOK_BASE}/iframe.html?id=${ACCEPT_QUOTE_DOCS_ID}&viewMode=docs`,
      );
      await expect(page.locator(PAYMENT_DETAILS_STEP_FRAME)).toHaveCount(1);
      await expect(page.locator(PAYMENT_DETAILS_POSTPAID_FRAME)).toHaveCount(1);
      await expect(
        page.frameLocator(PAYMENT_DETAILS_STEP_FRAME).locator('body'),
      ).toContainText('Prepayment required', {
        timeout: STORY_RENDER_TIMEOUT_MS,
      });
      await expect(
        page.frameLocator(PAYMENT_DETAILS_POSTPAID_FRAME).locator('body'),
      ).toContainText('Invoices must be paid within 30 days', {
        timeout: STORY_RENDER_TIMEOUT_MS,
      });
      await expectMountedProviderPair();
      await expectActiveAccountPair();
      await expectSessionSentinel(
        PAYMENT_DETAILS_PREPAID_SESSION_KEY,
        `${PAYMENT_DETAILS_PREPAID_SESSION_KEY}:active`,
      );
      await expectSessionSentinel(
        PAYMENT_DETAILS_POSTPAID_SESSION_KEY,
        `${PAYMENT_DETAILS_POSTPAID_SESSION_KEY}:active`,
      );
      // Two initial requests from the first A/B pair, one explicit B request
      // after A cleanup, then two initial requests from the reversed pair.
      expect(probe.endpointRequests).toHaveLength(5);

      await removeFrame(PAYMENT_DETAILS_POSTPAID_FRAME);
      await expect.poll(readProviderEvents).toEqual(
        expect.arrayContaining([
          {
            type: 'storybook-portal-provider',
            phase: 'cleaned',
            sentinel: 'payment-details-postpaid',
          },
          {
            type: 'storybook-portal-provider',
            phase: 'mounted',
            sentinel: 'payment-details-prepaid',
          },
        ]),
      );
      expect(await readProviderEvents()).not.toEqual(
        expect.arrayContaining([
          {
            type: 'storybook-portal-provider',
            phase: 'cleaned',
            sentinel: 'payment-details-prepaid',
          },
        ]),
      );
      await expect.poll(readAccountEvents).toEqual(
        expect.arrayContaining([
          {
            type: 'storybook-account-context',
            phase: 'cleaned',
            sentinel: 'payment-details-postpaid',
            targetOrganisationName: 'payment-details-postpaid:active',
          },
          {
            type: 'storybook-account-context',
            phase: 'active',
            sentinel: 'payment-details-prepaid',
            targetOrganisationName: 'payment-details-prepaid:active',
          },
        ]),
      );
      await expect
        .poll(() =>
          readAccountTargetOrganisation(
            'routes-acceptquote--payment-details-step',
          ),
        )
        .toBe('payment-details-prepaid:active');
      await expectSessionSentinel(PAYMENT_DETAILS_POSTPAID_SESSION_KEY, null);
      await expectSessionSentinel(
        PAYMENT_DETAILS_PREPAID_SESSION_KEY,
        `${PAYMENT_DETAILS_PREPAID_SESSION_KEY}:active`,
      );
      const stepAfterPostpaidCleanup = await fetchPaymentDetails(
        'routes-acceptquote--payment-details-step',
      );
      expect(stepAfterPostpaidCleanup).toEqual({
        status: 200,
        body: {
          acceptQuotePreInfo: {
            paymentTerms: 'Prepaid',
            quotationIdNum: 'Q-2024-000456',
          },
        },
      });

      await removeFrame(PAYMENT_DETAILS_STEP_FRAME);
      await expect
        .poll(
          () =>
            page
              .frames()
              .filter((frame) => frame.url().includes('payment-details-'))
              .length,
        )
        .toBe(0);
      expect(await readProviderEvents()).toEqual(
        expect.arrayContaining([
          {
            type: 'storybook-portal-provider',
            phase: 'cleaned',
            sentinel: 'payment-details-prepaid',
          },
        ]),
      );
      await expect.poll(readAccountEvents).toEqual(
        expect.arrayContaining([
          {
            type: 'storybook-account-context',
            phase: 'cleaned',
            sentinel: 'payment-details-prepaid',
            targetOrganisationName: 'payment-details-prepaid:active',
          },
        ]),
      );
      await expectSessionSentinel(PAYMENT_DETAILS_PREPAID_SESSION_KEY, null);
      await expectSessionSentinel(PAYMENT_DETAILS_POSTPAID_SESSION_KEY, null);

      expect(probe.endpointRequests).toHaveLength(6);
      expect(probe.mockedResponses).toHaveLength(6);
      expect(
        probe.mockedResponses.filter(
          (name) => name === 'payment-details-prepaid',
        ),
      ).toHaveLength(3);
      expect(
        probe.mockedResponses.filter(
          (name) => name === 'payment-details-postpaid',
        ),
      ).toHaveLength(3);
      expect(probe.liveSends).toEqual([]);
      expect(probe.unmatchedRequests).toEqual([]);
      expect(probe.failedRequests).toEqual([]);
      const providerEvents = await readProviderEvents();
      expect(
        providerEvents
          .filter((event) => event.phase === 'mounted')
          .map((event) => event.sentinel)
          .sort((a, b) => a.localeCompare(b)),
      ).toEqual(['payment-details-postpaid', 'payment-details-prepaid']);
      expect(
        providerEvents.filter((event) => event.phase === 'cleaned'),
      ).toEqual([
        {
          type: 'storybook-portal-provider',
          phase: 'cleaned',
          sentinel: 'payment-details-postpaid',
        },
        {
          type: 'storybook-portal-provider',
          phase: 'cleaned',
          sentinel: 'payment-details-prepaid',
        },
      ]);
      const accountEvents = await readAccountEvents();
      expect(
        accountEvents
          .filter((event) => event.phase === 'active')
          .sort((left, right) => left.sentinel.localeCompare(right.sentinel)),
      ).toEqual([
        {
          type: 'storybook-account-context',
          phase: 'active',
          sentinel: 'payment-details-postpaid',
          targetOrganisationName: 'payment-details-postpaid:active',
        },
        {
          type: 'storybook-account-context',
          phase: 'active',
          sentinel: 'payment-details-prepaid',
          targetOrganisationName: 'payment-details-prepaid:active',
        },
      ]);
      expect(
        accountEvents.filter((event) => event.phase === 'cleaned'),
      ).toEqual([
        {
          type: 'storybook-account-context',
          phase: 'cleaned',
          sentinel: 'payment-details-postpaid',
          targetOrganisationName: 'payment-details-postpaid:active',
        },
        {
          type: 'storybook-account-context',
          phase: 'cleaned',
          sentinel: 'payment-details-prepaid',
          targetOrganisationName: 'payment-details-prepaid:active',
        },
      ]);
      expect(
        await page.evaluate(() =>
          globalThis.sessionStorage.getItem('targetOrganisation'),
        ),
      ).toBe(sessionBefore);
      expect(storybookPageIssueMonitors.get(page)?.messages).toEqual([]);
      completed = true;
    } finally {
      docsIsolationResults.set(page, { completed });
      page.off('request', requestHandler);
      page.off('requestfailed', requestFailedHandler);
      page.off('response', responseHandler);
      page.off('console', consoleErrorHandler);
      // Keep any remaining frame cleanup inside the browser page, so the next
      // scenario starts without a provider/session owner from this probe.
      await page.evaluate(
        ([stepSelector, postpaidSelector]) => {
          for (const frame of document.querySelectorAll(
            `${stepSelector ?? ''}, ${postpaidSelector ?? ''}`,
          )) {
            frame.remove();
          }
        },
        [PAYMENT_DETAILS_STEP_FRAME, PAYMENT_DETAILS_POSTPAID_FRAME],
      );
      await expect(page.locator(PAYMENT_DETAILS_STEP_FRAME)).toHaveCount(0);
      await expect(page.locator(PAYMENT_DETAILS_POSTPAID_FRAME)).toHaveCount(0);
      await expectSessionSentinel(PAYMENT_DETAILS_PREPAID_SESSION_KEY, null);
      await expectSessionSentinel(PAYMENT_DETAILS_POSTPAID_SESSION_KEY, null);
      await expect
        .poll(async () => {
          const events = await readProviderEvents();
          const mounted = new Set(
            events
              .filter((event) => event.phase === 'mounted')
              .map((event) => event.sentinel),
          );
          events
            .filter((event) => event.phase === 'cleaned')
            .forEach((event) => mounted.delete(event.sentinel));
          return [...mounted].sort((a, b) => a.localeCompare(b));
        })
        .toEqual([]);
      await expect
        .poll(async () => {
          const events = await readAccountEvents();
          const active = new Set(
            events
              .filter((event) => event.phase === 'active')
              .map((event) => event.sentinel),
          );
          events
            .filter((event) => event.phase === 'cleaned')
            .forEach((event) => active.delete(event.sentinel));
          return [...active].sort((a, b) => a.localeCompare(b));
        })
        .toEqual([]);
    }
  },
);

Then('the generated Docs isolation probe should pass', ({ page }) => {
  expect(docsIsolationResults.get(page)).toEqual({ completed: true });
});

When('I open a representative component story', async ({ page }) => {
  await page.goto(`${STORYBOOK_BASE}/?path=/story/${REPRESENTATIVE_STORY_ID}`);

  await expect(page.getByRole('heading', { name: 'Addon panel' })).toBeVisible({
    timeout: 15_000,
  });
  // The manager chrome (Addon panel) is present before the preview bundle has
  // compiled. Warm the story: wait for the preview iframe to render real content
  // so the Code addon has a source to display.
  await expect(
    page.frameLocator('#storybook-preview-iframe').locator('#storybook-root'),
  ).not.toBeEmpty({
    timeout: STORY_RENDER_TIMEOUT_MS,
  });
});

When('I open the Documentation Style Guide', async ({ page }) => {
  await loadDocsIframe(page, STYLE_GUIDE_DOCS_ID);
});

When('I open the AutoSuggest documentation', async ({ page }) => {
  await loadDocsIframe(page, AUTOSUGGEST_DOCS_ID);
});

When('I open the AcceptQuote documentation', async ({ page }) => {
  await loadDocsIframe(page, ACCEPT_QUOTE_DOCS_ID);
});

Then(
  'the generated AcceptQuote Docs page should render independent request frames',
  async ({ page }) => {
    await expect(page.locator(PAYMENT_DETAILS_STEP_FRAME)).toHaveCount(1);
    await expect(page.locator(PAYMENT_DETAILS_POSTPAID_FRAME)).toHaveCount(1);
    await expect(
      page.frameLocator(PAYMENT_DETAILS_STEP_FRAME).locator('body'),
    ).toContainText('Prepayment required', {
      timeout: STORY_RENDER_TIMEOUT_MS,
    });
    await expect(
      page.frameLocator(PAYMENT_DETAILS_POSTPAID_FRAME).locator('body'),
    ).toContainText('Invoices must be paid within 30 days', {
      timeout: STORY_RENDER_TIMEOUT_MS,
    });
  },
);

When('I open the RouteLeavingGuard documentation', async ({ page }) => {
  await loadDocsIframe(page, ROUTE_LEAVING_GUARD_DOCS_ID);
});

When(
  'I load the Storybook story {string}',
  async ({ page }, storyId: string) => {
    await loadStoryIframe(page, storyId);
  },
);

Then('the Storybook manager should remain mounted', async ({ page }) => {
  await expect(page.locator('#storybook-preview-iframe')).toBeVisible({
    timeout: STORY_RENDER_TIMEOUT_MS,
  });
});

// ---------------------------------------------------------------------------
// Assertions — text content
// ---------------------------------------------------------------------------

Then(
  'the story iframe should contain {string}',
  async ({ page }, text: string) => {
    const root = storybookPreviewFrame(page).locator('#storybook-root');

    await expect(root).toContainText(text, { timeout: 10_000 });
  },
);

// ---------------------------------------------------------------------------
// Assertions — Storybook documentation architecture
// ---------------------------------------------------------------------------

Then('the component documentation page is visible', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Pill', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Presents a compact, colour-coded label', { exact: false }),
  ).toBeVisible();
});

Then('the component API documentation is visible', async ({ page }) => {
  const apiTable = page
    .getByRole('table')
    .filter({
      has: page.getByRole('columnheader', { name: 'Control', exact: true }),
    })
    .filter({ hasText: 'Workflow status' });

  await expect(apiTable).toBeVisible();
  await expect(apiTable).toContainText('status');
  await expect(apiTable).toContainText('className');
});

Then('the component stories are visible', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Stories' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Dashboard Statuses' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Quote Statuses' }),
  ).toBeVisible();
});

Then('a Storybook source example is available', async ({ page }) => {
  // Storybook renders the button label inside a portal-backed tooltip tree;
  // selecting the semantic button by its visible label avoids an expensive
  // accessible-name walk when the BDD suite runs fully parallel.
  await page.locator('button').filter({ hasText: 'Show code' }).first().click();

  await expect(visibleSource(page)).toContainText('StatusPill');
});

Then(
  'Storybook decorators are not included in the displayed source',
  async ({ page }) => {
    const source = visibleSource(page);

    await expect(source).not.toContainText('RouterProvider');
    await expect(source).not.toContainText('createMemoryRouter');
  },
);

Then('the Storybook Code Panel is available', async ({ page }) => {
  const codeTab = page.getByRole('tab', { name: 'Code' });

  await expect(codeTab).toBeVisible();

  await codeTab.click();

  await expect(codeTab).toHaveAttribute('aria-selected', 'true');
});

Then(
  'the Code Panel contains source for the current story',
  async ({ page }) => {
    const source = visibleSource(page);

    // The Code addon fills its <pre> asynchronously once the story module has
    // loaded; the default 5s expect timeout can lose that race on a cold bundle.
    await expect(source).toContainText('StatusPill', {
      timeout: STORY_RENDER_TIMEOUT_MS,
    });
    await expect(source).toContainText('DashboardItemStatus.QuoteAvailable', {
      timeout: STORY_RENDER_TIMEOUT_MS,
    });
  },
);

Then('the Style Guide is visible', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Style Guide' }),
  ).toBeVisible();
});

Then('its typography documentation is visible', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Typography' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Type Scale' })).toBeVisible();
});

Then('its colour documentation is visible', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Color System' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Color Usage Rules' }),
  ).toBeVisible();
});

Then('its Markdown table is rendered', async ({ page }) => {
  const typeScaleTable = page
    .getByRole('table')
    .filter({ hasText: '$h1-font-size' });

  await expect(typeScaleTable).toBeVisible();
  await expect(
    typeScaleTable.getByRole('columnheader', { name: 'Token' }),
  ).toBeVisible();
});

Then(
  /^Documentation (Getting Started|Component Documentation Guide|Style Guide) is available$/,
  async ({ page }, guideName: string) => {
    const guide = page.getByRole('link', { name: guideName, exact: true });

    await expect(guide).toBeVisible();
    await expect(guide).toHaveAttribute(
      'href',
      /documentation-.*--documentation/,
    );
  },
);

Then('the AutoSuggestContainer owner is visible', async ({ page }) => {
  await expect(
    page.getByText('AutoSuggestContainer', { exact: true }).last(),
  ).toBeVisible();
});

Then(
  'the Loading story is listed with its rendered owner',
  async ({ page }) => {
    await expect(
      page
        .locator('#loading-autosuggestcontainer')
        .getByText('Loading (AutoSuggestContainer)', { exact: true }),
    ).toBeVisible();
  },
);

Then(
  'the AcceptQuote owner and four peer APIs are visible',
  async ({ page }) => {
    const docs = page.locator('#storybook-docs');

    await expect(
      page.getByRole('heading', { name: 'AcceptQuote', exact: true }),
    ).toBeVisible();

    await Promise.all(
      [
        'PaymentDetails',
        'DeliveryAndReturn',
        'QuotationSummary',
        'SummaryAndAccept',
      ].map((apiName) =>
        expect(docs.getByText(apiName, { exact: true }).last()).toBeVisible(),
      ),
    );
  },
);

Then(
  'the RouteLeavingGuard type and default cells are visible',
  async ({ page }) => {
    const apiTable = page
      .getByRole('table')
      .filter({
        has: page.getByRole('columnheader', { name: 'Control', exact: true }),
      })
      .filter({ hasText: 'when' });

    await expect(apiTable).toContainText('boolean');
    await expect(apiTable).toContainText('false');
    await expect(apiTable).toContainText("'Unsaved changes'");
    await expect(apiTable).toContainText("'Discard changes'");
    await expect(
      page
        .locator('#custom-title-body-and-button-labels')
        .getByText('Custom title, body, and button labels', { exact: true }),
    ).toBeVisible();
  },
);

Then(
  'the Storybook portal should contain {string}',
  async ({ page }, text: string) => {
    const portalContent = storybookPreviewFrame(page).locator(
      '.modal, [role="dialog"], [role="alert"], [id^="notif-"]',
    );

    await expect(portalContent.filter({ hasText: text }).first()).toBeVisible({
      timeout: 10_000,
    });
  },
);

// ---------------------------------------------------------------------------
// Assertions — buttons
// ---------------------------------------------------------------------------

Then(
  'the story iframe should have a button with accessible name {string}',
  async ({ page }, name: string) => {
    const btn = storybookPreviewFrame(page).getByRole('button', { name });

    await expect(btn.first()).toBeVisible({ timeout: 10_000 });
  },
);

Then(
  'the story iframe should have a link with accessible name {string}',
  async ({ page }, name: string) => {
    const link = storybookPreviewFrame(page).getByRole('link', { name });

    await expect(link.first()).toBeVisible({ timeout: 10_000 });
  },
);

Then(
  'the story iframe should have a dialog with accessible name {string}',
  async ({ page }, name: string) => {
    const dialog = storybookPreviewFrame(page).getByRole('dialog', { name });

    await expect(dialog.first()).toBeVisible({ timeout: 10_000 });
  },
);

Then(
  'the selected Storybook radio should be {string}',
  async ({ page }, name: string) => {
    await expect(
      storybookPreviewFrame(page).getByRole('radio', { name }),
    ).toBeChecked({
      timeout: 10_000,
    });
  },
);

Then(
  'the Storybook story should report {int} organisation lookup',
  async ({ page }, expectedCount: number) => {
    await expect
      .poll(
        () =>
          page
            .frameLocator('#storybook-preview-iframe')
            .locator('body')
            .evaluate(
              (element) =>
                (element as HTMLElement).dataset[
                  'storybookOrganisationLookupCount'
                ],
            ),
        { timeout: 10_000 },
      )
      .toBe(String(expectedCount));
  },
);

Then(
  'the Storybook dialog named {string} should not be present',
  async ({ page }, name: string) => {
    await expect(
      storybookPreviewFrame(page).getByRole('dialog', { name }),
    ).toHaveCount(0);
  },
);

Then(
  'the story iframe should have a disabled button with accessible name {string}',
  async ({ page }, name: string) => {
    const btn = storybookPreviewFrame(page).getByRole('button', { name });

    await expect(btn.first()).toBeDisabled({ timeout: 10_000 });
  },
);

// ---------------------------------------------------------------------------
// Assertions — landmarks
// ---------------------------------------------------------------------------

Then('the story iframe should have a navigation landmark', async ({ page }) => {
  const nav = storybookPreviewFrame(page).getByRole('navigation');

  await expect(nav.first()).toBeVisible({ timeout: 10_000 });
});

Then(
  'the story iframe should have a contentinfo landmark',
  async ({ page }) => {
    const footer = storybookPreviewFrame(page).getByRole('contentinfo');

    await expect(footer.first()).toBeVisible({ timeout: 10_000 });
  },
);

Then(
  'the story iframe should have a content info landmark',
  async ({ page }) => {
    const footer = storybookPreviewFrame(page).getByRole('contentinfo');

    await expect(footer.first()).toBeVisible({ timeout: 10_000 });
  },
);

// ---------------------------------------------------------------------------
// Assertions — form elements
// ---------------------------------------------------------------------------

Then(
  'the story iframe should have a text input for searching',
  async ({ page }) => {
    // SearchFilter uses a search input or text input with a placeholder
    const searchInput = storybookPreviewFrame(page).locator(
      'input[type="search"], input[type="text"]',
    );

    await expect(searchInput.first()).toBeVisible({ timeout: 10_000 });
  },
);

// ---------------------------------------------------------------------------
// Assertions — pill / status badges
// ---------------------------------------------------------------------------

Then(
  'the story iframe should contain text matching a dashboard status label',
  async ({ page }) => {
    // The pill renders status text; assert at least one span/badge is visible
    const root = storybookPreviewFrame(page).locator('#storybook-root');

    await expect(root).toBeVisible({ timeout: 10_000 });

    // At least one pill should be rendered
    const pills = root.locator(
      'span, .badge, [class*="pill"], [class*="status"]',
    );

    await expect(pills.first()).toBeVisible({ timeout: 10_000 });
  },
);

Then(
  'the story iframe should contain text matching a quote status label',
  async ({ page }) => {
    const root = storybookPreviewFrame(page).locator('#storybook-root');

    await expect(root).toBeVisible({ timeout: 10_000 });

    const pills = root.locator(
      'span, .badge, [class*="pill"], [class*="status"]',
    );

    await expect(pills.first()).toBeVisible({ timeout: 10_000 });
  },
);

// ---------------------------------------------------------------------------
// Assertions — pagination
// ---------------------------------------------------------------------------

Then(
  'the story iframe should not show pagination controls',
  async ({ page }) => {
    await expect(
      storybookPreviewFrame(page).getByRole('navigation', {
        name: /pagination/i,
      }),
    ).toHaveCount(0);
    await expect(
      storybookPreviewFrame(page).getByRole('button', {
        name: /next page|previous page/i,
      }),
    ).toHaveCount(0);
  },
);

// ---------------------------------------------------------------------------
// Assertions — generic visibility
// ---------------------------------------------------------------------------

Then('the story iframe should be visible', async ({ page }) => {
  const preview = storybookPreviewFrame(page);
  await expect(preview.locator('#storybook-root')).toBeVisible({
    timeout: 10_000,
  });
  await expect(
    preview.getByText('Something went wrong', { exact: false }),
  ).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

When(
  'I click the button with accessible name {string} in the story iframe',
  async ({ page }, name: string) => {
    const btn = storybookPreviewFrame(page).getByRole('button', { name });
    await btn.first().click();
  },
);

When(
  'I click the link with accessible name {string} in the story iframe',
  async ({ page }, name: string) => {
    const link = storybookPreviewFrame(page).getByRole('link', { name });
    await link.first().click();
  },
);

Then('the story should not throw a JavaScript error', async ({ page }) => {
  // Check that #storybook-root is still present (not replaced by error UI)
  const root = storybookPreviewFrame(page).locator('#storybook-root');

  await expect(root).toBeVisible({ timeout: 5_000 });
});

Then(
  'the Storybook sequence should have no late unmount updates',
  async ({ page }) => {
    const monitor = storybookPageIssueMonitors.get(page);
    if (monitor === undefined) {
      throw new Error('Storybook page issue monitor was not initialized');
    }

    try {
      await expect(storybookPreviewFrame(page).locator('body')).toHaveClass(
        /\bsb-show-main\b/u,
        {
          timeout: STORY_RENDER_TIMEOUT_MS,
        },
      );
      expect(monitor.messages).toEqual([]);
    } finally {
      cleanupStorybookPageIssueMonitor(page);
    }
  },
);
