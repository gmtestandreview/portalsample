import type { Meta, StoryObj } from '@storybook/react-vite';
import Actions from './index';
import { withPortalProviders } from '../../storybook/storybookHarness';

const actions = [
    { action: 'view', text: 'View details', route: '/quotation/Q-2024-000456' },
    { action: 'copy', text: 'Request recalibration' },
    { action: 'delete', text: 'Delete draft' },
];

const meta = {
    title: 'Components/Actions',
    component: Actions,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'centered',
    },
    args: {
        id: 'request-actions',
        dropDownActions: actions,
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Actions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextButton: Story = {};

export const IconButton: Story = {
    args: {
        as: 'icon',
        buttonAriaTitle: 'for request RFQ-2024-001234',
    },
};
