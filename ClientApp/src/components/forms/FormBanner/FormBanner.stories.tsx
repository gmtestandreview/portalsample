import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import FormBanner from '.';

const meta = {
    title: 'Components/Forms/FormBanner',
    component: FormBanner,
    decorators: [withPortalProviders],
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta<typeof FormBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * SaveAndExit — shows the Save and Exit button in the form navbar.
 * Requires router context (useNavigate) provided by withPortalProviders.
 */
export const SaveAndExit: Story = {
    // SaveAndExitButton calls useFormikContext() — Formik context is required.
    parameters: {
        portal: {
            formik: { initialValues: {} },
        },
    },
    args: {
        title: 'Request for Quote',
        refTitle: 'RFQ-2024-001',
        showSaveAndExitButton: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // The form actions toolbar should render
        const toolbar = canvas.getByRole('toolbar', { name: /form actions/i });
        await expect(toolbar).toBeInTheDocument();
    },
};

/**
 * GoToDashboard — shows the "Go to dashboard" link button in the form navbar.
 */
export const GoToDashboard: Story = {
    args: {
        title: 'Service Quote',
        refTitle: 'SQ-2024-042',
        showGoToDashboardButton: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const dashboardLink = canvas.getByTestId('form-go-to-dashboard-portal-button');
        await expect(dashboardLink).toBeInTheDocument();
        await expect(dashboardLink).toHaveTextContent(/go to dashboard/i);
    },
};

/**
 * WithDiscard — shows a Discard changes button that navigates to locationOnDiscard
 * when clicked.
 */
export const WithDiscard: Story = {
    args: {
        title: 'Measurement Report',
        refTitle: 'MR-2024-007',
        discard: {
            locationOnDiscard: '/',
            discardButtonTitle: 'Discard changes',
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const discardButton = canvas.getByTestId('discard-changes-button');
        await expect(discardButton).toBeInTheDocument();
        await expect(discardButton).toHaveTextContent(/discard changes/i);
    },
};

/**
 * TitleOnly — renders the banner with just a title and reference, no action buttons.
 */
export const TitleOnly: Story = {
    args: {
        title: 'Request for Quote',
        refTitle: 'RFQ-2024-001',
    },
};
