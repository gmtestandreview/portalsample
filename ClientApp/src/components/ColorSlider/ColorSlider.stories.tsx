import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {ColorSlider} from './ColorSlider';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorSlider',
  component: ColorSlider,
  parameters: {
    layout: 'centered'
  },
} satisfies Meta<typeof ColorSlider>;

export default meta;
type Story = StoryFn<typeof ColorSlider>;

export const Example: Story = args => <ColorSlider {...args} style={{width: 200}} />;

Example.args = {
  label: 'Red Opacity',
  defaultValue: '#f00',
  channel: 'alpha'
};
