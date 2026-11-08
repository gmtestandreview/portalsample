import { http, HttpResponse } from 'msw/http';
import {
  ApplicationType,
  CRMLookupTypes,
  FormStepStatus,
  type LookupResponse,
} from '../ClientApp/src/api/web-api-client';
import {
  artefactTypeResponses,
  lookupResponses,
  paCategoryResponses,
  paInstrumentTypeResponses,
  requestForQuoteDetailsFixture,
  serviceResponses,
} from '../ClientApp/src/storybook/storybookFixtures';
import {
  toApplicationType,
  toCRMLookupTypes,
} from '../ClientApp/src/utils/apiEnumMappings';

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
  const returnFile =
    new URL(request.url).searchParams.get('ReturnFile') === 'true';

  return returnFile
    ? HttpResponse.json({
        filename,
        mimeType: 'application/pdf',
        fileData: 'JVBERi0xLjQK',
      })
    : HttpResponse.json({ fileSizeBytes: 2048 });
};

const accountStepValues = {
  id: 1,
  abn: '00000000000',
  name: 'Storybook Organisation',
  businessOrTradingName: 'Storybook Organisation Pty Ltd',
  branchOrLocationName: 'Main Branch',
  businessWebsiteAddress: 'https://example.gov.au',
  isDefaultOrganisation: true,
  streetAddress: {
    line1: '1 Example Street',
    suburb: 'Sydney',
    state: 'NSW',
    postcode: '2000',
    isManuallyEntered: true,
  },
  postalAddressSameAsStreetAddress: true,
  contact: {},
  status: FormStepStatus.NotStarted,
};

const contactForm = {
  contact: {
    title: 'Mr',
    firstName: 'Taylor',
    lastName: 'Nguyen',
    phone: '0200000000',
    mobile: '0400000000',
    email: 'taylor.nguyen@example.com',
  },
  formStepStatus: FormStepStatus.NotStarted,
};

const applicationReferenceIds: Partial<Record<ApplicationType, string>> = {
  [ApplicationType.QuoteAccept]: 'AQ-NEW-0001',
  [ApplicationType.PatternApproval]: 'TA-NEW-0001',
  [ApplicationType.QuoteRequest]: 'RFQ-NEW-0001',
};

const applicationResponse = (applicationType: string | undefined) => {
  const mappedApplicationType = toApplicationType(applicationType);
  const referenceId =
    mappedApplicationType !== undefined &&
    Object.hasOwn(applicationReferenceIds, mappedApplicationType)
      ? applicationReferenceIds[mappedApplicationType]
      : undefined;

  if (referenceId === undefined) {
    return HttpResponse.json(
      {
        error: `No Storybook fixture for applicationType=${applicationType ?? '(missing)'}`,
      },
      { status: 501 },
    );
  }

  return HttpResponse.json({ referenceId, applicationType });
};

const quoteDetailsResponse = (request: Request) => {
  const applicationType = new URL(request.url).searchParams.get(
    'ApplicationType',
  );
  const mappedApplicationType = toApplicationType(applicationType);

  if (
    mappedApplicationType !== ApplicationType.QuoteRequest &&
    mappedApplicationType !== ApplicationType.QuoteAccept
  ) {
    return HttpResponse.json(
      {
        error: `No Storybook fixture for ApplicationType=${applicationType ?? '(missing)'}`,
      },
      { status: 501 },
    );
  }

  return HttpResponse.json(requestForQuoteDetailsFixture);
};

/**
 * One entry per CRMLookupTypes value that application code passes to
 * getLookup(). tests/unit/storybook/mswHandlers.test.ts enumerates those call
 * sites from source and fails when this map falls behind them.
 */
export const lookupResponsesByType: Partial<
  Record<CRMLookupTypes, LookupResponse[]>
> = {
  [CRMLookupTypes.TCPortalMeasurementCategory]: lookupResponses,
  [CRMLookupTypes.TCArtefactTypePortalCategory]: artefactTypeResponses,
  [CRMLookupTypes.PAPortalCategory]: paCategoryResponses,
  [CRMLookupTypes.PAPortalInstrumentType]: paInstrumentTypeResponses,
};

