import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { TextField } from './TextField';
import { expect } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/TextField',
  component: TextField,
  parameters: {
    layout: 'centered',
  },
  args: {
    placeholder: 'Enter your full name',
  },
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Example: Story = {
  args: {
    label: 'Name',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Name' })).toBeVisible();
    await expect(
      canvas.getByPlaceholderText('Enter your full name')
    ).toBeVisible();
  },
};
