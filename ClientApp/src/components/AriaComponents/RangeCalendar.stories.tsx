import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {RangeCalendar} from './RangeCalendar';
import type {Meta, StoryFn} from '@storybook/react-vite';
import {expect} from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/RangeCalendar',
  component: RangeCalendar,
  parameters: {
    layout: 'centered'
  },
} satisfies Meta<typeof RangeCalendar>;

export default meta;

type Story = StoryFn<typeof RangeCalendar>;

export const Example: Story = args => <RangeCalendar aria-label="Trip dates" {...args} />;

export const Invalid: Story = args => <RangeCalendar aria-label="Trip dates" {...args} />;

Invalid.args = {
  isInvalid: true,
  errorMessage: 'Choose a range that starts today or later.'
};

Invalid.play = async ({canvas}) => {
  await expect(canvas.getByText('Choose a range that starts today or later.')).toBeVisible();
};
