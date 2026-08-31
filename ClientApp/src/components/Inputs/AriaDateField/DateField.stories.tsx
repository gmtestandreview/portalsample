import {withReactAriaEvaluation} from '../../../storybook/withReactAriaEvaluation';
import {DateField} from './DateField';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/DateField',
  component: DateField,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof DateField>;

export default meta;
type Story = StoryFn<typeof DateField>;

export const Example: Story = args => <DateField {...args} />;

Example.args = {
  label: 'Event date'
};
