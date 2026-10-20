import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ColorWheel } from './ColorWheel';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorWheel',
  component: ColorWheel,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ColorWheel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  args: {
    defaultValue: 'hsl(30, 100%, 50%)',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('slider', { name: 'Hue' })
    ).toBeInTheDocument();
  },
};
