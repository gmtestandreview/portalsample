import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import ApplicationDocuments from './appDocuments';

/**
 * `ApplicationDocuments` is the "Documents" tab of the type-approval management surface.
 * It loads the application's supporting documents into a Formik form and lets the
 * applicant add/commit additional certificates. The story renders the tab shell; the
 * document list is loaded from an API not served in Storybook.
 */
const meta = {
    title: 'Routes/TypeApproval/Manage/ApplicationDocuments',
    component: ApplicationDocuments,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
        portal: {
            authenticated: true,
            initialEntries: ['/ta/PA-1/manage?tab=documents'],
        },
    },
} satisfies Meta<typeof ApplicationDocuments>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DocumentsTab: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('heading', { name: 'Documents' })).toBeInTheDocument();
    },
};
