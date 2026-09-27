import { withReactAriaEvaluation } from '../../storybook/withReactAriaEvaluation';
import { NumberField } from './NumberField';
import type { Meta, StoryFn } from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/NumberField',
  component: NumberField,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryFn<typeof NumberField>;

export const Example: Story = (args: Readonly<Parameters<Story>[0]>) => (
  <NumberField {...args} />
);

Example.args = {
  label: 'Cookies',
  placeholder: '-',
};
