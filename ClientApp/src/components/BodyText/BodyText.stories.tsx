import type { Meta, StoryObj } from '@storybook/react-vite';
import BodyText from './index';

const meta = {
    component: BodyText,
    tags: ['ai-generated', 'needs-work', 'docs'],
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
