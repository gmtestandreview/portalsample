import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { AlertError, AlertInfo, AlertSuccess, AlertWarning } from './index';

const meta = {
    component: AlertInfo,
    tags: ['ai-generated', 'needs-work', 'docs', '!autodocs'],
} satisfies Meta<typeof AlertInfo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
    args: {
        children: 'This is informational guidance for users.',
    },
};

export const Success: Story = {
    render: (args) => <AlertSuccess {...args} />,
    args: {
        children: 'Saved successfully.',
    },
};

export const Warning: Story = {
    render: (args) => <AlertWarning {...args} />,
    args: {
        children: 'Please review this warning before you continue.',
    },
};

export const ErrorDismissible: Story = {
    render: (args) => <AlertError {...args} />,
    args: {
        children: 'Something went wrong. Try again shortly.',
        canClose: true,
    },
    play: async ({ canvas }) => {
        const closeButton = canvas.getByRole('button', { name: /close/i });
        await expect(closeButton).toBeVisible();
    },
};
