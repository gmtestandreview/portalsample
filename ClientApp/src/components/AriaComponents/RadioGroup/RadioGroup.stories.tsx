import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { RadioGroup, Radio } from './RadioGroup';
import { expect } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Example: Story = {
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
      canvas.getByRole('radiogroup', { name: 'Favorite sport' })
    ).toBeVisible();
    await expect(canvas.getByRole('radio', { name: 'Soccer' })).toBeVisible();
  },
};
