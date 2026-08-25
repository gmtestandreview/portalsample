import type { Meta, StoryObj } from '@storybook/react-vite';
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
