import type { Meta, StoryObj } from '@storybook/react-vite';
import SecondaryButton from './index';

const meta = {
    component: SecondaryButton,
    tags: ['ai-generated', 'needs-work', 'docs'],
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
