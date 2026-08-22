import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import Home from './Home';
import { withPortalProviders } from '../storybook/storybookHarness';

/**
 * `Home` is the root (`/`) landing surface. It is a thin wrapper that renders the
 * auth-aware `GetStarted` call-to-action, so its coverage mirrors the unauthenticated
 * public-landing experience.
 */
const meta = {
    title: 'Components/Home',
    component: Home,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
        portal: {
            authenticated: false,
            initialEntries: ['/'],
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Home>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PublicLanding: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // GetStarted renders a heading; assert the landing surface mounts.
        const heading = await canvas.findByRole('heading', { level: 1 });
        await expect(heading).toBeVisible();
    },
};
