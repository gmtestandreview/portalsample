import type { Meta, StoryObj } from '@storybook/react-vite';
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

export const Default: Story = {};
