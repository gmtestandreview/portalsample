import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ColorPicker } from './ColorPicker';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorPicker',
  component: ColorPicker,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  args: {
    label: 'Fill color',
    defaultValue: '#f00',
  },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', {
      name: 'vibrant red Fill color',
    });

    await userEvent.click(trigger);

    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  },
};
