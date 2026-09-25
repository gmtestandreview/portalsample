import type { Meta, StoryObj } from '@storybook/react-vite';
import SecondaryButton from './index';

/**
 * SecondaryButton Component Storybook Configuration
 * This file defines the Storybook stories for the SecondaryButton component, which is a button styled as a secondary action in the UI.
 * The stories demonstrate the default and disabled states of the SecondaryButton, allowing developers to visualize its behavior in different contexts.
 * @module SecondaryButton.stories
 * @prop {Meta} meta - Storybook metadata for the SecondaryButton component.
 * @prop {StoryObj} Default - Story demonstrating the default state of the SecondaryButton.
 * @prop {StoryObj} Disabled - Story demonstrating the disabled state of the SecondaryButton.
 *
 */

const meta = {
    component: SecondaryButton,
    tags: ['ai-generated', 'needs-work'],
} satisfies Meta<typeof SecondaryButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'Cancel',
    },
};

export const Disabled: Story = {
    args: {
        children: 'Cancel',
        disabled: true,
    },
};
