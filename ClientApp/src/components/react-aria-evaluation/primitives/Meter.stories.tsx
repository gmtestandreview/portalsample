import type { Meta, StoryFn } from '@storybook/react-vite';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation.tsx';
import { Meter } from './Meter.tsx';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Meter',
  component: Meter,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Meter>;

export default meta;
type Story = StoryFn<typeof Meter>;

export const Example: Story = (args) => <Meter {...args} />;

Example.args = {
  label: 'Storage space',
  value: 80,
};
