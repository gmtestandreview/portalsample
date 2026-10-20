import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Calendar } from './Calendar';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Calendar',
  component: Calendar,
  tags: ['ai-generated'],
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    'aria-label': 'Appointment date',
  },
  play: async ({ canvas }) => {
    const calendar = canvas.getByRole('grid', {
      name: 'Appointment date, April 2024',
    });
    const cells = canvas.getAllByRole('gridcell');

    await expect(calendar).toBeInTheDocument();
    await expect(cells.length).toBeGreaterThan(0);
  },
};

export const Disabled: Story = {
  args: {
    'aria-label': 'Unavailable appointment date',
    isDisabled: true,
  },
};

export const Invalid: Story = {
  args: {
    'aria-label': 'Appointment date with error',
    isInvalid: true,
    errorMessage: 'Choose an available date.',
  },
};
