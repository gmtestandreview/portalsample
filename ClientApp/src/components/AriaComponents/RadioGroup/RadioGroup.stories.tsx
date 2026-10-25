import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { RadioGroup, Radio } from './RadioGroup';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
  },
});

export const Example = meta.story({
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value='soccer'>Soccer</Radio>
      <Radio value='baseball'>Baseball</Radio>
      <Radio value='basketball'>Basketball</Radio>
    </RadioGroup>
  ),
  args: {
    label: 'Favorite sport',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('radiogroup', { name: 'Favorite sport' }),
    ).toBeVisible();
    await expect(canvas.getByRole('radio', { name: 'Soccer' })).toBeVisible();
  },
});
