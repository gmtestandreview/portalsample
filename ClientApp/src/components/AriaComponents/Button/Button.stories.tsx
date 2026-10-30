import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { expect, fn } from 'storybook/test';
import { Button } from './Button';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Button',
  component: Button,
  tags: ['ai-generated'],
  args: {
    onPress: fn(),
  },
});

export const Primary = meta.story({
  args: {
    children: 'Save changes',
  },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Save changes' });

    await expect(button).toHaveAccessibleName('Save changes');

    await userEvent.click(button);

    await expect(args.onPress).toHaveBeenCalledOnce();
  },
});

export const Secondary = meta.story({
  args: {
    children: 'Cancel',
    variant: 'secondary',
  },
});

export const Pending = meta.story({
  args: {
    children: 'Save changes',
    isPending: true,
  },
});
