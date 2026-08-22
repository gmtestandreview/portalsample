import type { Meta, StoryObj } from '@storybook/react-vite';
import HeaderIntroText from './index';

const meta = {
    component: HeaderIntroText,
    tags: ['ai-generated', 'needs-work', 'docs'],
} satisfies Meta<typeof HeaderIntroText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'Use this portal to submit and manage your service requests.',
    },
};

export const WithClass: Story = {
    args: {
        children: 'This guide explains account setup and access management.',
        className: 'mb-0',
    },
};
