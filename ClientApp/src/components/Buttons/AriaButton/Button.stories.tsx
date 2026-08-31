import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Button } from './Button';

const meta = {
  component: Button,
  tags: ['ai-generated'],
  args: {
    onPress: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Save changes',
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save changes' }));
    await expect(args.onPress).toHaveBeenCalledOnce();
  },
};

export const Secondary: Story = {
  args: {
    children: 'Cancel',
    variant: 'secondary',
  },
};

export const Pending: Story = {
  args: {
    children: 'Save changes',
    isPending: true,
  },
};

export const CssCheck: Story = {
  args: {
    children: 'Styled button',
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Styled button' });
    await expect(getComputedStyle(button).borderRadius).toBe('8px');
  },
};
