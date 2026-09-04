import type { Meta, StoryObj } from '@storybook/react-vite';
import AccountCreated from './created';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = {
    title: 'Routes/Account/AccountCreated',
    component: AccountCreated,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
        portal: {
            initialEntries: ['/success-creating-account'],
        },
    },
} satisfies Meta<typeof AccountCreated>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
