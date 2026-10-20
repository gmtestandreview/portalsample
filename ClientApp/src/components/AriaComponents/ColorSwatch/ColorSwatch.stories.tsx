import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ColorSwatch } from './ColorSwatch';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorSwatch',
  component: ColorSwatch,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ColorSwatch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  args: {
    color: '#f00a',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('img', { name: 'vibrant red, 33% transparent' })
    ).toBeInTheDocument();
  },
};
