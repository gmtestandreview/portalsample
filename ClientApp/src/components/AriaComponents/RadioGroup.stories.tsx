import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {RadioGroup, Radio} from './RadioGroup';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryFn<typeof RadioGroup>;

export const Example: Story = args => (
  <RadioGroup {...args}>
    <Radio value="soccer">Soccer</Radio>
    <Radio value="baseball">Baseball</Radio>
    <Radio value="basketball">Basketball</Radio>
  </RadioGroup>
);

Example.args = {
  label: 'Favorite sport'
};
