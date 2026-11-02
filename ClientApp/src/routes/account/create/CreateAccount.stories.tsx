import { http, HttpResponse } from 'msw/http';
import { expect, waitFor, within } from 'storybook/test';
import preview from '../../../../../.storybook/preview';
import CreateAccount from '.';
import { withPortalProviders } from '../../../storybook/storybookHarness';

const CREATE_BUTTON_NAME = 'Create account';
const CONFIRMATION_TITLE = 'Create account confirmation';

const validStepValues = {
  id: 11,
  abn: '12345678901',
  name: 'Calibration Services Pty Ltd',
  businessOrTradingName: 'Calibration Services',
  branchOrLocationName: 'Sydney Laboratory',
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
  status: 'NotStarted',
};

interface CreateAccountObservations {
  savedBodies: unknown[];
  organisationAndBranch: Array<[string, string, string]>;
  completedCount: number;
}

const state: { observed: CreateAccountObservations } = {
  observed: { savedBodies: [], organisationAndBranch: [], completedCount: 0 },
};

const resetObservations = () => {
  state.observed = {
    savedBodies: [],
    organisationAndBranch: [],
    completedCount: 0,
  };
};

const accountHandlers = (stepValues: Record<string, unknown>) => [
  http.get('/api/forms/accounts/create-account/new', () =>
    HttpResponse.json({ id: 11, stepValues }),
  ),
  http.put(
    '/api/forms/accounts/create-account/complete',
    async ({ request }) => {
      state.observed.savedBodies.push(await request.json());
      return new HttpResponse(null, { status: 204 });
    },
  ),
];

const meta = preview.meta({
  title: 'Routes/Account/Create',
  component: CreateAccount,
  decorators: [withPortalProviders],
  beforeEach: () => {
    resetObservations();
    return resetObservations;
  },
  parameters: {
    layout: 'fullscreen',
    portal: {
      authenticated: true,
      routePath: '/create-account/*',
      initialEntries: ['/create-account'],
      destinationRoutes: [
        {
          path: '/success-creating-account',
          element: <h1>Account created destination</h1>,
        },
      ],
      accountDispatch: {
        setOrganisationAndBranch: (
          name: string,
          tradingName: string,
          branchName: string,
        ) => {
          state.observed.organisationAndBranch.push([
            name,
            tradingName,
            branchName,
          ]);
        },
        setCompleted: () => {
          state.observed.completedCount += 1;
        },
      },
    },
  },
});

export const InvalidSubmitBlocksConfirmation = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(...accountHandlers({ ...validStepValues, streetAddress: {} }));
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByDisplayValue('Calibration Services');
    await userEvent.click(
      await canvas.findByRole('button', { name: CREATE_BUTTON_NAME }),
    );

    await expect(
      await canvas.findByRole('link', {
        name: 'Street address: Street address is required',
      }),
    ).toBeVisible();
    await expect(
      within(document.body).queryByRole('dialog'),
    ).not.toBeInTheDocument();
    await expect(state.observed.savedBodies).toHaveLength(0);
  },
});

export const ConfirmCreatesAccount = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(...accountHandlers(validStepValues));
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByDisplayValue('Calibration Services');
    await userEvent.click(
      await canvas.findByRole('button', { name: CREATE_BUTTON_NAME }),
    );
    await userEvent.click(
      within(
        await within(document.body).findByRole('dialog', {
          name: CONFIRMATION_TITLE,
        }),
      ).getByRole('button', { name: 'Yes, submit' }),
    );

    await expect(
      await canvas.findByRole('heading', {
        name: 'Account created destination',
      }),
    ).toBeVisible();

    await waitFor(() => expect(state.observed.savedBodies).toHaveLength(1));

    await expect(state.observed.savedBodies[0]).toMatchObject({
      formStep: { id: 11, name: 'Calibration Services Pty Ltd' },
    });
    await expect(state.observed.organisationAndBranch).toEqual([
      [
        'Calibration Services Pty Ltd',
        'Calibration Services',
        'Sydney Laboratory',
      ],
    ]);
    await expect(state.observed.completedCount).toBe(1);
  },
});
