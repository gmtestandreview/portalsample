import {withReactAriaEvaluation} from '../../../storybook/withReactAriaEvaluation';
import {DateField} from './DateField';
import type {Meta, StoryFn} from '@storybook/react-vite';
import {expect} from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/DateField',
  component: DateField,
  parameters: {
    layout: 'centered'
  },
} satisfies Meta<typeof DateField>;

export default meta;
type Story = StoryFn<typeof DateField>;

export const Example: Story = args => <DateField {...args} />;

Example.args = {
  label: 'Event date'
};

export const WithDescription: Story = args => <DateField {...args} />;

WithDescription.args = {
  label: 'Event date',
  description: 'Use the date shown on your certificate.'
};

WithDescription.play = async ({canvas}) => {
  await expect(canvas.getByText('Use the date shown on your certificate.')).toBeVisible();
};

export const Invalid: Story = args => <DateField {...args} />;

Invalid.args = {
  label: 'Event date',
  isInvalid: true,
  errorMessage: 'Enter a date that has already passed.'
};

Invalid.play = async ({canvas}) => {
  await expect(canvas.getByText('Enter a date that has already passed.')).toBeVisible();
};
