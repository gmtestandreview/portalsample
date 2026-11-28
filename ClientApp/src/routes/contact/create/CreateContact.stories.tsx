import { http, HttpResponse } from 'msw/http';
import { expect, waitFor, within } from 'storybook/test';
import preview from '../../../../../.storybook/preview';
import CreateContact from '.';
import { withPortalProviders } from '../../../storybook/storybookHarness';

const CREATE_BUTTON_NAME = 'Create account';
const CONFIRMATION_TITLE = 'Create contact confirmation';

const contactForm = {
  contact: {
    title: 'Mr',
    firstName: 'Taylor',
    lastName: 'Nguyen',
    phone: '0200000000',
    mobile: '0400000000',
    email: 'taylor.nguyen@example.com',
  },
  formStepStatus: 'NotStarted',
};

interface CreateContactObservations {
  savedBodies: unknown[];
  contactCompletedCount: number;
}

const state: { observed: CreateContactObservations } = {
  observed: { savedBodies: [], contactCompletedCount: 0 },
};

const resetObservations = () => {
  state.observed = { savedBodies: [], contactCompletedCount: 0 };
};

const contactHandlers = (form: Record<string, unknown>) => [
  http.get('/api/contact/usercontact', () => HttpResponse.json(form)),
  http.put('/api/contact/save-contact', async ({ request }) => {
    state.observed.savedBodies.push(await request.json());
    return new HttpResponse(null, { status: 204 });
  }),
];

const meta = preview.meta({
  title: 'Routes/Contact/Create',
  component: CreateContact,
  decorators: [withPortalProviders],
  beforeEach: () => {
    resetObservations();
    return resetObservations;
  },
  parameters: {
    layout: 'fullscreen',
    portal: {
      authenticated: true,
      routePath: '/create-contact/*',
      initialEntries: ['/create-contact'],
      destinationRoutes: [
        {
          path: '/success-creating-account',
          element: <h1>Contact created destination</h1>,
        },
      ],
      accountDispatch: {
        setContactCompleted: () => {
          state.observed.contactCompletedCount += 1;
        },
      },
    },
  },
});

export const InvalidSubmitBlocksConfirmation = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(
      ...contactHandlers({
        ...contactForm,
        contact: { ...contactForm.contact, firstName: '' },
      }),
    );
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByDisplayValue('Nguyen');
    await userEvent.click(
      await canvas.findByRole('button', { name: CREATE_BUTTON_NAME }),
    );

    await expect(
      await canvas.findByRole('link', {
        name: 'Contact: First name is required',
      }),
    ).toBeVisible();
    await expect(
      within(document.body).queryByRole('dialog'),
    ).not.toBeInTheDocument();
    await expect(state.observed.savedBodies).toHaveLength(0);
  },
});

export const ConfirmCreatesContact = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(...contactHandlers(contactForm));
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByDisplayValue('Taylor');
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
        name: 'Contact created destination',
      }),
    ).toBeVisible();
    await expect(state.observed.savedBodies).toHaveLength(1);
    await expect(state.observed.savedBodies[0]).toEqual({
      formStep: contactForm,
    });
    await expect(state.observed.contactCompletedCount).toBe(1);
  },
});

export const HiddenOtherTitleIsOmittedFromPayload = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(
      ...contactHandlers({
        ...contactForm,
        contact: { ...contactForm.contact, titleOther: 'Chief' },
      }),
    );
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByDisplayValue('Taylor');
    await expect(canvas.queryByLabelText('If "Other"')).not.toBeInTheDocument();

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
        name: 'Contact created destination',
      }),
    ).toBeVisible();
    await expect(state.observed.savedBodies).toEqual([
      { formStep: contactForm },
    ]);
  },
});

export const InvalidSubmitShowsInlineFieldErrors = meta.story({
  parameters: { docs: { story: { inline: false } } },
  beforeEach({ msw }) {
    msw.use(
      ...contactHandlers({
        ...contactForm,
        contact: {
          ...contactForm.contact,
          firstName: '',
          lastName: '',
          email: '',
        },
      }),
    );
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByDisplayValue(/0400/);
    await userEvent.click(
      await canvas.findByRole('button', { name: CREATE_BUTTON_NAME }),
    );

    const firstName = await canvas.findByRole('textbox', {
      name: 'First name',
    });

    await waitFor(() =>
      expect(firstName).toHaveAttribute('aria-invalid', 'true'),
    );
    await expect(firstName).toHaveAccessibleDescription(
      'First name is required',
    );

    const lastName = canvas.getByRole('textbox', { name: 'Last name' });

    await expect(lastName).toHaveAttribute('aria-invalid', 'true');
    await expect(lastName).toHaveAccessibleDescription('Last name is required');

    const email = canvas.getByRole('textbox', { name: 'Email address' });

    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAccessibleDescription(
      /Email address is required/,
    );
  },
});
