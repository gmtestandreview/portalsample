import {
  expect,
  type ConsoleMessage,
  type Page,
  type Request,
  type Response as PlaywrightResponse,
} from '@playwright/test';
import {
  STORYBOOK_BASE,
  STORY_RENDER_TIMEOUT_MS,
  loadDocsIframe,
} from './storybookHelpers';

export const ACCEPT_QUOTE_DOCS_ID = 'routes-acceptquote--documentation';

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

export const docsIsolationResults = new WeakMap<Page, { completed: boolean }>();
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
const PREPAID = 'payment-details-prepaid';
const POSTPAID = 'payment-details-postpaid';
const BOTH_SENTINELS = [POSTPAID, PREPAID] as const;
const PREPAID_STORY = 'routes-acceptquote--payment-details-step';
const POSTPAID_STORY = 'routes-acceptquote--payment-details-postpaid';
const PREPAID_SESSION_ACTIVE = `${PAYMENT_DETAILS_PREPAID_SESSION_KEY}:active`;
const POSTPAID_SESSION_ACTIVE = `${PAYMENT_DETAILS_POSTPAID_SESSION_KEY}:active`;

interface LifecycleEvent {
  phase: string;
  sentinel: string;
}

const providerEvent = (
  phase: ProviderLifecycleEvent['phase'],
  sentinel: string,
): ProviderLifecycleEvent => ({
  type: 'storybook-portal-provider',
  phase,
  sentinel,
});

const accountEvent = (
  phase: AccountContextLifecycleEvent['phase'],
  sentinel: string,
): AccountContextLifecycleEvent => ({
  type: 'storybook-account-context',
  phase,
  sentinel,
  targetOrganisationName: `${sentinel}:active`,
});

// Sentinels opened (`openPhase`) and not yet closed (`closePhase`).
const unclosedSentinels = (
  events: LifecycleEvent[],
  openPhase: string,
  closePhase: string,
) => {
  const open = new Set(
    events.filter((e) => e.phase === openPhase).map((e) => e.sentinel),
  );
  for (const event of events) {
    if (event.phase === closePhase) {
      open.delete(event.sentinel);
    }
  }
  return [...open].sort((a, b) => a.localeCompare(b));
};

const expectLifecyclePair = async <T extends LifecycleEvent>(
  readEvents: () => Promise<T[]>,
  phase: T['phase'],
  expectedSentinels: readonly string[],
) => {
  await expect
    .poll(
      async () => {
        const events = await readEvents();
        return events
          .filter((event) => event.phase === phase)
          .map((event) => event.sentinel)
          .sort((a, b) => a.localeCompare(b));
      },
      { timeout: STORY_RENDER_TIMEOUT_MS },
    )
    .toEqual(expectedSentinels);
};

const assertLifecycleEventsContain = <T>(events: T[], expectedEvents: T[]) => {
  expect(events).toEqual(expect.arrayContaining(expectedEvents));
};

const expectLifecycleEventsEventually = async <T>(
  readEvents: () => Promise<T[]>,
  expectedEvents: T[],
) => {
  await expect
    .poll(readEvents, { timeout: STORY_RENDER_TIMEOUT_MS })
    .toEqual(expect.arrayContaining(expectedEvents));
};

export const expectAcceptQuotePaymentFrames = async (page: Page) => {
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
};

const createProbe = () => {
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
    if (message.type() === 'error' && MSW_FAILURE_SIGNAL.test(message.text())) {
      probe.unmatchedRequests.push(message.text());
    }
  };
  return {
    probe,
    requestHandler,
    requestFailedHandler,
    responseHandler,
    consoleErrorHandler,
  };
};

const createReaders = (page: Page) => {
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
    await expect
      .poll(() => readSessionSentinel(key), {
        timeout: STORY_RENDER_TIMEOUT_MS,
      })
      .toBe(expected);
  };
  const expectSessionSentinels = async (
    prepaid: string | null,
    postpaid: string | null,
  ) => {
    await expectSessionSentinel(PAYMENT_DETAILS_PREPAID_SESSION_KEY, prepaid);
    await expectSessionSentinel(PAYMENT_DETAILS_POSTPAID_SESSION_KEY, postpaid);
  };
  return {
    readProviderEvents,
    readAccountEvents,
    readSessionSentinel,
    expectSessionSentinels,
  };
};

const createFrameActions = (page: Page) => {
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
  const expectAccountTarget = (storyId: string, sentinel: string) =>
    expect
      .poll(() => readAccountTargetOrganisation(storyId))
      .toBe(`${sentinel}:active`);
  const removeFrame = async (selector: string) => {
    await page
      .locator(selector)
      .first()
      .evaluate((element) => {
        element.remove();
      });
    await expect(page.locator(selector)).toHaveCount(0);
  };
  const removeAndExpectRemainingPaymentDetailsFrame = async (
    selector: string,
    remainingSelector: string,
  ) => {
    await removeFrame(selector);
    await expect(page.locator(remainingSelector)).toHaveCount(1);
  };
  const removeAndExpectNoPaymentDetailsFrames = async (selector: string) => {
    await removeFrame(selector);
    await expect
      .poll(
        () =>
          page
            .frames()
            .filter((frame) => frame.url().includes('payment-details-')).length,
      )
      .toBe(0);
  };

  return {
    fetchPaymentDetails,
    expectAccountTarget,
    removeAndExpectRemainingPaymentDetailsFrame,
    removeAndExpectNoPaymentDetailsFrames,
  };
};

