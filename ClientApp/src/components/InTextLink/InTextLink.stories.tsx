import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import InTextLink from './index';

const meta = {
    component: InTextLink,
    tags: ['ai-generated', 'docs'],
} satisfies Meta<typeof InTextLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const External: Story = {
    args: {
        children: 'Read external guidance',
        href: 'https://www.measurement.gov.au/',
        target: '_blank',
    },
    play: async ({ canvas }) => {
        const link = canvas.getByRole('link', { name: /read external guidance/i });
        await expect(link).toHaveAttribute('rel', 'nofollow noreferrer noopener');
        await expect(link).toHaveAttribute('target', '_blank');
    },
};

export const SameTab: Story = {
    args: {
        children: 'View terms and conditions',
        href: 'https://www.measurement.gov.au/terms',
        target: '_self',
    },
    play: async ({ canvas }) => {
        const link = canvas.getByRole('link', { name: /view terms and conditions/i });
        await expect(link).toHaveAttribute('target', '_self');
    },
};

export const InlineText: Story = {
    args: {
        children: 'Open support content',
        href: 'https://www.measurement.gov.au/help',
    },
    play: async ({ canvas }) => {
        const link = canvas.getByRole('link', { name: /open support content/i });
        await expect(link).toBeVisible();
    },
};
