import { expect } from 'storybook/test';
import preview from '../../../../../.storybook/preview';
import TypeApprovalCreated from '.';
import { withPortalProviders } from '../../../storybook/storybookHarness';

const TAB_AFTER_SAVE_KEY = 'set-tabop-after-save';
const SUBMITTED_REFERENCE = 'TA-2024-000789';

const DashboardDestination = () => <h1>Pattern approval dashboard</h1>;

const meta = preview.meta({
  title: 'Routes/TypeApproval/Created',
  component: TypeApprovalCreated,
  decorators: [withPortalProviders],
  beforeEach: () => {
    globalThis.sessionStorage.removeItem(TAB_AFTER_SAVE_KEY);
    return () => globalThis.sessionStorage.removeItem(TAB_AFTER_SAVE_KEY);
  },
  parameters: {
    layout: 'fullscreen',
    portal: {
      authenticated: true,
      routePath: '/ta/type-approval-success/:id/*',
      initialEntries: [`/ta/type-approval-success/${SUBMITTED_REFERENCE}`],
      destinationRoutes: [
        { path: '/dashboard-ta', element: <DashboardDestination /> },
      ],
    },
  },
});

export const SubmittedReference = meta.story({
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', {
        name: 'Your application has been submitted',
      }),
    ).toBeVisible();
    await expect(canvas.getByText(SUBMITTED_REFERENCE)).toBeVisible();
    await expect(
      canvas.getByText(`Ref ID: ${SUBMITTED_REFERENCE}`),
    ).toBeVisible();
  },
});

export const DashboardButton = meta.story({
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('go-to-dashboard-button'));

    await expect(
      await canvas.findByRole('heading', {
        name: 'Pattern approval dashboard',
      }),
    ).toBeVisible();
    await expect(globalThis.sessionStorage.getItem(TAB_AFTER_SAVE_KEY)).toBe(
      JSON.stringify('requests'),
    );
  },
});

export const DashboardLink = meta.story({
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      await canvas.findByRole('link', { name: 'dashboard' }),
    );

    await expect(
      await canvas.findByRole('heading', {
        name: 'Pattern approval dashboard',
      }),
    ).toBeVisible();
    await expect(globalThis.sessionStorage.getItem(TAB_AFTER_SAVE_KEY)).toBe(
      JSON.stringify('requests'),
    );
  },
});
