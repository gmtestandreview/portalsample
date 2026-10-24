import preview from '../../../../.storybook/preview';
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

const meta = preview.meta({
  title: 'Components/Alert/NotificationMessage',
  component: NotificationMessage,
});


export const Success = meta.story({
  args: {
    severity: NotificationSeverity.Success,
    message: 'Your request was submitted successfully.',
    ariaLive: 'polite',
    role: 'status',
  },
  play: async ({
    canvas,
  }) => {
    const status = canvas.getByRole('status');

    await expect(
      canvas.getByText('Your request was submitted successfully.'),
    ).toBeVisible();
    await expect(status).toHaveAttribute('aria-live', 'polite');
  },
});

export const Information = meta.story({
  args: {
    severity: NotificationSeverity.Information,
    message: 'Your profile will be updated within 24 hours.',
    ariaLive: 'polite',
    role: 'status',
  },
  play: async ({
    canvas,
  }) => {
    await expect(
      canvas.getByText('Your profile will be updated within 24 hours.'),
    ).toBeVisible();
  },
});

export const Warning = meta.story({
  args: {
    severity: NotificationSeverity.Warning,
    message: 'Please review this warning before continuing.',
    ariaLive: 'polite',
    role: 'alert',
  },
  play: async ({
    canvas,
  }) => {
    await expect(
      canvas.getByText('Please review this warning before continuing.'),
    ).toBeVisible();
  },
});

export const ErrorMessage = meta.story({
  name: 'Error',
  args: {
    severity: NotificationSeverity.Error,
    message: 'Something went wrong. Please try again.',
    ariaLive: 'assertive',
    role: 'alert',
  },
  play: async ({
    canvas,
  }) => {
    await expect(
      canvas.getByText('Something went wrong. Please try again.'),
    ).toBeVisible();
  },
});

export const DismissibleError = meta.story({
  args: {
    severity: NotificationSeverity.Error,
    message:
      'Failed to save your changes. Please check your connection and try again.',
    ariaLive: 'assertive',
    role: 'alert',
    canClose: true,
    onClose: fn(),
  },
  play: async ({
    canvas,
  }) => {
    const closeButton = canvas.getByRole('button', { name: 'Close alert' });

    await expect(closeButton).toBeVisible();
  },
});