const createContext = (
  page: Page,
  pageIssueMessages: () => string[] | undefined,
) => ({
  page,
  pageIssueMessages,
  ...createProbe(),
  ...createReaders(page),
  ...createFrameActions(page),
});

type DocsContext = ReturnType<typeof createContext>;

const expectBothFramesActive = async ({
  readProviderEvents,
  readAccountEvents,
}: DocsContext) => {
  await expectLifecyclePair(readProviderEvents, 'mounted', BOTH_SENTINELS);
  await expectLifecyclePair(readAccountEvents, 'active', BOTH_SENTINELS);
};

const loadInitialPaymentFrames = async (context: DocsContext) => {
  const {
    page,
    readSessionSentinel,
    expectAccountTarget,
    expectSessionSentinels,
  } = context;
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
  await expectAcceptQuotePaymentFrames(page);
  await expectBothFramesActive(context);
  await expectAccountTarget(PREPAID_STORY, PREPAID);
  await expectAccountTarget(POSTPAID_STORY, POSTPAID);
  await expectSessionSentinels(PREPAID_SESSION_ACTIVE, POSTPAID_SESSION_ACTIVE);
  return page.evaluate(() =>
    globalThis.sessionStorage.getItem('targetOrganisation'),
  );
};

const assertPostPrepaidRemoval = async (context: DocsContext) => {
  const {
    probe,
    removeAndExpectRemainingPaymentDetailsFrame,
    removeAndExpectNoPaymentDetailsFrames,
    readProviderEvents,
    readAccountEvents,
    expectAccountTarget,
    expectSessionSentinels,
    fetchPaymentDetails,
  } = context;
  expect(probe.endpointRequests).toHaveLength(2);

  await removeAndExpectRemainingPaymentDetailsFrame(
    PAYMENT_DETAILS_STEP_FRAME,
    PAYMENT_DETAILS_POSTPAID_FRAME,
  );
  await expectLifecycleEventsEventually(readProviderEvents, [
    providerEvent('cleaned', PREPAID),
    providerEvent('mounted', POSTPAID),
  ]);
  expect(await readProviderEvents()).not.toEqual(
    expect.arrayContaining([providerEvent('cleaned', POSTPAID)]),
  );
  await expectLifecycleEventsEventually(readAccountEvents, [
    accountEvent('cleaned', PREPAID),
  ]);
  await expectAccountTarget(POSTPAID_STORY, POSTPAID);
  await expectSessionSentinels(null, POSTPAID_SESSION_ACTIVE);
  expect(await fetchPaymentDetails(POSTPAID_STORY)).toEqual({
    status: 200,
    body: {
      acceptQuotePreInfo: {
        paymentTerms: 'Invoice',
        quotationIdNum: 'Q-2024-000456',
      },
    },
  });

  await removeAndExpectNoPaymentDetailsFrames(PAYMENT_DETAILS_POSTPAID_FRAME);
  assertLifecycleEventsContain(await readProviderEvents(), [
    providerEvent('cleaned', POSTPAID),
  ]);
  await expectLifecycleEventsEventually(readAccountEvents, [
    accountEvent('cleaned', POSTPAID),
  ]);
  await expectSessionSentinels(null, null);
};

const assertReversedPaymentFrames = async (context: DocsContext) => {
  const {
    page,
    probe,
    removeAndExpectRemainingPaymentDetailsFrame,
    readProviderEvents,
    readAccountEvents,
    expectAccountTarget,
    expectSessionSentinels,
    fetchPaymentDetails,
  } = context;
  await page.goto(
    `${STORYBOOK_BASE}/iframe.html?id=${ACCEPT_QUOTE_DOCS_ID}&viewMode=docs`,
  );
  await expectAcceptQuotePaymentFrames(page);
  await expectBothFramesActive(context);
  await expectSessionSentinels(PREPAID_SESSION_ACTIVE, POSTPAID_SESSION_ACTIVE);
  // Two initial requests from the first A/B pair, one explicit B request
  // after A cleanup, then two initial requests from the reversed pair.
  expect(probe.endpointRequests).toHaveLength(5);

  await removeAndExpectRemainingPaymentDetailsFrame(
    PAYMENT_DETAILS_POSTPAID_FRAME,
    PAYMENT_DETAILS_STEP_FRAME,
  );
  await expectLifecycleEventsEventually(readProviderEvents, [
    providerEvent('cleaned', POSTPAID),
    providerEvent('mounted', PREPAID),
  ]);
  expect(await readProviderEvents()).not.toEqual(
    expect.arrayContaining([providerEvent('cleaned', PREPAID)]),
  );
  await expectLifecycleEventsEventually(readAccountEvents, [
    accountEvent('cleaned', POSTPAID),
    accountEvent('active', PREPAID),
  ]);
  await expectAccountTarget(PREPAID_STORY, PREPAID);
  await expectSessionSentinels(PREPAID_SESSION_ACTIVE, null);
  expect(await fetchPaymentDetails(PREPAID_STORY)).toEqual({
    status: 200,
    body: {
      acceptQuotePreInfo: {
        paymentTerms: 'Prepaid',
        quotationIdNum: 'Q-2024-000456',
      },
    },
  });
};

