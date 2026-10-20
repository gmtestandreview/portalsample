import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { RangeCalendar } from './RangeCalendar';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/RangeCalendar',
  component: RangeCalendar,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof RangeCalendar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Example: Story = {
  args: {
    'aria-label': 'Trip dates',
  },
  play: async ({ canvas }) => {
    const label = 'Trip dates';
    const rangeCalendar = canvas.getByRole('application', {
      name: new RegExp(label),
    });
    const cells = canvas.getAllByRole('gridcell');

    await expect(rangeCalendar).toBeInTheDocument();
    await expect(cells.length).toBeGreaterThan(0);
  },
};
export const Invalid: Story = {
  args: {
    'aria-label': 'Trip dates',
    isInvalid: true,
    errorMessage: 'Choose a range that starts today or later.',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('Choose a range that starts today or later.')
    ).toBeVisible();
  },
};
