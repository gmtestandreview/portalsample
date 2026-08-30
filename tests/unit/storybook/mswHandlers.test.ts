import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import {
    artefactTypeResponses,
    lookupResponses,
    serviceResponses,
} from '../../../ClientApp/src/storybook/storybookFixtures';
import { CRMLookupTypes } from '../../../ClientApp/src/api/web-api-client';
import { mswHandlers } from '../../../.storybook/msw-handlers';

const server = setupServer(...mswHandlers);
const apiUrl = (path: string) => new URL(path, globalThis.location.origin);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Storybook MSW handlers', () => {
    it('returns the shared services fixture', async () => {
        const response = await fetch(apiUrl('/api/lookup/services'));

        expect(response.ok).toBe(true);
        await expect(response.json()).resolves.toEqual(serviceResponses);
    });

    it.each([
        [CRMLookupTypes.TCPortalMeasurementCategory, lookupResponses],
        [CRMLookupTypes.TCArtefactTypePortalCategory, artefactTypeResponses],
    ])('returns the deterministic %s lookup fixture', async (lookupType, expectedResponse) => {
        const url = apiUrl('/api/lookup');
        url.searchParams.set('LookupType', lookupType);

        const response = await fetch(url);

        expect(response.ok).toBe(true);
        await expect(response.json()).resolves.toEqual(expectedResponse);
    });
});
