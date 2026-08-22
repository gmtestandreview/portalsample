import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { withPortalProviders } from '../../storybook/storybookHarness';
import RequestForQuoteSummary from './requestForQuoteSummary';

/**
 * `RequestForQuoteSummary` is the review surface of the request-for-quote wizard. It
 * presents the captured Organisation/Contact and Instrument/Request sections inside
 * accordions. While editable it shows review guidance and per-section Edit buttons;
 * once submitted it swaps those for a "Back to dashboard" link. Its summary children
 * are Formik-bound, so the story supplies a matching context.
 */
const meta = {
    title: 'Routes/RequestForQuote/RequestForQuoteSummary',
    component: RequestForQuoteSummary,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
        portal: {
            initialEntries: ['/request-for-quote/QR-1/view-summary'],
            formik: {
                initialValues: {
                    organisationAndContact: {},
                    instrumentAndRequest: {},
                },
            },
        },
    },
    args: {
        isSubmitted: false,
    },
    tags: ['autodocs'],
} satisfies Meta<typeof RequestForQuoteSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Editable: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Organisation and Contact')).toBeVisible();
        await expect(canvas.getByText('Instrument and Request')).toBeVisible();
        // Review guidance is shown while still editable.
        await expect(canvas.getByText(/before you submit your request/i)).toBeVisible();
    },
};

export const Submitted: Story = {
    args: {
        isSubmitted: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Submitted view replaces guidance/edit with a back-to-dashboard link.
        await expect(canvas.getByTestId('back-button')).toBeVisible();
        await expect(canvas.queryByText(/before you submit your request/i)).toBeNull();
    },
};
