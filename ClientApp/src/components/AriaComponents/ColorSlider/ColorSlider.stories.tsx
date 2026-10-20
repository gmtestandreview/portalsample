import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ColorSlider } from './ColorSlider';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorSlider',
  component: ColorSlider,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ColorSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  render: (args) => <ColorSlider {...args} style={{ width: 200 }} />,
  args: {
    label: 'Red Opacity',
    defaultValue: '#f00',
    channel: 'alpha',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('slider', { name: 'Red Opacity' })
    ).toBeInTheDocument();
  },
};
