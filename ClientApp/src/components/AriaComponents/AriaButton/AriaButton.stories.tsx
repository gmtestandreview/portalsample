import preview from '../../../../../.storybook/preview';
import { expect, fn } from 'storybook/test';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Button } from './Button';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Components/AriaComponents/AriaButton',
  component: Button,
});

export const Primary = meta.story({
  args: {
    children: 'Save changes',
    onPress: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Save changes' });
    await userEvent.click(button);

    await expect(args.onPress).toHaveBeenCalledOnce();
  },
});

export const KeyboardActivation = meta.story({
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
});

export const Disabled = meta.story({
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
});

export const Pending = meta.story({
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
});
