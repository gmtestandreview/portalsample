import type { Meta, StoryObj } from '@storybook/react-vite';
import BodyText from './index';

/**
 * BodyText Component Storybook Configuration
 * This file defines the Storybook stories for the BodyText component, which is used to display body text content in the UI.
 * The stories demonstrate the default and emphasized states of the BodyText component, allowing developers to visualize its behavior in different contexts.
 * @module BodyText.stories
 * @prop {Meta} meta - Storybook metadata for the BodyText component. 
 * @prop {StoryObj} Default - Story demonstrating the default state of the BodyText component.
 * @prop {StoryObj} Emphasis - Story demonstrating the emphasized state of the BodyText component.
 *
 */

const meta = {
    component: BodyText,
    tags: ['ai-generated', 'needs-work'],
} satisfies Meta<typeof BodyText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'This service helps organisations manage calibration and measurement requests.',
    },
};

export const Emphasis: Story = {
    args: {
        children: 'Read this guidance before continuing to the next step.',
        className: 'fw-bold',
    },
};
