import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { withPortalProviders } from '../../storybook/storybookHarness';
import DashboardTa from './dashboard-ta';

/**
 * `DashboardTa` is the authenticated pattern/type-approval dashboard. It frames the
 * organisation banner, quick links and the tabbed PA request list with search/filter
 * controls. The request lists load from APIs not served in Storybook, so the story
 * documents the framed dashboard shell.
 */
const meta = {
    title: 'Routes/Dashboard/DashboardTypeApproval',
    component: DashboardTa,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
        portal: {
            authenticated: true,
            initialEntries: ['/dashboard-ta'],
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof DashboardTa>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Shell: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('heading', { name: 'Quick links' })).toBeVisible();
        await expect(canvas.getByText(/your feedback about using the portal/i)).toBeInTheDocument();
    },
};
