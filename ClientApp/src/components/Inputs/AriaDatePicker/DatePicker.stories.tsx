import {withReactAriaEvaluation} from '../../../storybook/withReactAriaEvaluation';
import {DatePicker} from './DatePicker';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/DatePicker',
  component: DatePicker,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryFn<typeof DatePicker>;

export const Example: Story = args => <DatePicker {...args} />;

Example.args = {
  label: 'Event date'
};
