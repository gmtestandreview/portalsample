import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {ProgressBar} from './ProgressBar';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryFn<typeof ProgressBar>;

export const Example: Story = args => <ProgressBar {...args} />;

Example.args = {
  label: 'Loading…',
  value: 80
};
