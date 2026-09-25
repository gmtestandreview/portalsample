import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, waitFor } from 'storybook/test';
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
        // The announcement itself, not just the region's presence. The component seeds the
        // region with document.title and replaces it from a 100ms setTimeout, so this is the
        // only assertion here that reaches the settled state - and the one that stops that
        // timer firing after the story has ended.
        await waitFor(() => expect(status).toHaveTextContent(/^Navigated to .* page\.$/));
    },
};
