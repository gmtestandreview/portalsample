import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ColorArea } from './ColorArea';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorArea',
  component: ColorArea,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ColorArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  render: (args) => <ColorArea {...args} style={{ width: 200 }} />,
  args: {
    defaultValue: 'hsl(30, 100%, 50%)',
  },
  play: async ({ canvas }) => {
    const colorArea = canvas.getByRole('group');
    const marker = 'group';

    await expect(colorArea).toBeInTheDocument();
    await expect(colorArea).toHaveAttribute('role', marker);
  },
};
