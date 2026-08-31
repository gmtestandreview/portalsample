import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {ColorField} from './ColorField';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorField',
  component: ColorField,
  parameters: {
    layout: 'centered'
  },
  args: {
    placeholder: 'Enter a color'
  }
} satisfies Meta<typeof ColorField>;

export default meta;
type Story = StoryFn<typeof ColorField>;

export const Example: Story = args => <ColorField {...args} />;

Example.args = {
  label: 'Color'
};
