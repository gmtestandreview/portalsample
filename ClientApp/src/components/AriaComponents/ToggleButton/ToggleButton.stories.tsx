import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ToggleButton } from './ToggleButton';
import { expect, userEvent } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ToggleButton',
  component: ToggleButton,
  parameters: {
    layout: 'centered',
  },
});

export const Example = meta.story({
  render: (args) => <ToggleButton {...args}>Pin</ToggleButton>,
  play: async ({ canvas }) => {
    const user = userEvent.setup();
    const button = canvas.getByRole('button', { name: 'Pin' });

    await expect(canvas.getByRole('button', { name: 'Pin' })).toBeVisible();

    await user.click(button);

    await expect(button).toHaveAttribute('aria-pressed', 'true');
  },
});
