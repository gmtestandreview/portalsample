import { http, HttpResponse } from 'msw/http';
import { useParams } from 'react-router';
import { expect, waitFor } from 'storybook/test';
import preview from '../../../../../.storybook/preview';
import CreateAcceptQuote from '.';
import { withPortalProviders } from '../../../storybook/storybookHarness';

const QUOTE_REFERENCE = 'Q-2024-000456';
const CRM_QUOTE_REQUEST_ID = 'CRM-QR-77';
const ACCEPT_REFERENCE = 'QA-2024-000900';

interface AcceptQuoteRequests {
  lookups: {
    applicationType: string | null;
    quoteReference: string | null;
  }[];
  creates: unknown[];
}

const state: {
  requests: AcceptQuoteRequests;
  release: () => void;
} = {
  requests: { lookups: [], creates: [] },
  release: () => undefined,
};

const ReportRecipientDestination = () => {
  const { id } = useParams();
  return <h1>{`Report recipient for acceptance ${id}`}</h1>;
};

const lookupHandler = (response: () => Response) =>
  http.get('/api/quote/get-quote-request-details-byrefid', ({ request }) => {
    const url = new URL(request.url);
    state.requests.lookups.push({
      applicationType: url.searchParams.get('ApplicationType'),
      quoteReference: url.searchParams.get('QuoteReferenceID'),
    });
    return response();
  });

const meta = preview.meta({
  title: 'Routes/AcceptQuote/Create',
  component: CreateAcceptQuote,
  decorators: [withPortalProviders],
  beforeEach: () => {
    state.requests = { lookups: [], creates: [] };
    return () => {
      state.release();
      state.requests = { lookups: [], creates: [] };
    };
  },
  parameters: {
    layout: 'fullscreen',
    portal: {
      authenticated: true,
      routePath: '/accept-quote-create/:id/*',
      initialEntries: [`/accept-quote-create/${QUOTE_REFERENCE}`],
      destinationRoutes: [
        {
          path: '/accept-quote/:id/report-recipient',
          element: <ReportRecipientDestination />,
        },
      ],
    },
  },
});

export const LooksUpQuoteThenReportRecipient = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    const gate = new Promise<void>((resolve) => {
      state.release = resolve;
    });
    msw.use(
      lookupHandler(() =>
        HttpResponse.json({ crmQuoteRequestId: CRM_QUOTE_REQUEST_ID }),
      ),
      http.post('/api/application', async ({ request }) => {
        state.requests.creates.push(await request.json());
        await gate;
        return HttpResponse.json({ referenceId: ACCEPT_REFERENCE });
      }),
    );
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('Loading...')).toBeVisible();

    await waitFor(() => expect(state.requests.creates).toHaveLength(1));

    await expect(state.requests.lookups).toEqual([
      { applicationType: 'QuoteRequest', quoteReference: QUOTE_REFERENCE },
    ]);
    await expect(state.requests.creates[0]).toEqual({
      applicationType: 'QuoteAccept',
      referenceId: CRM_QUOTE_REQUEST_ID,
    });
    await expect(
      canvas.queryByRole('heading', { name: /Report recipient/u }),
    ).not.toBeInTheDocument();

    state.release();

    await expect(
      await canvas.findByRole('heading', {
        name: `Report recipient for acceptance ${ACCEPT_REFERENCE}`,
      }),
    ).toBeVisible();
    await expect(state.requests.creates).toHaveLength(1);
  },
});

export const QuoteLookupFailureCreatesNothing = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(
      lookupHandler(() =>
        HttpResponse.json({ title: 'Quote not found' }, { status: 404 }),
      ),
      http.post('/api/application', async ({ request }) => {
        state.requests.creates.push(await request.json());
        return HttpResponse.json({ referenceId: ACCEPT_REFERENCE });
      }),
    );
  },
  play: async ({ canvas }) => {
    await waitFor(() => expect(state.requests.lookups).toHaveLength(1));

    await expect(await canvas.findByText('Loading...')).toBeVisible();
    await expect(state.requests.creates).toHaveLength(0);
    await expect(
      canvas.queryByRole('heading', { name: /Report recipient/u }),
    ).not.toBeInTheDocument();
  },
});
