import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { withPortalProviders } from '../../storybook/storybookHarness';
import PreApplication from './preApplication';

/**
 * `PreApplication` is the pattern/type-approval pre-application landing page. It frames
 * what an applicant needs before starting (documents, certification procedures) and
 * provides the entry point into the application wizard. It is mostly static content
 * behind the breadcrumb and page banner.
 */
const meta = {
    title: 'Routes/TypeApproval/PreApplication',
    component: PreApplication,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
        portal: {
            authenticated: true,
            initialEntries: ['/ta/type-approval-create-pre'],
        },
    },
} satisfies Meta<typeof PreApplication>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('heading', { level: 1, name: /pattern\/type approval/i })).toBeVisible();
        await expect(canvas.getByRole('heading', { name: /what you may need/i })).toBeVisible();
    },
};
