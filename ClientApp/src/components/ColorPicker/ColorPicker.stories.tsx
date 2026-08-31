import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {ColorPicker} from './ColorPicker';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorPicker',
  component: ColorPicker,
  parameters: {
    layout: 'centered'
  },
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryFn<typeof ColorPicker>;

export const Example: Story = args => <ColorPicker {...args} />;

Example.args = {
  label: 'Fill color',
  defaultValue: '#f00'
};
