import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import NotificationMessage from './NotificationMessage';
import { NotificationSeverity } from '../../storage/types';

const meta = {
    title: 'Components/Alert/NotificationMessage',
    component: NotificationMessage,
    tags: ['autodocs'],
} satisfies Meta<typeof NotificationMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
    args: {
        severity: NotificationSeverity.Success,
        message: 'Your request was submitted successfully.',
        ariaLive: 'polite',
        role: 'status',
    },
    play: async ({ canvas }) => {
        const status = canvas.getByRole('status');
        await expect(status).toHaveAttribute('aria-live', 'polite');
    },
};

export const Information: Story = {
    args: {
        severity: NotificationSeverity.Information,
        message: 'Your profile will be updated within 24 hours.',
        ariaLive: 'polite',
        role: 'status',
    },
};

export const Warning: Story = {
    args: {
        severity: NotificationSeverity.Warning,
        message: 'Please review this warning before continuing.',
        ariaLive: 'polite',
        role: 'alert',
    },
};

export const ErrorMessage: Story = {
    name: 'Error',
    args: {
        severity: NotificationSeverity.Error,
        message: 'Something went wrong. Please try again.',
        ariaLive: 'assertive',
        role: 'alert',
    },
};

export const DismissibleError: Story = {
    args: {
        severity: NotificationSeverity.Error,
        message: 'Failed to save your changes. Please check your connection and try again.',
        ariaLive: 'assertive',
        role: 'alert',
        canClose: true,
        onClose: fn(),
    },
    play: async ({ canvas }) => {
        const closeButton = canvas.getByRole('button', { name: /close/i });
        await expect(closeButton).toBeVisible();
    },
};
