import preview from '../../../../.storybook/preview';
import { expect } from 'storybook/test';
import { AlertMessage } from './AlertMessage';

const meta = preview.meta({
  title: 'Components/React Aria/AlertMessage',
  component: AlertMessage,
});

export const Default = meta.story({
  args: {
    children: 'Your request has been saved.',
    title: 'Request saved',
  },
  play: async ({ canvas }) => {
    const message = canvas.getByRole('status');

    await expect(message).toHaveAttribute('aria-live', 'polite');
    await expect(message).toHaveAttribute('data-tone', 'info');
    await expect(
      canvas.getByRole('heading', { name: 'Request saved', level: 2 }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByText('Your request has been saved.'),
    ).toBeInTheDocument();
  },
});

export const WarningTone = meta.story({
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
});

export const LongMessage = meta.story({
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
      }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByText(
        'This message contains additional context so the status remains readable when the content wraps across multiple lines in a narrow layout.',
      ),
    ).toBeInTheDocument();
  },
});
