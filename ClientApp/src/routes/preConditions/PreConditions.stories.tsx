import preview from '../../../../.storybook/preview';
import { within, expect, waitFor, screen, userEvent } from 'storybook/test';
import { withPortalProviders } from '../../storybook/storybookHarness';
import PreConditions from './PreConditions';

/**
 * `PreConditions` is the authenticated route gate. It wraps protected content in the
 * global `Layout` and, based on account state, can redirect to account/contact creation
 * or surface the terms-of-use and branch-selector modals. With a fully-onboarded account
 * and accepted terms it simply renders the wrapped page, which is what this story shows.
 */
const onboardedAccount = {
  accountCreationCompleted: true,
  accountContactCompleted: true,
  userAcceptedTermsOfUse: true,
  defaultOrganisationId: 'org-1',
};

interface TermsObservations {
  requests: { method: string; url: string; body: unknown }[];
  agreeCount: number;
}

const observed: { current: TermsObservations } = {
  current: { requests: [], agreeCount: 0 },
};

const createTermsFetch =
  (status: number): typeof globalThis.fetch =>
  (input, init) => {
    let url: string;
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else {
      url = input.url;
    }
    observed.current.requests.push({
      method: init?.method ?? 'GET',
      url,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : null,
    });
    return Promise.resolve(new Response('', { status }));
  };

const termsGate = (status: number) => ({
  initialEntries: ['/dashboard'],
  accountDetails: {
    ...onboardedAccount,
    userAcceptedTermsOfUse: false,
    givenName: 'Taylor',
    familyName: 'Nguyen',
  },
  accountDispatch: {
    setAgree: () => {
      observed.current.agreeCount += 1;
    },
  },
  fetch: createTermsFetch(status),
});

const meta = preview.meta({
  title: 'Routes/PreConditions',
  component: PreConditions,
  decorators: [withPortalProviders],
  beforeEach() {
    observed.current = { requests: [], agreeCount: 0 };
    return () => {
      observed.current = { requests: [], agreeCount: 0 };
    };
  },
  parameters: {
    layout: 'fullscreen',
    portal: {
      authenticated: true,
      initialEntries: ['/dashboard'],
      accountDetails: onboardedAccount,
    },
  },
  args: {
    displayHeaderAndFooter: true,
    children: (
      <div data-testid='protected-content'>Protected dashboard content</div>
    ),
  },
});

export const RendersProtectedContent = meta.story({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId('protected-content')).toBeVisible();
    await expect(canvas.getByText('Protected dashboard content')).toBeVisible();

    // Both assertions above pass on the first render. The route announcement does not:
    // useRouteAccessibility starts it empty and fills it from a 100ms setTimeout, which
    // is what left PreConditions and Layout updating after the story had ended.
    await waitFor(() =>
      expect(canvas.getByRole('status')).toHaveTextContent(
        /^Navigated to .* page\.$/,
      ),
    );
  },
});

// Select the terms modal by its stable test id because the route can also open
// the branch selector dialog while the terms interaction is settling.
const findTermsDialog = async () => {
  const termsModal = await screen.findByTestId(
    'prompt-termsandcondition-modal',
  );
  const dialog = termsModal.closest('[role="dialog"]');

  await expect(dialog).not.toBeNull();

  if (!(dialog instanceof HTMLElement)) {
    throw new TypeError('Terms and conditions dialog was not rendered');
  }

  await waitFor(() => expect(dialog).toBeVisible());

  await expect(termsModal).toBeInTheDocument();

  return dialog;
};

const settleRouteAnnouncement = (canvasElement: HTMLElement) =>
  waitFor(() =>
    expect(
      within(canvasElement).getByRole('status', { hidden: true }),
    ).toHaveTextContent(/^Navigated to .* page\.$/),
  );

export const TermsOfUseAgree = meta.story({
  args: { displayHeaderAndFooter: false },
  parameters: { portal: termsGate(200) },
  play: async ({ canvasElement }) => {
    const dialog = await findTermsDialog();

    await expect(
      within(dialog).getByRole('heading', { name: /welcome, taylor nguyen/i }),
    ).toBeVisible();
    await expect(
      within(dialog)
        .getByText(/exit portal/i)
        .closest('a'),
    ).toHaveAttribute('href', '/sign-out');

    // keyboard={false}: Escape must not dismiss the terms gate
    await userEvent.keyboard('{Escape}');

    await expect(dialog).toBeVisible();
    await expect(observed.current.requests).toEqual([]);

    await userEvent.click(
      within(dialog).getByRole('button', { name: /agree and continue/i }),
    );
    await waitFor(() => expect(observed.current.agreeCount).toBe(1));

    await expect(observed.current.requests).toEqual([
      {
        method: 'PUT',
        url: '/api/users/accept-terms',
        body: { termsVersion: 1 },
      },
    ]);

    await settleRouteAnnouncement(canvasElement);
  },
});

export const TermsOfUseSaveFails = meta.story({
  args: { displayHeaderAndFooter: false },
  parameters: { portal: termsGate(500) },
  play: async ({ canvasElement }) => {
    const dialog = await findTermsDialog();
    await userEvent.click(
      within(dialog).getByRole('button', { name: /agree and continue/i }),
    );

    await expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      /error found trying to save terms and condition/i,
    );
    await expect(observed.current.requests).toHaveLength(1);
    await expect(observed.current.agreeCount).toBe(0);
    await expect(dialog).toBeVisible();

    await settleRouteAnnouncement(canvasElement);
  },
});
