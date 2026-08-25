import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import ApplicationMessages from './appMessages';

/**
 * `ApplicationMessages` is the "Messages" tab of the type-approval management surface.
 * It provides a rich-text composer (the `SlateEditor`) plus a paged thread of messages
 * between the applicant and NMI. The story renders the editor/toolbar shell; the
 * message thread is loaded from an API not served in Storybook.
 */
const meta = {
    title: 'Routes/TypeApproval/Manage/ApplicationMessages',
    component: ApplicationMessages,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
        portal: {
            authenticated: true,
            initialEntries: ['/ta/PA-1/manage?tab=messages'],
        },
    },
} satisfies Meta<typeof ApplicationMessages>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MessagesTab: Story = {
    play: async ({ canvasElement }) => {
        // The composer/thread regions mount even before the message API resolves.
        await expect(canvasElement.querySelector('#appl-messages-editor')).toBeInTheDocument();
        await expect(canvasElement.querySelector('#application-messages')).toBeInTheDocument();
    },
};
