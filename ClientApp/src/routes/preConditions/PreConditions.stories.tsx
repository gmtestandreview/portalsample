import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, waitFor } from 'storybook/test';
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

const meta = {
    title: 'Routes/PreConditions',
    component: PreConditions,
    decorators: [withPortalProviders],
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
        children: <div data-testid='protected-content'>Protected dashboard content</div>,
    },
} satisfies Meta<typeof PreConditions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RendersProtectedContent: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByTestId('protected-content')).toBeVisible();
        await expect(canvas.getByText('Protected dashboard content')).toBeVisible();
        // Both assertions above pass on the first render. The route announcement does not:
        // useRouteAccessibility starts it empty and fills it from a 100ms setTimeout, which
        // is what left PreConditions and Layout updating after the story had ended.
        await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent(/^Navigated to .* page\.$/));
    },
};
