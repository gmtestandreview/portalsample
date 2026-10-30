import { http, HttpResponse } from 'msw/http';
import { expect } from 'storybook/test';
import preview from '../../../../.storybook/preview';
import RequestForQuote from '.';
import { withPortalProviders } from '../../storybook/storybookHarness';

const APPLICATION_ID = 'RFQ-2024-000654';

interface ShellObservations {
  statusRequestIds: Array<string | readonly string[] | undefined>;
}

const state: { observed: ShellObservations } = {
  observed: { statusRequestIds: [] },
};

const resetObservations = () => {
  state.observed = { statusRequestIds: [] };
};

const stepStatusesHandler = (respond: (id: unknown) => Response) =>
  http.get('/api/request-for-quote/:id/step-statuses', ({ params }) => {
    state.observed.statusRequestIds.push(params['id']);
    return respond(params['id']);
  });

const organisationAndContactHandler = http.get(
  '/api/request-for-quote/:id/organisation-and-contact',
  () => HttpResponse.json({ organisationName: 'Storybook Organisation' }),
);

const meta = preview.meta({
  title: 'Routes/RequestForQuote/Shell',
  component: RequestForQuote,
  decorators: [withPortalProviders],
  beforeEach: () => {
    resetObservations();
    return resetObservations;
  },
  parameters: {
    layout: 'fullscreen',
    portal: {
      authenticated: true,
      routePath: '/request-for-quote/:id/*',
      initialEntries: [
        `/request-for-quote/${APPLICATION_ID}/organisation-and-contact`,
      ],
      destinationRoutes: [
        { path: '/not-found', element: <h1>Not found destination</h1> },
      ],
    },
  },
});

export const LoadsStatusesThenFirstStep = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(
      stepStatusesHandler(() =>
        HttpResponse.json([{ status: 'NotStarted' }, { status: 'NotStarted' }]),
      ),
      organisationAndContactHandler,
    );
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText(`Ref ID: ${APPLICATION_ID}`),
    ).toBeVisible();

    await expect(state.observed.statusRequestIds).toEqual([APPLICATION_ID]);
    await expect(
      canvas.getByText('Testing and calibration service - Request for quote'),
    ).toBeVisible();
  },
});

export const InvalidApplicationIdIsNotFound = meta.story({
  parameters: {
    docs: { story: { inline: false } },
    portal: {
      initialEntries: ['/request-for-quote/bad_id!/organisation-and-contact'],
    },
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', { name: 'Not found destination' }),
    ).toBeVisible();
    await expect(state.observed.statusRequestIds).toHaveLength(0);
  },
});

export const StatusLoadFailureIsNotFound = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(
      stepStatusesHandler(() =>
        HttpResponse.json({ title: 'Server error' }, { status: 500 }),
      ),
    );
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', { name: 'Not found destination' }),
    ).toBeVisible();
    await expect(state.observed.statusRequestIds).toEqual([APPLICATION_ID]);
  },
});

export const UnknownApplicationIsNotFound = meta.story({
  beforeEach({ msw }) {
    msw.use(
      stepStatusesHandler((id) =>
        id === APPLICATION_ID
          ? HttpResponse.json([{ status: 'NotStarted' }])
          : HttpResponse.json({ title: 'Not found' }, { status: 404 }),
      ),
    );
  },
  parameters: {
    docs: { story: { inline: false } },
    portal: {
      initialEntries: [
        '/request-for-quote/RFQ-UNKNOWN/organisation-and-contact',
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', { name: 'Not found destination' }),
    ).toBeVisible();
    await expect(state.observed.statusRequestIds).toEqual(['RFQ-UNKNOWN']);
  },
});
