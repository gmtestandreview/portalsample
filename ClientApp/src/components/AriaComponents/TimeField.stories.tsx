import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {TimeField} from './TimeField';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/TimeField',
  component: TimeField,
  parameters: {
    layout: 'centered'
  },
} satisfies Meta<typeof TimeField>;

export default meta;

type Story = StoryFn<typeof TimeField>;

export const Example: Story = args => <TimeField {...args} />;

Example.args = {
  label: 'Event time'
};
