import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {RangeCalendar} from './RangeCalendar';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/RangeCalendar',
  component: RangeCalendar,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof RangeCalendar>;

export default meta;

type Story = StoryFn<typeof RangeCalendar>;

export const Example: Story = args => <RangeCalendar aria-label="Trip dates" {...args} />;
