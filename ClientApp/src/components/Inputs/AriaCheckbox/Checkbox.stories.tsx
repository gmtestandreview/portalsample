import {withReactAriaEvaluation} from '../../../storybook/withReactAriaEvaluation';
import {Checkbox} from './Checkbox';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryFn<typeof Checkbox>;

export const Example: Story = args => <Checkbox {...args}>Unsubscribe</Checkbox>;
