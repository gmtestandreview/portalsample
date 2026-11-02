import { http, HttpResponse } from 'msw/http';
import { expect, waitFor, within } from 'storybook/test';
import preview from '../../../../../.storybook/preview';
import UpdateContact from '.';
import { withPortalProviders } from '../../../storybook/storybookHarness';

const SAVE_BUTTON_NAME = 'Save and close';
const CONFIRMATION_TITLE = 'Update contact confirmation';

const contactForm = {
  contact: {
    id: 5,
    title: 'Ms',
    firstName: 'Jordan',
    lastName: 'Rivera',
    phone: '0200000000',
    mobile: '0400000000',
    email: 'jordan.rivera@example.com',
  },
  formStepStatus: 'NotStarted',
};

interface UpdateContactObservations {
  savedBodies: unknown[];
  contactCompletedCount: number;
}

const state: { observed: UpdateContactObservations } = {
  observed: { savedBodies: [], contactCompletedCount: 0 },
};

const resetObservations = () => {
  state.observed = { savedBodies: [], contactCompletedCount: 0 };
};

const contactHandlers = (saveStatus: number) => [
  http.get('/api/contact/usercontact', () => HttpResponse.json(contactForm)),
  http.put('/api/contact/save-contact', async ({ request }) => {
    state.observed.savedBodies.push(await request.json());
    return saveStatus === 204
      ? new HttpResponse(null, { status: 204 })
      : HttpResponse.json({ title: 'Server error' }, { status: saveStatus });
  }),
];

const meta = preview.meta({
  title: 'Routes/Contact/Update',
  component: UpdateContact,
  decorators: [withPortalProviders],
  beforeEach: () => {
    resetObservations();
    return resetObservations;
  },
  parameters: {
    layout: 'fullscreen',
    portal: {
      authenticated: true,
      routePath: '/update-contact/*',
      initialEntries: ['/update-contact'],
      destinationRoutes: [{ path: '/', element: <h1>Home destination</h1> }],
      accountDispatch: {
        setContactCompleted: () => {
          state.observed.contactCompletedCount += 1;
        },
      },
    },
  },
});

const confirmSave = async (
  canvasElement: HTMLElement,
  userEvent: { click: (element: Element) => Promise<void> },
) => {
  const canvas = within(canvasElement);
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
};

export const LoadsExistingContact = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(...contactHandlers(204));
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByDisplayValue('Jordan')).toBeVisible();

    await expect(canvas.getByDisplayValue('Rivera')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: SAVE_BUTTON_NAME }),
    ).toBeEnabled();
  },
});

export const ConfirmationCancelThenConfirmSaves = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(...contactHandlers(204));
  },
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement);
    await canvas.findByDisplayValue('Jordan');
    await userEvent.click(
      await canvas.findByRole('button', { name: SAVE_BUTTON_NAME }),
    );
    await userEvent.click(
      within(
        await within(document.body).findByRole('dialog', {
          name: CONFIRMATION_TITLE,
        }),
      ).getByRole('button', { name: 'No, cancel' }),
    );

    await waitFor(() =>
      expect(
        within(document.body).queryByRole('dialog'),
      ).not.toBeInTheDocument(),
    );

    await expect(state.observed.savedBodies).toHaveLength(0);

    await confirmSave(canvasElement, userEvent);

    await expect(
      await canvas.findByRole('heading', { name: 'Home destination' }),
    ).toBeVisible();
    await expect(state.observed.savedBodies).toHaveLength(1);
    await expect(state.observed.savedBodies[0]).toMatchObject({
      formStep: { contact: { firstName: 'Jordan', lastName: 'Rivera' } },
    });
    await expect(state.observed.contactCompletedCount).toBe(1);
  },
});

export const SaveFailureStillCompletes = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(...contactHandlers(500));
  },
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement);
    await canvas.findByDisplayValue('Jordan');
    await confirmSave(canvasElement, userEvent);

    await expect(
      await canvas.findByRole('heading', { name: 'Home destination' }),
    ).toBeVisible();
    await expect(state.observed.savedBodies).toHaveLength(1);
    await expect(state.observed.contactCompletedCount).toBe(0);
  },
});
