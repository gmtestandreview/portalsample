import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {TextField} from './TextField';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/TextField',
  component: TextField,
  parameters: {
    layout: 'centered'
  },
  args: {
    placeholder: 'Enter your full name'
  }
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryFn<typeof TextField>;

export const Example: Story = args => <TextField {...args} />;

Example.args = {
  label: 'Name'
};
