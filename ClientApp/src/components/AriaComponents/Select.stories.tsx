import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {Select, SelectItem} from './Select';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Select',
  component: Select,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryFn<typeof Select>;

export const Example: Story = args => (
  <Select {...args}>
    <SelectItem>Chocolate</SelectItem>
    <SelectItem>Mint</SelectItem>
    <SelectItem>Strawberry</SelectItem>
    <SelectItem>Vanilla</SelectItem>
  </Select>
);

Example.args = {
  label: 'Ice cream flavor'
};
