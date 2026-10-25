import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Meter } from './Meter';
import type { StoryFn } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Meter',
  component: Meter,
  parameters: {
    layout: 'centered',
  },
});

type Story = StoryFn<typeof Meter>;

export const Example = meta.story({
  render: (args: Readonly<Parameters<Story>[0]>) => <Meter {...args} />,
  args: {
    label: 'Storage space',
    value: 80,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('meter')).toHaveAttribute(
      'aria-valuenow',
      '80',
    );
    await expect(canvas.getByText('Storage space')).toBeVisible();
  },
});
