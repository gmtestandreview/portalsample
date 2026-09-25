import {withReactAriaEvaluation} from '../../../storybook/withReactAriaEvaluation';
import {DatePicker} from './DatePicker';
import type {Meta, StoryFn} from '@storybook/react-vite';
import {expect} from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/DatePicker',
  component: DatePicker,
  parameters: {
    layout: 'centered'
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryFn<typeof DatePicker>;

export const Example: Story = args => <DatePicker {...args} />;

Example.args = {
  label: 'Event date'
};

export const WithDescription: Story = args => <DatePicker {...args} />;

WithDescription.args = {
  label: 'Event date',
  description: 'Pick the date the instrument was tested.'
};

WithDescription.play = async ({canvas}) => {
  await expect(canvas.getByText('Pick the date the instrument was tested.')).toBeVisible();
};

export const Invalid: Story = args => <DatePicker {...args} />;

Invalid.args = {
  label: 'Event date',
  isInvalid: true,
  errorMessage: 'Choose a date on or before today.'
};

Invalid.play = async ({canvas}) => {
  await expect(canvas.getByText('Choose a date on or before today.')).toBeVisible();
};
