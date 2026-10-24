import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { AlertMessage } from './AlertMessage';

const meta = {
  title: 'Components/React Aria/AlertMessage',
  component: AlertMessage,
} satisfies Meta<typeof AlertMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Your request has been saved.',
    title: 'Request saved',
  },
  play: async ({ canvas }) => {
    const message = canvas.getByRole('status');

    await expect(message).toHaveAttribute('aria-live', 'polite');
    await expect(message).toHaveAttribute('data-tone', 'info');
    await expect(
      canvas.getByRole('heading', { name: 'Request saved', level: 2 })
    ).toBeInTheDocument();
    await expect(
      canvas.getByText('Your request has been saved.')
    ).toBeInTheDocument();
  },
};

export const WarningTone: Story = {
  args: {
    children: 'Review the highlighted fields before continuing.',
    title: 'Review required',
    tone: 'warning',
  },
  play: async ({ canvas }) => {
    const message = canvas.getByRole('status');

    await expect(message).toHaveAttribute('data-tone', 'warning');
    await expect(message).toHaveAttribute('aria-live', 'polite');
  },
};

export const LongMessage: Story = {
  args: {
    children:
      'This message contains additional context so the status remains readable when the content wraps across multiple lines in a narrow layout.',
    title: 'Additional information',
    tone: 'success',
  },
  play: async ({ canvas }) => {
    const message = canvas.getByRole('status');

    await expect(message).toHaveAttribute('data-tone', 'success');
    await expect(
      canvas.getByRole('heading', {
        name: 'Additional information',
        level: 2,
      })
    ).toBeInTheDocument();
    await expect(
      canvas.getByText(
        'This message contains additional context so the status remains readable when the content wraps across multiple lines in a narrow layout.'
      )
    ).toBeInTheDocument();
  },
};
