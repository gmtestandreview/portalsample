import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ToggleButton } from './ToggleButton';
import { expect } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ToggleButton',
  component: ToggleButton,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ToggleButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Example: Story = {
  render: (args) => <ToggleButton {...args}>Pin</ToggleButton>,
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Pin' });

    await expect(button).toBeVisible();

    await button.click();

    await expect(button).toHaveAttribute('aria-pressed', 'true');
  },
};
