import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {ColorArea} from './ColorArea';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorArea',
  component: ColorArea,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof ColorArea>;

export default meta;
type Story = StoryFn<typeof ColorArea>;

export const Example: Story = args => <ColorArea {...args} style={{width: 200}} />;

Example.args = {
  defaultValue: 'hsl(30, 100%, 50%)'
};
