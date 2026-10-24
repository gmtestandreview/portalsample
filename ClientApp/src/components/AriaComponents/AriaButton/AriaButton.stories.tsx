import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Button } from './Button';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Components/AriaComponents/AriaButton',
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Save changes',
    onPress: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Save changes' });
    await userEvent.click(button);

    await expect(args.onPress).toHaveBeenCalledOnce();
  },
};

export const KeyboardActivation: Story = {
  args: {
    children: 'Continue',
    onPress: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Continue' });
    await userEvent.tab();

    await expect(button).toHaveFocus();

    await userEvent.keyboard('{Enter}');

    await expect(args.onPress).toHaveBeenCalledOnce();
  },
};

export const Disabled: Story = {
  args: {
    children: 'Unavailable',
    isDisabled: true,
    onPress: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Unavailable' });

    await expect(button).toBeDisabled();

    await userEvent.click(button);

    await expect(args.onPress).not.toHaveBeenCalled();
  },
};

export const Pending: Story = {
  args: {
    children: 'Save changes',
    isPending: true,
    onPress: fn(),
  },
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button');
    const progress = canvas.getByRole('progressbar', { name: 'Saving...' });

    await expect(progress).toBeInTheDocument();
    await expect(button).not.toBeDisabled();

    await userEvent.tab();

    await expect(button).toHaveFocus();
    await expect(button).not.toHaveTextContent('Save changes');
  },
};
