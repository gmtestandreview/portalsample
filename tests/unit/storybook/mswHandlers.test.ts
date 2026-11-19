import { globSync } from 'node:fs';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { CRMLookupTypes } from '../../../ClientApp/src/api/web-api-client';
import { serviceResponses } from '../../../ClientApp/src/storybook/storybookFixtures';
import {
  lookupResponsesByType,
  mswHandlers,
} from '../../../.storybook/msw-handlers';
import { readTextFileSync } from '../../helpers/safeTestFilesystem';

const server = setupServer(...mswHandlers);

const apiUrl = (path: string) => new URL(path, globalThis.location.origin);
const expectAnyString = (): unknown => expect.any(String);
const expectObjectContaining = (value: Record<string, unknown>): unknown =>
  expect.objectContaining(value);

interface ApiRequest {
  method: 'GET' | 'POST';
  path: string;
  body?: string;
}

const assertRouteCoveragePayload = (request: ApiRequest, payload: unknown) => {
  if (request.path.includes('get-quote-request-details-byrefid')) {
    expect(payload).toStrictEqual(
      expectObjectContaining({ crmQuoteRequestId: expectAnyString() }),
    );
  } else if (request.path.includes('/api/forms/accounts/')) {
    expect(payload).toStrictEqual(
      expectObjectContaining({
        id: 1,
        stepValues: expectObjectContaining({
          status: 'NotStarted',
        }),
      }),
    );
  } else if (request.path.includes('/api/contact/usercontact')) {
    expect(payload).toStrictEqual(
      expectObjectContaining({
        contact: expectObjectContaining({ email: expectAnyString() }),
        formStepStatus: 'NotStarted',
      }),
    );
  } else if (request.path === '/api/application') {
    const applicationPayload = JSON.parse(request.body ?? '{}') as {
      applicationType?: string;
    };

    expect(payload).toStrictEqual(
      expectObjectContaining({
        referenceId: expectAnyString(),
        applicationType: applicationPayload.applicationType,
      }),
    );
  }
};

/**
 * Derived from application source, not from a run log. The previous handler set
 * mocked exactly the two lookup types that appeared in one captured log, while
 * ClientApp/src/routes/ta/** requests two more. Enumerating the call sites is
 * what makes this test able to fail on the next unmocked lookup.
 */
