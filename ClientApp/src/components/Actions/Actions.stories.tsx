import preview from '../../../../.storybook/preview';
import { expect } from 'storybook/test';
import Actions from './index';
import { withPortalProviders } from '../../storybook/storybookHarness';

/**
 * Actions Component Storybook Configuration
 *
 * This file defines the Storybook stories for the Actions component, which provides a dropdown menu of actions that can be performed on a specific item.
 * The stories demonstrate both text button and icon button variations of the Actions component, allowing developers to visualize its behavior in different contexts.
 *
 * @module Actions.stories
 * @prop {Meta} meta - Storybook metadata for the Actions component.
 * @prop {StoryObj} TextButton - Story demonstrating the text button variation of the Actions component.
 * @prop {StoryObj} IconButton - Story demonstrating the icon button variation of the Actions component.
 *
 */

const actions = [
  { action: 'view', text: 'View details', route: '/quotation/Q-2024-000456' },
  { action: 'copy', text: 'Request recalibration' },
  { action: 'delete', text: 'Delete draft' },
];

const meta = preview.meta({
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
});


export const TextButton = meta.story({
  play: async ({
    canvas,
  }) => {
    await canvas.getByRole('button', { name: 'Actions' }).click();

    await expect(
      canvas.getByRole('menuitem', { name: 'View details' }),
    ).toBeVisible();
  },
});

export const IconButton = meta.story({
  args: {
    as: 'icon',
    buttonAriaTitle: 'for request RFQ-2024-001234',
  },
  play: async ({
    canvas,
  }) => {
    await canvas
      .getByRole('button', { name: 'Actions for request RFQ-2024-001234' })
      .click();

    await expect(
      canvas.getByRole('menuitem', { name: 'Delete draft' }),
    ).toBeVisible();
  },
});
