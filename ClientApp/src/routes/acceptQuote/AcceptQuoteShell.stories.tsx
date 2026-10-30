import { http, HttpResponse } from 'msw/http';
import { expect, waitFor } from 'storybook/test';
import preview from '../../../../.storybook/preview';
import AcceptQuote from '.';
import { withPortalProviders } from '../../storybook/storybookHarness';

const APPLICATION_ID = 'QA-2024-000900';
const CRM_QUOTE_REQUEST_ID = 'CRM-QR-77';
const QUOTE_REFERENCE = 'Q-2024-000456';

interface ShellObservations {
  statusRequestIds: Array<string | readonly string[] | undefined>;
  detailRequestIds: Array<string | null>;
}

const state: { observed: ShellObservations } = {
  observed: { statusRequestIds: [], detailRequestIds: [] },
};

const resetObservations = () => {
  state.observed = { statusRequestIds: [], detailRequestIds: [] };
};

const stepStatusesHandler = (respond: () => Response) =>
  http.get('/api/accept-quote/:id/step-statuses', ({ params }) => {
    state.observed.statusRequestIds.push(params['id']);
    return respond();
  });

const quoteDetailsHandler = (respond: () => Response) =>
  http.get('/api/quote/get-quote-request-details', ({ request }) => {
    state.observed.detailRequestIds.push(
      new URL(request.url).searchParams.get('QuoteRequestID'),
    );
    return respond();
  });

const reportRecipientHandler = http.get(
  '/api/accept-quote/:id/report-recipient',
  () =>
    HttpResponse.json({
      reportAddressType: 'BusinessAddress',
      organisationName: 'Storybook Organisation',
      rfqOrganisation: {
        streetAddress: {
          line1: '100 Example Street',
          suburb: 'Canberra',
          state: 'ACT',
          postcode: '2601',
        },
        postalAddressSameAsStreetAddress: true,
        postalAddress: {},
      },
      acceptQuotePreInfo: { quotationIdNum: QUOTE_REFERENCE },
    }),
);

const loadedHandlers = () => [
  stepStatusesHandler(() =>
    HttpResponse.json([
      { status: 'NotStarted', crmQuoteRequestId: CRM_QUOTE_REQUEST_ID },
    ]),
  ),
  quoteDetailsHandler(() =>
    HttpResponse.json({ quoteRequestIdNum: QUOTE_REFERENCE }),
  ),
  reportRecipientHandler,
];

const meta = preview.meta({
  title: 'Routes/AcceptQuote/Shell',
  component: AcceptQuote,
  decorators: [withPortalProviders],
  beforeEach: () => {
    resetObservations();
    return resetObservations;
  },
  parameters: {
    layout: 'fullscreen',
    portal: {
      authenticated: true,
      routePath: '/accept-quote/:id/*',
      initialEntries: [`/accept-quote/${APPLICATION_ID}/report-recipient`],
      destinationRoutes: [
        { path: '/not-found', element: <h1>Not found destination</h1> },
      ],
    },
  },
});

export const LoadsStatusesThenFirstStep = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(...loadedHandlers());
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', {
        name: /report recipient organisation/i,
      }),
    ).toBeVisible();

    await expect(state.observed.statusRequestIds).toEqual([APPLICATION_ID]);
    await expect(state.observed.detailRequestIds).toEqual([
      CRM_QUOTE_REQUEST_ID,
    ]);
    await expect(
      canvas.getByText('Testing and calibration service - Quotation'),
    ).toBeVisible();
    await expect(
      canvas.getByText(`Quotation ID: ${APPLICATION_ID}`),
    ).toBeVisible();
  },
});

export const NoStepStatusesIsNotFound = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(
      stepStatusesHandler(() => HttpResponse.json([])),
      quoteDetailsHandler(() => HttpResponse.json({})),
    );
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', { name: 'Not found destination' }),
    ).toBeVisible();
    await expect(state.observed.statusRequestIds).toEqual([APPLICATION_ID]);
    await expect(state.observed.detailRequestIds).toHaveLength(0);
  },
});

export const QuoteLookupFailureIsNotFound = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(
      stepStatusesHandler(() =>
        HttpResponse.json([
          { status: 'NotStarted', crmQuoteRequestId: CRM_QUOTE_REQUEST_ID },
        ]),
      ),
      quoteDetailsHandler(() =>
        HttpResponse.json({ title: 'Server error' }, { status: 500 }),
      ),
    );
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', { name: 'Not found destination' }),
    ).toBeVisible();

    await waitFor(() =>
      expect(state.observed.detailRequestIds).toEqual([CRM_QUOTE_REQUEST_ID]),
    );
  },
});

export const UnknownApplicationIsNotFound = meta.story({
  beforeEach({ msw }) {
    msw.use(
      http.get('/api/accept-quote/:id/step-statuses', ({ params }) => {
        state.observed.statusRequestIds.push(params['id']);
        return params['id'] === APPLICATION_ID
          ? HttpResponse.json([
              {
                status: 'NotStarted',
                crmQuoteRequestId: CRM_QUOTE_REQUEST_ID,
              },
            ])
          : HttpResponse.json({ title: 'Not found' }, { status: 404 });
      }),
    );
  },
  parameters: {
    docs: { story: { inline: false } },
    portal: {
      initialEntries: ['/accept-quote/QA-UNKNOWN/report-recipient'],
    },
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', { name: 'Not found destination' }),
    ).toBeVisible();
    await expect(state.observed.statusRequestIds).toEqual(['QA-UNKNOWN']);
    await expect(state.observed.detailRequestIds).toHaveLength(0);
  },
});
