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
            /getLookup\(\s*CRMLookupTypes\.(\w+)/g
          ),
        ].map((match) => match[1])
      )
  ),
];

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => server.resetHandlers());

afterAll(() => server.close());

describe('storybook MSW handlers', () => {
  it('finds the lookup call sites it is supposed to cover', () => {
    // Guards the enumeration itself: a regex that matched nothing would make
    // every case below vacuous.
    expect(requestedLookupTypes.length).toBeGreaterThanOrEqual(4);
    expect(requestedLookupTypes).toContain('PAPortalCategory');
  });

  it('returns the shared services fixture', async () => {
    const response = await fetch(apiUrl('/api/lookup/services'));

    expect(response.ok).toBe(true);
    await expect(response.json()).resolves.toEqual(serviceResponses);
  });

  it('answers the route-coverage API requests', async () => {
    const requests: Array<{
      method: 'GET' | 'POST';
      path: string;
      body?: string;
    }> = [
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
      const payload = await response.json();

      expect(response.status).toBe(200);

      if (request.path.includes('get-quote-request-details-byrefid')) {
        expect(payload).toEqual(
          expect.objectContaining({ crmQuoteRequestId: expect.any(String) })
        );
      } else if (request.path.includes('/api/forms/accounts/')) {
        expect(payload).toEqual(
          expect.objectContaining({
            id: 1,
            stepValues: expect.objectContaining({
              status: 'NotStarted',
            }),
          })
        );
      } else if (request.path.includes('/api/contact/usercontact')) {
        expect(payload).toEqual(
          expect.objectContaining({
            contact: expect.objectContaining({ email: expect.any(String) }),
            formStepStatus: 'NotStarted',
          })
        );
      } else if (request.path === '/api/application') {
        expect(payload).toEqual(
          expect.objectContaining({
            referenceId: expect.any(String),
            applicationType: JSON.parse(request.body ?? '{}').applicationType,
          })
        );
      }
    }
  });

  it('fails closed for an unmapped application type', async () => {
    const response = await fetch(apiUrl('/api/application'), {
      method: 'POST',
      body: JSON.stringify({ applicationType: 'NotARealApplicationType' }),
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status).toBe(501);
  });

  it('fails closed for an unmapped quote application type', async () => {
    const response = await fetch(
      apiUrl(
        '/api/quote/get-quote-request-details-byrefid?ApplicationType=NotARealApplicationType'
      )
    );

    expect(response.status).toBe(501);
  });

  it.each(requestedLookupTypes)(
    'answers every lookup type application code requests: %s',
    async (lookupTypeName) => {
      const lookupType =
        CRMLookupTypes[lookupTypeName as keyof typeof CRMLookupTypes];
      const lookupResponse = Object.entries(lookupResponsesByType)
        .find(([name]) => name === lookupType)
        ?.at(1);
      const url = apiUrl('/api/lookup');
      url.searchParams.set('LookupType', lookupType);

      const response = await fetch(url);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(lookupResponse);
    }
  );

  it('fails closed with 501 on an unmapped lookup type instead of falling through', async () => {
    // Falling through reaches MSW's unhandled-request path, which is the exact
    // warning this handler set exists to remove. A 501 surfaces the missing
    // fixture inside the story that needs it.
    const url = apiUrl('/api/lookup');
    url.searchParams.set('LookupType', 'NotARealLookupType');

    const response = await fetch(url);

    expect(response.status).toBe(501);
  });

  it.each(['__proto__', 'constructor', 'toString'])(
    'fails closed with 501 for inherited object member %s',
    async (lookupType) => {
      const url = apiUrl('/api/lookup');
      url.searchParams.set('LookupType', lookupType);

      const response = await fetch(url);

      expect(response.status).toBe(501);
    }
  );
});
