import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { NumberField } from './NumberField';
import { expect } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/NumberField',
  component: NumberField,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  args: {
    label: 'Cookies',
    placeholder: '-',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('textbox', { name: 'Cookies' })
    ).toBeVisible();
  },
};
