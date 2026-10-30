import { http, HttpResponse } from 'msw/http';
import { expect, waitFor, within } from 'storybook/test';
import preview from '../../../../../.storybook/preview';
import AddBranch from '.';
import { withPortalProviders } from '../../../storybook/storybookHarness';

const SAVE_BUTTON_NAME = 'Save and close';
const CONFIRMATION_TITLE = 'Add branch or location confirmation';

const branchStepValues = {
  id: 7,
  abn: '00000000000',
  name: 'Calibration Services Pty Ltd',
  businessOrTradingName: 'Calibration Services',
  branchOrLocationName: 'Melbourne Laboratory',
  businessWebsiteAddress: 'https://example.gov.au',
  isDefaultOrganisation: false,
  streetAddress: {
    line1: '2 Example Street',
    suburb: 'Melbourne',
    state: 'VIC',
    postcode: '3000',
    isManuallyEntered: true,
  },
  postalAddressSameAsStreetAddress: true,
  contact: {},
  status: 'NotStarted',
};

interface AddBranchObservations {
  savedBodies: unknown[];
  signInCount: number;
  branchSelectorRequests: boolean[];
}

const state: { observed: AddBranchObservations } = {
  observed: { savedBodies: [], signInCount: 0, branchSelectorRequests: [] },
};

const resetObservations = () => {
  state.observed = {
    savedBodies: [],
    signInCount: 0,
    branchSelectorRequests: [],
  };
};

const branchHandlers = () => [
  http.get('/api/forms/accounts/branch', () =>
    HttpResponse.json({ id: 7, stepValues: branchStepValues }),
  ),
  http.put('/api/forms/accounts/branch-add/complete', async ({ request }) => {
    state.observed.savedBodies.push(await request.json());
    return new HttpResponse(null, { status: 204 });
  }),
  http.post('/api/users/sign-in', () => {
    state.observed.signInCount += 1;
    return HttpResponse.json({ defaultOrganisationId: 7 });
  }),
];

const meta = preview.meta({
  title: 'Routes/Account/AddBranch',
  component: AddBranch,
  decorators: [withPortalProviders],
  beforeEach: () => {
    resetObservations();
    return resetObservations;
  },
  parameters: {
    layout: 'fullscreen',
    portal: {
      authenticated: true,
      routePath: '/add-branch/*',
      initialEntries: ['/add-branch'],
      destinationRoutes: [{ path: '/', element: <h1>Home destination</h1> }],
      modalDispatch: {
        setShowBranchSelector: (show: boolean) => {
          state.observed.branchSelectorRequests.push(show);
        },
      },
    },
  },
});

export const LoadsBranchForm = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(...branchHandlers());
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByDisplayValue('Melbourne Laboratory'),
    ).toBeVisible();

    await expect(
      canvas.getByRole('button', { name: SAVE_BUTTON_NAME }),
    ).toBeEnabled();
  },
});

export const ConfirmationCancelThenConfirmAdds = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(...branchHandlers());
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByDisplayValue('Melbourne Laboratory');
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
      formStep: { branchOrLocationName: 'Melbourne Laboratory' },
    });
    await expect(state.observed.signInCount).toBe(1);
    await expect(state.observed.branchSelectorRequests).toEqual([true]);
  },
});