export const mswHandlers = [
  // react-ga4 injects this script when the Storybook runtime env fixture sets a
  // GA tracking id. Answer it with an empty no-op so no real Google code or
  // network is reached while the MSW policy still fails every other foreign
  // origin closed.
  http.get('https://www.googletagmanager.com/gtag/js', () =>
    HttpResponse.text('', {
      headers: { 'Content-Type': 'application/javascript' },
    }),
  ),
  http.get('/api/dashboard', () => HttpResponse.json([])),
  http.get('/api/dashboard/get-filtered-dashboard-quotes', () =>
    HttpResponse.json(dashboardPageResponse),
  ),
  http.get('/api/dashboard/get-filtered-dashboard-drafts', () =>
    HttpResponse.json(dashboardPageResponse),
  ),
  http.get('/api/dashboard/get-filtered-dashboard-artefacts', () =>
    HttpResponse.json(dashboardPageResponse),
  ),
  http.get('/api/dashboard/get-dashboard-instrument-artefact-reports', () =>
    HttpResponse.json(instrumentReportPageResponse),
  ),
  http.get('/api/dashboard/get-quote-offer-pdf', ({ request }) =>
    pdfResponse(request, 'quote-offer.pdf'),
  ),
  http.get('/api/dashboard/get-quote-request-accepted-pdf', ({ request }) =>
    pdfResponse(request, 'quote-request-accepted.pdf'),
  ),
  http.get('/api/dashboard/get-quote-request-rejected-pdf', ({ request }) =>
    pdfResponse(request, 'quote-request-rejected.pdf'),
  ),
  http.get('/api/dashboard/get-quote-report-pdf', ({ request }) =>
    pdfResponse(request, 'measurement-report.pdf'),
  ),
  http.get('/api/quote/get-quote-request-details-byrefid', ({ request }) =>
    quoteDetailsResponse(request),
  ),
  http.get('/api/forms/accounts/branch', () =>
    HttpResponse.json({
      id: 1,
      stepValues: { ...accountStepValues, branchOrLocationName: '' },
    }),
  ),
  http.get('/api/forms/accounts/create-account/new', () =>
    HttpResponse.json({ id: 1, stepValues: accountStepValues }),
  ),
  http.get('/api/contact/usercontact', () => HttpResponse.json(contactForm)),
  http.post('/api/application', async ({ request }) => {
    const command = (await request.json()) as { applicationType?: string };
    return applicationResponse(command.applicationType);
  }),
  http.get('/api/organisations/byabn', ({ request }) => {
    const abn = new URL(request.url).searchParams.get('abn');

    return HttpResponse.json([
      {
        organisationId: 1,
        abn: abn ?? accountStepValues.abn,
        name: accountStepValues.name,
        businessOrTradingName: accountStepValues.businessOrTradingName,
        branchOrLocationName: accountStepValues.branchOrLocationName,
        crmGuid: 'org-crm-guid-001',
        isCompleted: true,
        accountCompleted: true,
        acceptedTermsOfUse: true,
      },
    ]);
  }),
  http.get('/api/lookup/services', () => HttpResponse.json(serviceResponses)),
  // A single handler scoped to one endpoint the application owns. Returning
  // undefined here would fall through to MSW's unhandled-request path - the
  // very warning this file exists to remove - so an unmapped type fails closed
  // and surfaces inside the story that needs the fixture.
  http.get('/api/lookup', ({ request }) => {
    const lookupType = toCRMLookupTypes(
      new URL(request.url).searchParams.get('LookupType'),
    );
    const fixture =
      lookupType === undefined ||
      !Object.hasOwn(lookupResponsesByType, lookupType)
        ? undefined
        : lookupResponsesByType[lookupType];

    if (fixture === undefined) {
      return HttpResponse.json(
        {
          error: `No Storybook fixture for LookupType=${lookupType ?? '(missing)'}`,
        },
        { status: 501 },
      );
    }

    return HttpResponse.json(fixture);
  }),
];