const assertPostPostpaidRemoval = async (context: DocsContext) => {
  const {
    removeAndExpectNoPaymentDetailsFrames,
    readProviderEvents,
    readAccountEvents,
    expectSessionSentinels,
  } = context;
  await removeAndExpectNoPaymentDetailsFrames(PAYMENT_DETAILS_STEP_FRAME);
  assertLifecycleEventsContain(await readProviderEvents(), [
    providerEvent('cleaned', PREPAID),
  ]);
  await expectLifecycleEventsEventually(readAccountEvents, [
    accountEvent('cleaned', PREPAID),
  ]);
  await expectSessionSentinels(null, null);
};

const assertFinalIsolation = async (
  context: DocsContext,
  sessionBefore: string | null,
) => {
  const {
    page,
    probe,
    readProviderEvents,
    readAccountEvents,
    pageIssueMessages,
  } = context;
  expect(probe.endpointRequests).toHaveLength(6);
  expect(probe.mockedResponses).toHaveLength(6);
  expect(probe.mockedResponses.filter((name) => name === PREPAID)).toHaveLength(
    3,
  );
  expect(
    probe.mockedResponses.filter((name) => name === POSTPAID),
  ).toHaveLength(3);
  expect(probe.liveSends).toEqual([]);
  expect(probe.unmatchedRequests).toEqual([]);
  expect(probe.failedRequests).toEqual([]);
  const providerEvents = await readProviderEvents();
  expect(
    [
      ...new Set(
        providerEvents
          .filter((event) => event.phase === 'mounted')
          .map((event) => event.sentinel),
      ),
    ].sort((a, b) => a.localeCompare(b)),
  ).toEqual([POSTPAID, PREPAID]);
  expect(providerEvents.filter((event) => event.phase === 'cleaned')).toEqual([
    providerEvent('cleaned', POSTPAID),
    providerEvent('cleaned', PREPAID),
  ]);
  const accountEvents = await readAccountEvents();
  expect(
    [
      ...new Map(
        accountEvents
          .filter((event) => event.phase === 'active')
          .map((event) => [event.sentinel, event]),
      ).values(),
    ].sort((left, right) => left.sentinel.localeCompare(right.sentinel)),
  ).toEqual([
    accountEvent('active', POSTPAID),
    accountEvent('active', PREPAID),
  ]);
  expect(accountEvents.filter((event) => event.phase === 'cleaned')).toEqual([
    accountEvent('cleaned', POSTPAID),
    accountEvent('cleaned', PREPAID),
  ]);
  expect(
    await page.evaluate(() =>
      globalThis.sessionStorage.getItem('targetOrganisation'),
    ),
  ).toBe(sessionBefore);
  expect(pageIssueMessages()).toEqual([]);
};

const cleanupIsolation = async (context: DocsContext, completed: boolean) => {
  const {
    page,
    requestHandler,
    requestFailedHandler,
    responseHandler,
    consoleErrorHandler,
    expectSessionSentinels,
    readProviderEvents,
    readAccountEvents,
  } = context;
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
  await expectSessionSentinels(null, null);
  await expect
    .poll(async () =>
      unclosedSentinels(await readProviderEvents(), 'mounted', 'cleaned'),
    )
    .toEqual([]);
  await expect
    .poll(async () =>
      unclosedSentinels(await readAccountEvents(), 'active', 'cleaned'),
    )
    .toEqual([]);
};

export const runDocsIsolationProbe = async (
  page: Page,
  pageIssueMessages: () => string[] | undefined,
) => {
  const context = createContext(page, pageIssueMessages);
  const {
    requestHandler,
    requestFailedHandler,
    responseHandler,
    consoleErrorHandler,
  } = context;
  page.on('request', requestHandler);
  page.on('requestfailed', requestFailedHandler);
  page.on('response', responseHandler);
  page.on('console', consoleErrorHandler);

  let completed = false;
  try {
    const sessionBefore = await loadInitialPaymentFrames(context);
    await assertPostPrepaidRemoval(context);
    await assertReversedPaymentFrames(context);
    await assertPostPostpaidRemoval(context);
    await assertFinalIsolation(context, sessionBefore);
    completed = true;
  } finally {
    await cleanupIsolation(context, completed);
  }
};
