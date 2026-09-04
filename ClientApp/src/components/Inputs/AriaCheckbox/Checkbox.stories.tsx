import {withReactAriaEvaluation} from '../../../storybook/withReactAriaEvaluation';
import {Checkbox} from './Checkbox';
import type {Meta, StoryFn} from '@storybook/react-vite';
import {expect} from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered'
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryFn<typeof Checkbox>;

export const Example: Story = args => <Checkbox {...args}>Unsubscribe</Checkbox>;

export const Indeterminate: Story = args => <Checkbox {...args}>Unsubscribe</Checkbox>;

Indeterminate.args = {
  isIndeterminate: true
};

Indeterminate.play = async ({canvas}) => {
  // The indeterminate state draws a dash rather than a tick, so it renders a different mark.
  await expect(canvas.getByRole('checkbox', {name: 'Unsubscribe'})).toBePartiallyChecked();
};

export const WithDescription: Story = args => <Checkbox {...args}>Unsubscribe</Checkbox>;

WithDescription.args = {
  description: 'You can resubscribe at any time.'
};

WithDescription.play = async ({canvas}) => {
  await expect(canvas.getByText('You can resubscribe at any time.')).toBeVisible();
};
