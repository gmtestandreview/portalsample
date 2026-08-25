import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import RouteAccessibleNavigation from './routeAccessibleNavigation';

/**
 * `RouteAccessibleNavigation` is a non-visual accessibility helper. It renders a
 * visually-hidden `role="status"` / `aria-live="polite"` region that announces the
 * current page title to assistive technology after each route change. It is included
 * in Storybook because it affects screen-reader behaviour during migration even
 * though it has no visible surface.
 */
const meta = {
    title: 'Components/Utilities/RouteAccessibleNavigation',
    component: RouteAccessibleNavigation,
    parameters: {
        layout: 'centered',
        // The default preview decorator supplies a router so useLocation resolves.
        portal: {
            initialEntries: ['/dashboard'],
        },
    },
} satisfies Meta<typeof RouteAccessibleNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LiveRegion: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // The announcer is a polite live region exposed to assistive technology only.
        const status = canvas.getByRole('status');
        await expect(status).toHaveAttribute('aria-live', 'polite');
        await expect(status).toHaveClass('visually-hidden');
    },
};
