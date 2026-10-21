import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ProgressBar } from './ProgressBar';
import type { Meta, StoryFn, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryFn<typeof ProgressBar>;

export const Example = {
  render: (args: Readonly<Parameters<Story>[0]>) => <ProgressBar {...args} />,
  args: {
    label: 'Loading…',
    value: 80,
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('progressbar', { name: 'Loading…' })
    ).toHaveAttribute('aria-valuenow', '80');
  },
} satisfies StoryObj<typeof meta>;
