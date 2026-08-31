import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {Slider} from './Slider';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Slider',
  component: Slider,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof Slider>;

export default meta;

type Story = StoryFn<typeof Slider>;

export const Example: Story = args => <Slider {...args} style={{width: 200}} />;

Example.args = {
  label: 'Range',
  defaultValue: [30, 60],
  thumbLabels: ['start', 'end']
};
