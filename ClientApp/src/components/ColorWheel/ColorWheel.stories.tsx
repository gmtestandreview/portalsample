import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {ColorWheel} from './ColorWheel';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorWheel',
  component: ColorWheel,
  parameters: {
    layout: 'centered'
  },
} satisfies Meta<typeof ColorWheel>;

export default meta;
type Story = StoryFn<typeof ColorWheel>;

export const Example: Story = args => <ColorWheel {...args} />;

Example.args = {
  defaultValue: 'hsl(30, 100%, 50%)'
};
