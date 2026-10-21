import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { TimeField } from './TimeField';
import { expect } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/TimeField',
  component: TimeField,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof TimeField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Example: Story = {
  args: {
    label: 'Event time',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('group', { name: 'Event time' })
    ).toBeVisible();
  },
};
