import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { http, HttpResponse } from 'msw';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import ApplicationMessages from './appMessages';

/**
 * `ApplicationMessages` is the "Messages" tab of the type-approval management surface.
 * It provides a rich-text composer (the `SlateEditor`) plus a paged thread of messages
 * between the applicant and NMI. The story loads an empty thread and exercises the composer.
 */
const meta = {
    title: 'Routes/TypeApproval/Manage/ApplicationMessages',
    component: ApplicationMessages,
    decorators: [withPortalProviders],
    beforeEach({ msw }) {
        msw.use(http.get('/api/request-for-pattern-approval/PA-1/app-messages', () => HttpResponse.json({
            requestForPatternApprovalMessageDetails: {
                currentPage: 1,
                totalPages: 1,
                totalCount: 0,
                items: [],
            },
        })));
    },
    parameters: {
        layout: 'fullscreen',
        portal: {
            authenticated: true,
            initialEntries: ['/ta/PA-1/manage?tab=messages'],
            routePath: '/ta/:id/manage',
        },
    },
} satisfies Meta<typeof ApplicationMessages>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MessagesTab: Story = {
    play: async ({ canvas }) => {
        await expect(await canvas.findByText('No messages to display')).toBeVisible();
        await expect(canvas.getByRole('combobox', { name: 'Select your view' })).toBeEnabled();
        await userEvent.type(canvas.getByRole('textbox', { name: 'Message NMI' }), 'Hi');
        await expect(canvas.getByText(/^9\s*\//)).toBeVisible();
    },
};
