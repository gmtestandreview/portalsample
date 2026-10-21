import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Meter } from './Meter';
import type { Meta, StoryFn, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Meter',
  component: Meter,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Meter>;

export default meta;
type Story = StoryFn<typeof Meter>;

export const Example = {
  render: (args: Readonly<Parameters<Story>[0]>) => <Meter {...args} />,
  args: {
    label: 'Storage space',
    value: 80,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('meter')).toHaveAttribute(
      'aria-valuenow',
      '80'
    );
    await expect(canvas.getByText('Storage space')).toBeVisible();
  },
} satisfies StoryObj<typeof meta>;
