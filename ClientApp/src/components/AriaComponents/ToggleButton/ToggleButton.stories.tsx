import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ToggleButton } from './ToggleButton';
import { expect } from 'storybook/test';

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
    const button = canvas.getByRole('button', { name: 'Pin' });

    await expect(button).toBeVisible();

    await button.click();

    await expect(button).toHaveAttribute('aria-pressed', 'true');
  },
});
