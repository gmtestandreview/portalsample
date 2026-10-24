import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ProgressBar } from './ProgressBar';
import type { StoryFn } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'centered',
  },
});

type Story = StoryFn<typeof ProgressBar>;

export const Example = meta.story({
  render: (args: Readonly<Parameters<Story>[0]>) => <ProgressBar {...args} />,
  args: {
    label: 'Loading…',
    value: 80,
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('progressbar', { name: 'Loading…' }),
    ).toHaveAttribute('aria-valuenow', '80');
  },
});
