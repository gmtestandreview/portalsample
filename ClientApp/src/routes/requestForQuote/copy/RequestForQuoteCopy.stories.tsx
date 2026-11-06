import { http, HttpResponse } from 'msw/http';
import { useParams } from 'react-router';
import { expect, waitFor } from 'storybook/test';
import preview from '../../../../../.storybook/preview';
import CopyRequestForQuote from '.';
import { withPortalProviders } from '../../../storybook/storybookHarness';

const SOURCE_REFERENCE = 'RFQ-2024-000100';
const COPIED_REFERENCE = 'RFQ-2024-000200';

interface CopyRequestObservation {
  sourceReference: string | readonly string[] | undefined;
  body: unknown;
  authorization: string | null;
}

const state: {
  requests: CopyRequestObservation[];
  release: () => void;
} = {
  requests: [],
  release: () => undefined,
};

const OrganisationAndContactDestination = () => {
  const { id } = useParams();
  return <h1>{`Organisation and contact for request ${id ?? ''}`}</h1>;
};

const observeCopyRequest = async (
  request: Request,
  sourceReference: CopyRequestObservation['sourceReference'],
) => {
  state.requests.push({
    sourceReference,
    body: await request.json(),
    authorization: request.headers.get('Authorization'),
  });
};

const meta = preview.meta({
  title: 'Routes/RequestForQuote/Copy',
  component: CopyRequestForQuote,
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
      routePath: '/request-for-quote-copy/:id/*',
      initialEntries: [`/request-for-quote-copy/${SOURCE_REFERENCE}`],
      destinationRoutes: [
        {
          path: '/request-for-quote/:id/organisation-and-contact',
          element: <OrganisationAndContactDestination />,
        },
      ],
    },
  },
});

export const CopiesSourceThenOrganisationAndContact = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    const gate = new Promise<void>((resolve) => {
      state.release = resolve;
    });
    msw.use(
      http.post('/api/application/:id/copy', async ({ request, params }) => {
        await observeCopyRequest(request, params['id']);
        await gate;
        return HttpResponse.json({ referenceId: COPIED_REFERENCE });
      }),
    );
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('Loading...')).toBeVisible();

    await waitFor(() => expect(state.requests).toHaveLength(1));

    await expect(state.requests[0]).toEqual({
      sourceReference: SOURCE_REFERENCE,
      body: { applicationType: 'QuoteRequest' },
      authorization: 'Bearer mock-access-token',
    });
    await expect(
      canvas.queryByRole('heading', { name: /Organisation and contact/u }),
    ).not.toBeInTheDocument();

    state.release();

    await expect(
      await canvas.findByRole('heading', {
        name: `Organisation and contact for request ${COPIED_REFERENCE}`,
      }),
    ).toBeVisible();
    await expect(state.requests).toHaveLength(1);
  },
});

export const CopyRejectionKeepsLoading = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(
      http.post('/api/application/:id/copy', async ({ request, params }) => {
        await observeCopyRequest(request, params['id']);
        return HttpResponse.json({ title: 'Not allowed' }, { status: 403 });
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
