import type { Meta, StoryObj } from '@storybook/react-vite';
import BlockUISpinner from './index';

/**
 * BlockUISpinner Component Storybook Configuration
 *
 * This file defines the Storybook stories for the BlockUISpinner component, which displays a loading spinner that can block the entire UI or a specific section based on the `partial` prop.
 * 
 * The stories demonstrate both full-page and inline usage of the BlockUISpinner component, allowing developers to visualize its behavior in different contexts.
 * 
 * @module BlockUISpinner.stories 
 * @prop {Meta} meta - Storybook metadata for the BlockUISpinner component.
 * @prop {StoryObj} FullPage - Story demonstrating the full-page spinner usage.
 * @prop {StoryObj} Inline - Story demonstrating the inline spinner usage with a specific section of the UI.
 *
 */

const meta = {
    title: 'Components/BlockUISpinner',
    component: BlockUISpinner,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        children: <p>Loading data...</p>,
    },
} satisfies Meta<typeof BlockUISpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullPage: Story = {};

export const Inline: Story = {
    args: {
        partial: true,
        children: <p>Refreshing results...</p>,
    },
    render: (args) => (
        <div className='p-5' style={{ minHeight: 240, maxWidth: 640 }}>
            <BlockUISpinner {...args} />
        </div>
    ),
};
