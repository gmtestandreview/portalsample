import { http, HttpResponse } from 'msw/http';
import { useParams } from 'react-router';
import { expect, waitFor } from 'storybook/test';
import preview from '../../../../../.storybook/preview';
import CreateRequestForQuote from '.';
import { withPortalProviders } from '../../../storybook/storybookHarness';

const CREATED_REFERENCE = 'RFQ-2024-000654';

interface CreateRequestObservation {
  body: unknown;
  authorization: string | null;
}

const state: {
  requests: CreateRequestObservation[];
  release: () => void;
} = {
  requests: [],
  release: () => undefined,
};

const OrganisationAndContactDestination = () => {
  const { id } = useParams();
  return <h1>{`Organisation and contact for request ${id}`}</h1>;
};

const observeCreateRequest = async (request: Request) => {
  state.requests.push({
    body: await request.json(),
    authorization: request.headers.get('Authorization'),
  });
};

const meta = preview.meta({
  title: 'Routes/RequestForQuote/Create',
  component: CreateRequestForQuote,
  decorators: [withPortalProviders],
  beforeEach: () => {
    state.requests = [];
    return () => {
      state.release();
      state.requests = [];
    };
  },
  parameters: {
    layout: 'fullscreen',
    portal: {
      authenticated: true,
      initialEntries: ['/request-for-quote-create'],
      destinationRoutes: [
        {
          path: '/request-for-quote/:id/organisation-and-contact',
          element: <OrganisationAndContactDestination />,
        },
      ],
    },
  },
});

export const PendingThenOrganisationAndContact = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    const gate = new Promise<void>((resolve) => {
      state.release = resolve;
    });
    msw.use(
      http.post('/api/application', async ({ request }) => {
        await observeCreateRequest(request);
        await gate;
        return HttpResponse.json({ referenceId: CREATED_REFERENCE });
      }),
    );
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('Loading...')).toBeVisible();

    await waitFor(() => expect(state.requests).toHaveLength(1));

    await expect(state.requests[0]).toEqual({
      body: { applicationType: 'QuoteRequest' },
      authorization: 'Bearer mock-access-token',
    });
    await expect(
      canvas.queryByRole('heading', { name: /Organisation and contact/u }),
    ).not.toBeInTheDocument();

    state.release();

    await expect(
      await canvas.findByRole('heading', {
        name: `Organisation and contact for request ${CREATED_REFERENCE}`,
      }),
    ).toBeVisible();
    await expect(state.requests).toHaveLength(1);
  },
});

export const CreateFailureKeepsLoading = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(
      http.post('/api/application', async ({ request }) => {
        await observeCreateRequest(request);
        return HttpResponse.json({ title: 'Server error' }, { status: 500 });
      }),
    );
  },
  play: async ({ canvas }) => {
    await waitFor(() => expect(state.requests).toHaveLength(1));

    await expect(await canvas.findByText('Loading...')).toBeVisible();
    await expect(
      canvas.queryByRole('heading', { name: /Organisation and contact/u }),
    ).not.toBeInTheDocument();
    await expect(state.requests).toHaveLength(1);
  },
});
