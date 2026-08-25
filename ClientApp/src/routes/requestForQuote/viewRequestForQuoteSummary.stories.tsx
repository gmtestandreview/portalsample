import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { withPortalProviders } from '../../storybook/storybookHarness';
import ViewRequestForQuoteSummary from './viewRequestForQuoteSummary';

/**
 * `ViewRequestForQuoteSummary` is the read-only summary of a submitted request-for-quote,
 * presented inside the wizard shell. It loads the request's step statuses before
 * rendering the summary; until those statuses resolve it shows a full-screen busy
 * overlay. In Storybook the step-status API is not served, so the story documents that
 * loading state.
 */
const meta = {
    title: 'Routes/RequestForQuote/ViewRequestForQuoteSummary',
    component: ViewRequestForQuoteSummary,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
        portal: {
            authenticated: true,
            initialEntries: ['/request-for-quote/QR-1/view-summary'],
        },
    },
    args: {
        isSubmitted: true,
    },
} satisfies Meta<typeof ViewRequestForQuoteSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Loading...')).toBeVisible();
    },
};
