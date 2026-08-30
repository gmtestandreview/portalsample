import { http, HttpResponse } from 'msw';
import { CRMLookupTypes } from '../ClientApp/src/api/web-api-client';
import {
    artefactTypeResponses,
    lookupResponses,
    serviceResponses,
} from '../ClientApp/src/storybook/storybookFixtures';

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
    http.get('/api/lookup', ({ request }) => {
        const lookupType = new URL(request.url).searchParams.get('LookupType');
        if (lookupType !== CRMLookupTypes.TCPortalMeasurementCategory) return;
        return HttpResponse.json(lookupResponses);
    }),
    http.get('/api/lookup', ({ request }) => {
        const lookupType = new URL(request.url).searchParams.get('LookupType');
        if (lookupType !== CRMLookupTypes.TCArtefactTypePortalCategory) return;
        return HttpResponse.json(artefactTypeResponses);
    }),
];
