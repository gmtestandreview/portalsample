import type { Meta, StoryObj } from '@storybook/react-vite';
import BlockUISpinner from './index';

const meta = {
    title: 'Components/BlockUISpinner',
    component: BlockUISpinner,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        children: <p>Loading data...</p>,
    },
    tags: ['autodocs'],
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
