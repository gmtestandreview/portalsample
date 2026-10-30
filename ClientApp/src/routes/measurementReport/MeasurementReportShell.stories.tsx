import { http, HttpResponse } from 'msw/http';
import { expect } from 'storybook/test';
import preview from '../../../../.storybook/preview';
import MeasurementReport from '.';
import { withPortalProviders } from '../../storybook/storybookHarness';
import { requestForQuoteDetailsFixture } from '../../storybook/storybookFixtures';

const QUOTE_REFERENCE = 'RFQ-2024-000892';

interface LookupObservation {
  applicationType: string | null;
  quoteReference: string | null;
}

const state: { lookups: LookupObservation[] } = { lookups: [] };

const lookupHandler = (respond: () => Response) =>
  http.get('/api/quote/get-quote-request-details-byrefid', ({ request }) => {
    const url = new URL(request.url);
    state.lookups.push({
      applicationType: url.searchParams.get('ApplicationType'),
      quoteReference: url.searchParams.get('QuoteReferenceID'),
    });
    return respond();
  });

const meta = preview.meta({
  title: 'Routes/MeasurementReport/Shell',
  component: MeasurementReport,
  decorators: [withPortalProviders],
  beforeEach: () => {
    state.lookups = [];
    return () => {
      state.lookups = [];
    };
  },
  parameters: {
    layout: 'fullscreen',
    portal: {
      authenticated: true,
      routePath: '/report/:id/*',
      initialEntries: [`/report/${QUOTE_REFERENCE}`],
      destinationRoutes: [
        { path: '/not-found', element: <h1>Not found destination</h1> },
        { path: '/dashboard', element: <h1>Dashboard destination</h1> },
      ],
    },
  },
});

export const LoadsReportForReference = meta.story({
  beforeEach({ msw }) {
    msw.use(
      lookupHandler(() => HttpResponse.json(requestForQuoteDetailsFixture)),
    );
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('MY12345678')).toBeVisible();

    await expect(state.lookups).toEqual([
      { applicationType: 'QuoteAccept', quoteReference: QUOTE_REFERENCE },
    ]);
    await expect(canvas.getByRole('heading', { name: 'Report' })).toBeVisible();
  },
});

export const LookupFailureIsNotFound = meta.story({
  beforeEach({ msw }) {
    msw.use(
      lookupHandler(() =>
        HttpResponse.json({ title: 'Server error' }, { status: 500 }),
      ),
    );
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', { name: 'Not found destination' }),
    ).toBeVisible();
    await expect(state.lookups).toHaveLength(1);
  },
});

export const BackToDashboardLink = meta.story({
  beforeEach({ msw }) {
    msw.use(
      lookupHandler(() => HttpResponse.json(requestForQuoteDetailsFixture)),
    );
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByText('MY12345678');
    await userEvent.click(
      canvas.getByRole('link', { name: /Back to dashboard/u }),
    );

    await expect(
      await canvas.findByRole('heading', { name: 'Dashboard destination' }),
    ).toBeVisible();
  },
});

export const MissingTargetOrganisationDoesNotLoad = meta.story({
  parameters: {
    portal: {
      accountDetails: { targetOrganisation: undefined },
    },
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', { name: 'Report' }),
    ).toBeVisible();
    await expect(state.lookups).toHaveLength(0);
  },
});
