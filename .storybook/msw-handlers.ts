import { http, HttpResponse } from 'msw';
import { CRMLookupTypes, type LookupResponse } from '../ClientApp/src/api/web-api-client';
import {
    artefactTypeResponses,
    lookupResponses,
    paCategoryResponses,
    paInstrumentTypeResponses,
    serviceResponses,
} from '../ClientApp/src/storybook/storybookFixtures';

/**
 * One entry per CRMLookupTypes value that application code passes to
 * getLookup(). tests/unit/storybook/mswHandlers.test.ts enumerates those call
 * sites from source and fails when this map falls behind them.
 */
export const lookupResponsesByType: Partial<Record<CRMLookupTypes, LookupResponse[]>> = {
    [CRMLookupTypes.TCPortalMeasurementCategory]: lookupResponses,
    [CRMLookupTypes.TCArtefactTypePortalCategory]: artefactTypeResponses,
    [CRMLookupTypes.PAPortalCategory]: paCategoryResponses,
    [CRMLookupTypes.PAPortalInstrumentType]: paInstrumentTypeResponses,
};

export const mswHandlers = [
    http.get('/api/dashboard/*', () =>
        HttpResponse.json({
            items: [],
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
        })
    ),
    http.get('/api/lookup/services', () => HttpResponse.json(serviceResponses)),
    // A single handler scoped to one endpoint the application owns. Returning
    // undefined here would fall through to MSW's unhandled-request path - the
    // very warning this file exists to remove - so an unmapped type fails closed
    // and surfaces inside the story that needs the fixture.
    http.get('/api/lookup', ({ request }) => {
        const lookupType = new URL(request.url).searchParams.get('LookupType') as CRMLookupTypes | null;
        const fixture =
            lookupType === null || !Object.hasOwn(lookupResponsesByType, lookupType)
                ? undefined
                : lookupResponsesByType[lookupType];

        if (fixture === undefined) {
            return HttpResponse.json(
                { error: `No Storybook fixture for LookupType=${lookupType ?? '(missing)'}` },
                { status: 501 },
            );
        }

        return HttpResponse.json(fixture);
    }),
];
