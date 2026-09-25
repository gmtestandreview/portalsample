import {withReactAriaEvaluation} from '../../../storybook/withReactAriaEvaluation';
import {DateRangePicker} from './DateRangePicker';
import type {Meta, StoryFn} from '@storybook/react-vite';
import {expect} from 'storybook/test';

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

export const WithDescription: Story = args => <DateRangePicker {...args} />;

WithDescription.args = {
  label: 'Event date',
  description: 'Both ends of the range are included.'
};

WithDescription.play = async ({canvas}) => {
  await expect(canvas.getByText('Both ends of the range are included.')).toBeVisible();
};

export const Invalid: Story = args => <DateRangePicker {...args} />;

Invalid.args = {
  label: 'Event date',
  isInvalid: true,
  errorMessage: 'The end date must follow the start date.'
};

Invalid.play = async ({canvas}) => {
  await expect(canvas.getByText('The end date must follow the start date.')).toBeVisible();
};
