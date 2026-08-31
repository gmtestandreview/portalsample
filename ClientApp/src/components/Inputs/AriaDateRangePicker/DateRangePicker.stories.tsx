import {withReactAriaEvaluation} from '../../../storybook/withReactAriaEvaluation';
import {DateRangePicker} from './DateRangePicker';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/DateRangePicker',
  component: DateRangePicker,
  parameters: {
    layout: 'centered'
  },
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryFn<typeof DateRangePicker>;

export const Example: Story = args => <DateRangePicker {...args} />;

Example.args = {
  label: 'Event date'
};
