import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import NotificationMessage from './NotificationMessage';
import { NotificationSeverity } from '../../storage/types';

/**
 * NotificationMessage Component Storybook Configuration
 *
 * This file defines the Storybook stories for the NotificationMessage component, which displays notification messages with different severity levels.
 * The stories demonstrate various notification types, including success, information, warning, and error messages, as well as a dismissible error message.
 * 
 * @module NotificationMessage.stories
 * @prop {Meta} meta - Storybook metadata for the NotificationMessage component.
 * @prop {StoryObj} Success - Story demonstrating a success notification message.
 * @prop {StoryObj} Information - Story demonstrating an information notification message.
 * @prop {StoryObj} Warning - Story demonstrating a warning notification message.
 * @prop {StoryObj} ErrorMessage - Story demonstrating an error notification message.
 * @prop {StoryObj} DismissibleError - Story demonstrating a dismissible error notification message with a close button.
 */

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
