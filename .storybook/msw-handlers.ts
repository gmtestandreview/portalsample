import { http, HttpResponse } from 'msw';
import { CRMLookupTypes, type LookupResponse } from '../ClientApp/src/api/web-api-client';
import {
    artefactTypeResponses,
    lookupResponses,
    paCategoryResponses,
    paInstrumentTypeResponses,
    serviceResponses,
} from '../ClientApp/src/storybook/storybookFixtures';

export const dashboardPageResponse = {
    currentPage: 1,
    items: [],
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
};

export const instrumentReportPageResponse = {
    currentPage: 1,
    items: [
        {
            tmasTcReportName: 'RPT-1001',
            tmasTcReportDate: '2024-03-20T00:00:00.000Z',
            tmasMeasurementReportCertificateRequired: 'Calibration certificate',
            tmasMeasurementCategoryName: 'Electrical',
            tmasStatus: 'Report issued',
            tmasTcQuoteName: 'Q-1001',
            tmasPortalRequestId: 'RFQ-1001',
        },
    ],
    pageSize: 10,
    totalCount: 1,
    totalPages: 1,
};

const pdfResponse = (request: Request, filename: string) => {
    const returnFile = new URL(request.url).searchParams.get('ReturnFile') === 'true';

    return returnFile
        ? HttpResponse.json({
              filename,
              mimeType: 'application/pdf',
              fileData: 'JVBERi0xLjQK',
          })
        : HttpResponse.json({ fileSizeBytes: 2048 });
};

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
    http.get('/api/dashboard', () => HttpResponse.json([])),
    http.get('/api/dashboard/get-filtered-dashboard-quotes', () => HttpResponse.json(dashboardPageResponse)),
    http.get('/api/dashboard/get-filtered-dashboard-drafts', () => HttpResponse.json(dashboardPageResponse)),
    http.get('/api/dashboard/get-filtered-dashboard-artefacts', () => HttpResponse.json(dashboardPageResponse)),
    http.get('/api/dashboard/get-dashboard-instrument-artefact-reports', () => HttpResponse.json(instrumentReportPageResponse)),
    http.get('/api/dashboard/get-quote-offer-pdf', ({ request }) => pdfResponse(request, 'quote-offer.pdf')),
    http.get('/api/dashboard/get-quote-request-accepted-pdf', ({ request }) => pdfResponse(request, 'quote-request-accepted.pdf')),
    http.get('/api/dashboard/get-quote-request-rejected-pdf', ({ request }) => pdfResponse(request, 'quote-request-rejected.pdf')),
    http.get('/api/dashboard/get-quote-report-pdf', ({ request }) => pdfResponse(request, 'measurement-report.pdf')),
    http.get('/api/lookup/services', () => HttpResponse.json(serviceResponses)),
    // A single handler scoped to one endpoint the application owns. Returning
    // undefined here would fall through to MSW's unhandled-request path - the
    // very warning this file exists to remove - so an unmapped type fails closed
    // and surfaces inside the story that needs the fixture.
    http.get('/api/lookup', ({ request }) => {
        const lookupType = new URL(request.url).searchParams.get('LookupType') as CRMLookupTypes | null;
        const fixture =
            lookupType === null || !Object.hasOwn(lookupResponsesByType, lookupType) ? undefined : lookupResponsesByType[lookupType];

        if (fixture === undefined) {
            return HttpResponse.json({ error: `No Storybook fixture for LookupType=${lookupType ?? '(missing)'}` }, { status: 501 });
        }

        return HttpResponse.json(fixture);
    }),
];
