import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import ServicesWeOffer from './index';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = {
    title: 'Routes/ServicesWeOffer',
    component: ServicesWeOffer,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
        portal: {
            initialEntries: ['/services-we-offer'],
            accountDetails: {
                userProfile: { services: [] },
            },
        },
    },
} satisfies Meta<typeof ServicesWeOffer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        // The services lookup is not served here, so the route reaches its settled state
        // through the effect's finally rather than through rendered data. aria-busy is the
        // route's own contract for that: true while the lookup is in flight, false once it
        // resolves either way.
        const servicesRegion = canvasElement.querySelector('[aria-live="off"]');
        await waitFor(() => expect(servicesRegion).toHaveAttribute('aria-busy', 'false'));
    },
};
