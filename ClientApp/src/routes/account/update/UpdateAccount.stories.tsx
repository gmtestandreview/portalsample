import { http, HttpResponse } from 'msw/http';
import { expect, waitFor, within } from 'storybook/test';
import preview from '../../../../../.storybook/preview';
import UpdateAccount from '.';
import { withPortalProviders } from '../../../storybook/storybookHarness';

const ORGANISATION_ID = 42;
const SAVE_BUTTON_NAME = 'Save and close';
const CONFIRMATION_TITLE = 'Update organisation confirmation';

const accountStepValues = {
  id: ORGANISATION_ID,
  abn: '12345678901',
  name: 'Calibration Services Pty Ltd',
  businessOrTradingName: 'Calibration Services',
  branchOrLocationName: 'Sydney Laboratory',
  businessWebsiteAddress: 'https://example.gov.au',
  isDefaultOrganisation: false,
  streetAddress: {
    line1: '1 Example Street',
    suburb: 'Sydney',
    state: 'NSW',
    postcode: '2000',
    isManuallyEntered: true,
  },
  postalAddressSameAsStreetAddress: true,
  contact: {},
  status: 'NotStarted',
};

interface UpdateAccountObservations {
  loadedOrganisationIds: (string | readonly string[] | undefined)[];
  savedBodies: unknown[];
}

const state: { observed: UpdateAccountObservations } = {
  observed: { loadedOrganisationIds: [], savedBodies: [] },
};

const resetObservations = () => {
  state.observed = { loadedOrganisationIds: [], savedBodies: [] };
};

const accountHandlers = () => [
  http.get('/api/forms/accounts/:organisationId', ({ params }) => {
    state.observed.loadedOrganisationIds.push(params['organisationId']);
    return HttpResponse.json({
      id: ORGANISATION_ID,
      stepValues: accountStepValues,
    });
  }),
  http.put(
    '/api/forms/accounts/create-account/complete',
    async ({ request }) => {
      state.observed.savedBodies.push(await request.json());
      return new HttpResponse(null, { status: 204 });
    },
  ),
];

const meta = preview.meta({
  title: 'Routes/Account/Update',
  component: UpdateAccount,
  decorators: [withPortalProviders],
  beforeEach: () => {
    resetObservations();
    return resetObservations;
  },
  parameters: {
    layout: 'fullscreen',
    portal: {
      authenticated: true,
      routePath: '/update-organisation/:id/*',
      initialEntries: [`/update-organisation/${ORGANISATION_ID}`],
      destinationRoutes: [
        { path: '/', element: <h1>Home destination</h1> },
        { path: '/not-found', element: <h1>Not found destination</h1> },
      ],
    },
  },
});

export const LoadsOrganisationForEditing = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(...accountHandlers());
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByDisplayValue('Calibration Services'),
    ).toBeVisible();

    await expect(state.observed.loadedOrganisationIds).toEqual([
      String(ORGANISATION_ID),
    ]);
    await expect(
      canvas.getByLabelText('Business or Trading name (optional)'),
    ).toHaveValue('Calibration Services');
  },
});

export const ConfirmationCancelThenConfirmSaves = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(...accountHandlers());
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByDisplayValue('Calibration Services');
    await userEvent.click(
      await canvas.findByRole('button', { name: SAVE_BUTTON_NAME }),
    );

    const dialog = await within(document.body).findByRole('dialog', {
      name: CONFIRMATION_TITLE,
    });
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'No, cancel' }),
    );

    await waitFor(() =>
      expect(
        within(document.body).queryByRole('dialog'),
      ).not.toBeInTheDocument(),
    );

    await expect(state.observed.savedBodies).toHaveLength(0);

    await userEvent.click(
      await canvas.findByRole('button', { name: SAVE_BUTTON_NAME }),
    );
    await userEvent.click(
      within(
        await within(document.body).findByRole('dialog', {
          name: CONFIRMATION_TITLE,
        }),
      ).getByRole('button', { name: 'Yes, submit' }),
    );

    await expect(
      await canvas.findByRole('heading', { name: 'Home destination' }),
    ).toBeVisible();
    await expect(state.observed.savedBodies).toHaveLength(1);
    await expect(state.observed.savedBodies[0]).toMatchObject({
      formStep: {
        id: ORGANISATION_ID,
        businessOrTradingName: 'Calibration Services',
      },
    });
  },
});

export const MalformedIdIsNotFound = meta.story({
  parameters: {
    portal: { initialEntries: ['/update-organisation/not-a-number'] },
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', { name: 'Not found destination' }),
    ).toBeVisible();
    await expect(state.observed.loadedOrganisationIds).toHaveLength(0);
  },
});

export const NonPositiveIdIsNotFound = meta.story({
  parameters: {
    portal: { initialEntries: ['/update-organisation/0'] },
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', { name: 'Not found destination' }),
    ).toBeVisible();
    await expect(state.observed.loadedOrganisationIds).toHaveLength(0);
  },
});
