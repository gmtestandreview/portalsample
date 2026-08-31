import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {ComboBox, ComboBoxItem} from './ComboBox';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ComboBox',
  component: ComboBox,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  args: {
    placeholder: 'Choose a flavor'
  }
} satisfies Meta<typeof ComboBox>;

export default meta;
type Story = StoryFn<typeof ComboBox>;

export const Example: Story = args => (
  <ComboBox {...args}>
    <ComboBoxItem>Chocolate</ComboBoxItem>
    <ComboBoxItem>Mint</ComboBoxItem>
    <ComboBoxItem>Strawberry</ComboBoxItem>
    <ComboBoxItem>Vanilla</ComboBoxItem>
  </ComboBox>
);

Example.args = {
  label: 'Ice cream flavor'
};
