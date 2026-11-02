import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ToggleButtonGroup } from './ToggleButtonGroup';
import { ToggleButton } from '../ToggleButton/ToggleButton';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ToggleButtonGroup',
  component: ToggleButtonGroup,
  parameters: {
    layout: 'centered',
  },
});

export const Example = meta.story({
  render: (args) => (
    <ToggleButtonGroup {...args}>
      <ToggleButton id='left'>Left</ToggleButton>
      <ToggleButton id='center'>Center</ToggleButton>
      <ToggleButton id='right'>Right</ToggleButton>
    </ToggleButtonGroup>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'Left' })).toBeVisible();
    await expect(canvas.getByRole('radio', { name: 'Right' })).toBeVisible();
  },
});
