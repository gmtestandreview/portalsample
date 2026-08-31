import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar } from './Calendar';

const meta = {
  component: Calendar,
  tags: ['ai-generated'],
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    'aria-label': 'Appointment date',
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
