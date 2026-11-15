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

interface LifecycleEvent {
  phase: string;
  sentinel: string;
}

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
  return {
    readProviderEvents,
    readAccountEvents,
    readSessionSentinel,
    expectSessionSentinel,
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
    readAccountTargetOrganisation,
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

const loadInitialPaymentFrames = async (context: DocsContext) => {
  const {
    page,
    readSessionSentinel,
    readProviderEvents,
    readAccountEvents,
    readAccountTargetOrganisation,
    expectSessionSentinel,
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
  await expectLifecyclePair(readProviderEvents, 'mounted', [
    'payment-details-postpaid',
    'payment-details-prepaid',
  ]);
  await expectLifecyclePair(readAccountEvents, 'active', [
    'payment-details-postpaid',
    'payment-details-prepaid',
  ]);
  await expect
    .poll(() =>
      readAccountTargetOrganisation('routes-acceptquote--payment-details-step'),
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
  return sessionBefore;
};

const assertPostPrepaidRemoval = async (context: DocsContext) => {
  const {
    probe,
    removeAndExpectRemainingPaymentDetailsFrame,
    removeAndExpectNoPaymentDetailsFrames,
    readProviderEvents,
    readAccountEvents,
    readAccountTargetOrganisation,
    expectSessionSentinel,
    fetchPaymentDetails,
  } = context;
  expect(probe.endpointRequests).toHaveLength(2);

  await removeAndExpectRemainingPaymentDetailsFrame(
    PAYMENT_DETAILS_STEP_FRAME,
    PAYMENT_DETAILS_POSTPAID_FRAME,
  );
  await expectLifecycleEventsEventually(readProviderEvents, [
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
  ]);
  expect(await readProviderEvents()).not.toEqual(
    expect.arrayContaining([
      {
        type: 'storybook-portal-provider',
        phase: 'cleaned',
        sentinel: 'payment-details-postpaid',
      },
    ]),
  );
  await expectLifecycleEventsEventually(readAccountEvents, [
    {
      type: 'storybook-account-context',
      phase: 'cleaned',
      sentinel: 'payment-details-prepaid',
      targetOrganisationName: 'payment-details-prepaid:active',
    },
  ]);
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

  await removeAndExpectNoPaymentDetailsFrames(PAYMENT_DETAILS_POSTPAID_FRAME);
  assertLifecycleEventsContain(await readProviderEvents(), [
    {
      type: 'storybook-portal-provider',
      phase: 'cleaned',
      sentinel: 'payment-details-postpaid',
    },
  ]);
  await expectLifecycleEventsEventually(readAccountEvents, [
    {
      type: 'storybook-account-context',
      phase: 'cleaned',
      sentinel: 'payment-details-postpaid',
      targetOrganisationName: 'payment-details-postpaid:active',
    },
  ]);
  await expectSessionSentinel(PAYMENT_DETAILS_POSTPAID_SESSION_KEY, null);
  await expectSessionSentinel(PAYMENT_DETAILS_PREPAID_SESSION_KEY, null);
};

const assertReversedPaymentFrames = async (context: DocsContext) => {
  const {
    page,
    probe,
    removeAndExpectRemainingPaymentDetailsFrame,
    readProviderEvents,
    readAccountEvents,
    readAccountTargetOrganisation,
    expectSessionSentinel,
    fetchPaymentDetails,
  } = context;
  await page.goto(
    `${STORYBOOK_BASE}/iframe.html?id=${ACCEPT_QUOTE_DOCS_ID}&viewMode=docs`,
  );
  await expectAcceptQuotePaymentFrames(page);
  await expectLifecyclePair(readProviderEvents, 'mounted', [
    'payment-details-postpaid',
    'payment-details-prepaid',
  ]);
  await expectLifecyclePair(readAccountEvents, 'active', [
    'payment-details-postpaid',
    'payment-details-prepaid',
  ]);
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

  await removeAndExpectRemainingPaymentDetailsFrame(
    PAYMENT_DETAILS_POSTPAID_FRAME,
    PAYMENT_DETAILS_STEP_FRAME,
  );
  await expectLifecycleEventsEventually(readProviderEvents, [
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
  ]);
  expect(await readProviderEvents()).not.toEqual(
    expect.arrayContaining([
      {
        type: 'storybook-portal-provider',
        phase: 'cleaned',
        sentinel: 'payment-details-prepaid',
      },
    ]),
  );
  await expectLifecycleEventsEventually(readAccountEvents, [
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
  ]);
  await expect
    .poll(() =>
      readAccountTargetOrganisation('routes-acceptquote--payment-details-step'),
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
};

const assertPostPostpaidRemoval = async (context: DocsContext) => {
  const {
    removeAndExpectNoPaymentDetailsFrames,
    readProviderEvents,
    readAccountEvents,
    expectSessionSentinel,
  } = context;
  await removeAndExpectNoPaymentDetailsFrames(PAYMENT_DETAILS_STEP_FRAME);
  assertLifecycleEventsContain(await readProviderEvents(), [
    {
      type: 'storybook-portal-provider',
      phase: 'cleaned',
      sentinel: 'payment-details-prepaid',
    },
  ]);
  await expectLifecycleEventsEventually(readAccountEvents, [
    {
      type: 'storybook-account-context',
      phase: 'cleaned',
      sentinel: 'payment-details-prepaid',
      targetOrganisationName: 'payment-details-prepaid:active',
    },
  ]);
  await expectSessionSentinel(PAYMENT_DETAILS_PREPAID_SESSION_KEY, null);
  await expectSessionSentinel(PAYMENT_DETAILS_POSTPAID_SESSION_KEY, null);
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
  expect(
    probe.mockedResponses.filter((name) => name === 'payment-details-prepaid'),
  ).toHaveLength(3);
  expect(
    probe.mockedResponses.filter((name) => name === 'payment-details-postpaid'),
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
  ).toEqual(['payment-details-postpaid', 'payment-details-prepaid']);
  expect(providerEvents.filter((event) => event.phase === 'cleaned')).toEqual([
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
    [
      ...new Map(
        accountEvents
          .filter((event) => event.phase === 'active')
          .map((event) => [event.sentinel, event]),
      ).values(),
    ].sort((left, right) => left.sentinel.localeCompare(right.sentinel)),
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
  expect(accountEvents.filter((event) => event.phase === 'cleaned')).toEqual([
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
  expect(pageIssueMessages()).toEqual([]);
};

const cleanupIsolation = async (context: DocsContext, completed: boolean) => {
  const {
    page,
    requestHandler,
    requestFailedHandler,
    responseHandler,
    consoleErrorHandler,
    expectSessionSentinel,
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
