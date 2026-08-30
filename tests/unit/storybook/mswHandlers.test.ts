import { globSync, readFileSync } from 'node:fs';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { CRMLookupTypes } from '../../../ClientApp/src/api/web-api-client';
import { serviceResponses } from '../../../ClientApp/src/storybook/storybookFixtures';
import { lookupResponsesByType, mswHandlers } from '../../../.storybook/msw-handlers';

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
            .flatMap((file) => [
                ...readFileSync(file, 'utf8').matchAll(/getLookup\(\s*CRMLookupTypes\.(\w+)/g),
            ].map((match) => match[1])),
    ),
];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Storybook MSW handlers', () => {
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

    it.each(requestedLookupTypes)(
        'answers every lookup type application code requests: %s',
        async (lookupTypeName) => {
            const lookupType = CRMLookupTypes[lookupTypeName as keyof typeof CRMLookupTypes];
            const url = apiUrl('/api/lookup');
            url.searchParams.set('LookupType', lookupType);

            const response = await fetch(url);

            expect(response.status).toBe(200);
            await expect(response.json()).resolves.toEqual(lookupResponsesByType[lookupType]);
        },
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
});
