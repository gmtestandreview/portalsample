import { http, HttpResponse } from 'msw/http';
import { expect, waitFor } from 'storybook/test';
import preview from '../../../../.storybook/preview';
import Quotation from '.';
import { QuoteStatus } from '../common/enums';
import { withPortalProviders } from '../../storybook/storybookHarness';
import { requestForQuoteDetailsFixture } from '../../storybook/storybookFixtures';

const QUOTE_REFERENCE = 'RFQ-2024-000892';
const VIEW_QUOTE_KEY = 'view-quote-id';

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
  title: 'Routes/Quotation/Shell',
  component: Quotation,
  decorators: [withPortalProviders],
  beforeEach: () => {
    state.lookups = [];
    globalThis.sessionStorage.removeItem(VIEW_QUOTE_KEY);
    return () => {
      state.lookups = [];
      globalThis.sessionStorage.removeItem(VIEW_QUOTE_KEY);
    };
  },
  parameters: {
    layout: 'fullscreen',
    portal: {
      authenticated: true,
      routePath: '/quotation/:id/*',
      initialEntries: [`/quotation/${QUOTE_REFERENCE}`],
      destinationRoutes: [
        { path: '/not-found', element: <h1>Not found destination</h1> },
      ],
    },
  },
});

export const LoadsQuotationForReference = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(
      lookupHandler(() => HttpResponse.json(requestForQuoteDetailsFixture)),
    );
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('MY12345678')).toBeVisible();

    await expect(state.lookups).toEqual([
      { applicationType: 'QuoteRequest', quoteReference: QUOTE_REFERENCE },
    ]);
    await expect(
      canvas.getAllByText('Testing and calibration service - Quotation').length,
    ).toBeGreaterThan(0);
  },
});

export const LookupFailureIsNotFound = meta.story({
  parameters: { docs: { story: { inline: false } } },
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

export const NewlyAcceptedQuoteShowsAccepted = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    globalThis.sessionStorage.setItem(
      VIEW_QUOTE_KEY,
      JSON.stringify(QUOTE_REFERENCE),
    );
    msw.use(
      lookupHandler(() =>
        HttpResponse.json({
          ...requestForQuoteDetailsFixture,
          quoteRequestStatus: QuoteStatus.QuoteAvailable,
        }),
      ),
    );
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('MY12345678')).toBeVisible();

    await expect(await canvas.findByText('Quotation accepted')).toBeVisible();
    await expect(canvas.queryByTestId('info-summary')).toBeNull();

    await waitFor(() =>
      expect(globalThis.sessionStorage.getItem(VIEW_QUOTE_KEY)).toBeNull(),
    );
  },
});

export const OtherQuoteKeepsAvailableStatus = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    globalThis.sessionStorage.setItem(
      VIEW_QUOTE_KEY,
      JSON.stringify('RFQ-OTHER'),
    );
    msw.use(
      lookupHandler(() => HttpResponse.json(requestForQuoteDetailsFixture)),
    );
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('MY12345678')).toBeVisible();

    await expect(canvas.getByTestId('info-summary')).toBeVisible();
    await expect(canvas.queryByText('Quotation accepted')).toBeNull();
  },
});