const requestedLookupTypes = [
  ...new Set(
    globSync('ClientApp/src/**/*.{ts,tsx}')
      .filter((file) => !file.includes('web-api-client'))
      .flatMap((file) =>
        [
          ...readTextFileSync(file, process.cwd()).matchAll(
            /getLookup\(\s*CRMLookupTypes\.(\w+)/g,
          ),
        ].map((match) => match[1]),
      ),
  ),
];

const docsIsolationStoryFiles = [
  'ClientApp/src/components/Inputs/AddressLookup/AddressLookup.stories.tsx',
  'ClientApp/src/components/modals/Modals.stories.tsx',
  'ClientApp/src/routes/acceptQuote/AcceptQuote.stories.tsx',
  'ClientApp/src/routes/acceptQuote/create/AcceptQuoteCreate.stories.tsx',
  'ClientApp/src/routes/account/addBranch/AddBranch.stories.tsx',
  'ClientApp/src/routes/account/create/CreateAccount.stories.tsx',
  'ClientApp/src/routes/account/update/UpdateAccount.stories.tsx',
  'ClientApp/src/routes/contact/create/CreateContact.stories.tsx',
  'ClientApp/src/routes/contact/update/UpdateContact.stories.tsx',
  'ClientApp/src/routes/requestForQuote/copy/RequestForQuoteCopy.stories.tsx',
  'ClientApp/src/routes/requestForQuote/create/RequestForQuoteCreate.stories.tsx',
  'ClientApp/src/routes/ta/create/TypeApprovalCreate.stories.tsx',
  'ClientApp/src/routes/acceptQuote/AcceptQuoteShell.stories.tsx',
  'ClientApp/src/routes/requestForQuote/RequestForQuoteShell.stories.tsx',
  'ClientApp/src/routes/ta/TypeApprovalShell.stories.tsx',
  'ClientApp/src/routes/quotation/QuotationShell.stories.tsx',
  'ClientApp/src/routes/measurementReport/MeasurementReportShell.stories.tsx',
] as const;

const docsIsolationStoryBlock =
  /export const \w+\s*=\s*meta\.story\([\s\S]*?(?=\nexport const |$)/g;

const storyBlocksWithRequests = (source: string) => {
  const firstStoryIndex = source.indexOf('\nexport const ');
  const metaSource =
    firstStoryIndex === -1 ? source : source.slice(0, firstStoryIndex);
  const metaHasRequestHandler =
    /beforeEach\([\s\S]*?(?:msw\.use|fetch\s*:)/u.test(metaSource);

  return [...source.matchAll(docsIsolationStoryBlock)].filter(
    ([block]) => metaHasRequestHandler || /(?:msw\.use|fetch\s*:)/u.test(block),
  );
};

describe('storybook MSW handlers', () => {
  // MSW server lifecycle spans the suite.
  beforeAll(() => {
    server.listen({ onUnhandledFrame: 'error' });
  });

  // each test starts with clean handlers.
  afterEach(() => {
    server.resetHandlers();
  });

  // close the shared MSW server after the suite.
  afterAll(() => {
    server.close();
  });

  it('finds the lookup call sites it is supposed to cover', () => {
    expect.hasAssertions();
    // Guards the enumeration itself: a regex that matched nothing would make
    // every case below vacuous.
    expect(requestedLookupTypes.length).toBeGreaterThanOrEqual(4);
    expect(requestedLookupTypes).toContain('PAPortalCategory');
  });

  it.each(docsIsolationStoryFiles)(
    'keeps request-producing Docs stories in their own frame: %s',
    (file) => {
      expect.hasAssertions();

      const source = readTextFileSync(file, process.cwd());
      const requestStories = storyBlocksWithRequests(source);

      expect(requestStories).not.toHaveLength(0);

      for (const [storyBlock] of requestStories) {
        expect(storyBlock).toMatch(
          /docs:\s*\{\s*story:\s*\{\s*inline:\s*false\s*\}/u,
        );
      }
    },
  );

  it('gives overlapping AcceptQuote Docs stories distinct session sentinels', () => {
    expect.hasAssertions();

    const source = readTextFileSync(
      'ClientApp/src/routes/acceptQuote/AcceptQuote.stories.tsx',
      process.cwd(),
    );
    const sessionSentinels = [
      ...source.matchAll(/sessionStorageSentinel:\s*'([^']+)'/gu),
    ].map((match) => match[1]);

    expect(sessionSentinels).toStrictEqual([
      'storybook:accept-quote:payment-details:prepaid',
      'storybook:accept-quote:payment-details:postpaid',
    ]);
    expect(new Set(sessionSentinels).size).toBe(sessionSentinels.length);
  });

  it('includes AcceptQuote stories inheriting the meta request handler', () => {
    expect.hasAssertions();

    const source = readTextFileSync(
      'ClientApp/src/routes/acceptQuote/AcceptQuote.stories.tsx',
      process.cwd(),
    );
    const requestStories = storyBlocksWithRequests(source).map(
      ([block]) => block,
    );

    expect(
      requestStories.some((block) =>
        /export const PaymentDetailsStep\s*=\s*meta\.story/u.test(block),
      ),
    ).toBe(true);
    expect(
      requestStories.some((block) =>
        /export const PaymentDetailsPostpaid\s*=\s*meta\.story/u.test(block),
      ),
    ).toBe(true);
  });

  it('returns the shared services fixture', async () => {
    expect.hasAssertions();

    const response = await fetch(apiUrl('/api/lookup/services'));

    expect(response.ok).toBe(true);
    await expect(response.json()).resolves.toStrictEqual(serviceResponses);
  });

  it('answers the route-coverage API requests', async () => {
    expect.hasAssertions();

    const requests: ApiRequest[] = [
      {
        method: 'GET',
        path: '/api/quote/get-quote-request-details-byrefid?ApplicationType=QuoteRequest',
      },
      {
        method: 'GET',
        path: '/api/quote/get-quote-request-details-byrefid?ApplicationType=QuoteAccept',
      },
      {
        method: 'GET',
        path: '/api/forms/accounts/branch',
      },
      {
        method: 'GET',
        path: '/api/forms/accounts/create-account/new',
      },
      {
        method: 'GET',
        path: '/api/contact/usercontact',
      },
      {
        method: 'POST',
        path: '/api/application',
        body: JSON.stringify({ applicationType: 'QuoteRequest' }),
      },
      {
        method: 'POST',
        path: '/api/application',
        body: JSON.stringify({ applicationType: 'PatternApproval' }),
      },
      {
        method: 'POST',
        path: '/api/application',
        body: JSON.stringify({ applicationType: 'QuoteAccept' }),
      },
    ] as const;

    for (const request of requests) {
      const init: RequestInit = { method: request.method };
      if (request.body !== undefined) {
        init.body = request.body;
        init.headers = { 'Content-Type': 'application/json' };
      }

      const response = await fetch(apiUrl(request.path), init);
      const payload = (await response.json()) as unknown;

      expect(response.status).toBe(200);

      assertRouteCoveragePayload(request, payload);
    }
  });

  it('fails closed for an unmapped application type', async () => {
    expect.hasAssertions();

    const response = await fetch(apiUrl('/api/application'), {
      method: 'POST',
      body: JSON.stringify({ applicationType: 'NotARealApplicationType' }),
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status).toBe(501);
  });

  it.each(['__proto__', 'constructor', 'toString'])(
    'fails closed with 501 for inherited application member %s',
    async (applicationType) => {
      expect.hasAssertions();

      const response = await fetch(apiUrl('/api/application'), {
        method: 'POST',
        body: JSON.stringify({ applicationType }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(501);
    },
  );

  it('fails closed for an unmapped quote application type', async () => {
    expect.hasAssertions();

    const response = await fetch(
      apiUrl(
        '/api/quote/get-quote-request-details-byrefid?ApplicationType=NotARealApplicationType',
      ),
    );

    expect(response.status).toBe(501);
  });

  it.each(requestedLookupTypes)(
    'answers every lookup type application code requests: %s',
    async (lookupTypeName) => {
      expect.hasAssertions();

      const lookupType =
        CRMLookupTypes[lookupTypeName as keyof typeof CRMLookupTypes];
      const lookupTypeValue = lookupType as string;
      const lookupResponse = Object.entries(lookupResponsesByType)
        .find(([name]) => name === lookupTypeValue)
        ?.at(1);
      const url = apiUrl('/api/lookup');
      url.searchParams.set('LookupType', lookupTypeValue);

      const response = await fetch(url);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toStrictEqual(lookupResponse);
    },
  );

  it('fails closed with 501 on an unmapped lookup type instead of falling through', async () => {
    expect.hasAssertions();

    // Falling through reaches MSW's unhandled-request path, which is the exact
    // warning this handler set exists to remove. A 501 surfaces the missing
    // fixture inside the story that needs it.
    const url = apiUrl('/api/lookup');
    url.searchParams.set('LookupType', 'NotARealLookupType');

    const response = await fetch(url);

    expect(response.status).toBe(501);
  });

  it('answers the Google tag script request with an empty JavaScript no-op', async () => {
    expect.hasAssertions();

    const response = await fetch(
      'https://www.googletagmanager.com/gtag/js?id=storybook-test-ga-id',
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain(
      'application/javascript',
    );
    await expect(response.text()).resolves.toBe('');
  });

  it.each([
    'https://www.googletagmanager.com/gtag/destination?id=storybook-test-ga-id',
    'https://www.google-analytics.com/g/collect?v=2',
    'https://example.com/gtag/js?id=storybook-test-ga-id',
  ])('does not stub other foreign request %s', async (requestUrl) => {
    expect.hasAssertions();

    await expect(fetch(requestUrl)).rejects.toThrow(/fetch failed|Failed/iu);
  });

  it('blocks a deliberately missing application handler before network fallback', async () => {
    expect.hasAssertions();

    await expect(fetch(apiUrl('/api/missing-story-handler'))).rejects.toThrow(
      /Cannot bypass|Failed/iu,
    );
  });

  it.each(['__proto__', 'constructor', 'toString'])(
    'fails closed with 501 for inherited object member %s',
    async (lookupType) => {
      expect.hasAssertions();

      const url = apiUrl('/api/lookup');
      url.searchParams.set('LookupType', lookupType);

      const response = await fetch(url);

      expect(response.status).toBe(501);
    },
  );
});
