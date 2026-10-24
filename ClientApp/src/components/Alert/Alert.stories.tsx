import preview from '../../../../.storybook/preview';
import { expect } from 'storybook/test';
import { AlertError, AlertInfo, AlertSuccess, AlertWarning } from './index';

/**
 * Alert Component Storybook Configuration
 * This file defines the Storybook stories for the Alert component, which displays different types of alert messages to users.
 * The stories demonstrate informational, success, warning, and error alerts, allowing developers to visualize their behavior in different contexts.
 * @module Alert.stories
 * @prop {Meta} meta - Storybook metadata for the Alert component.
 * @prop {StoryObj} Info - Story demonstrating an informational alert message.
 * @prop {StoryObj} Success - Story demonstrating a success alert message.
 * @prop {StoryObj} Warning - Story demonstrating a warning alert message.
 * @prop {StoryObj} Error - Story demonstrating an error alert message.
 */

const meta = preview.meta({
  component: AlertInfo,
  tags: ['ai-generated', 'needs-work', '!autodocs'],
});


export const Info = meta.story({
  args: {
    children: 'This is informational guidance for users.',
  },
  play: async ({
    canvas,
  }) => {
    await expect(
      canvas.getByText('This is informational guidance for users.'),
    ).toBeVisible();
  },
});

export const Success = meta.story({
  render: (args) => (
    <AlertSuccess {...args} />
  ),
  args: {
    children: 'Saved successfully.',
  },
  play: async ({
    canvas,
  }) => {
    await expect(canvas.getByText('Saved successfully.')).toBeVisible();
  },
});

export const Warning = meta.story({
  render: (args) => (
    <AlertWarning {...args} />
  ),
  args: {
    children: 'Please review this warning before you continue.',
  },
  play: async ({
    canvas,
  }) => {
    await expect(
      canvas.getByText('Please review this warning before you continue.'),
    ).toBeVisible();
  },
});

export const ErrorDismissible = meta.story({
  render: (args) => (
    <AlertError {...args} />
  ),
  args: {
    children: 'Something went wrong. Try again shortly.',
    canClose: true,
  },
  play: async ({
    canvas,
  }) => {
    const closeButton = canvas.getByRole('button', { name: 'Close alert' });

    await expect(closeButton).toBeVisible();
  },
});
