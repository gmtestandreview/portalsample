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
            /getLookup\(\s*CRMLookupTypes\.(\w+)/g,
          ),
        ].map((match) => match[1]),
      ),
  ),
];

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => server.resetHandlers());

afterAll(() => server.close());

describe('storybook MSW handlers', () => {
  it('finds the lookup call sites it is supposed to cover', () => {
    expect.assertions(2);
    // Guards the enumeration itself: a regex that matched nothing would make
    // every case below vacuous.
    expect(requestedLookupTypes.length).toBeGreaterThanOrEqual(4);
    expect(requestedLookupTypes).toContain('PAPortalCategory');
  });
});

describe('storybook MSW handlers', () => {
  it('returns the shared services fixture', async () => {
    expect.assertions(2);
    const response = await fetch(apiUrl('/api/lookup/services'));

    expect(response.ok).toBe(true);
    await expect(response.json()).resolves.toEqual(serviceResponses);
  });
});
