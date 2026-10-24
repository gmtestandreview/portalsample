import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { StatusPill } from './StatusPill';

const meta = {
  title: 'Components/React Aria/StatusPill',
  component: StatusPill,
} satisfies Meta<typeof StatusPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
  args: {
    children: 'In progress',
  },
  play: async ({ canvas }) => {
    const pill = canvas.getByText('In progress');

    await expect(pill.tagName).toBe('SPAN');
    await expect(pill).toHaveAttribute('data-tone', 'neutral');
    await expect(pill).not.toHaveAttribute('role');
    await expect(pill).not.toHaveAttribute('aria-live');
  },
};

export const ToneVariants: Story = {
  args: {
    children: 'Tone variants',
  },
  render: () => (
    <div>
      <StatusPill tone='success'>Approved</StatusPill>
      <StatusPill tone='warning'>Needs review</StatusPill>
      <StatusPill>In progress</StatusPill>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Approved')).toHaveAttribute(
      'data-tone',
      'success'
    );
    await expect(canvas.getByText('Needs review')).toHaveAttribute(
      'data-tone',
      'warning'
    );
    await expect(canvas.getByText('In progress')).toHaveAttribute(
      'data-tone',
      'neutral'
    );
  },
};

export const LongLabel: Story = {
  args: {
    children:
      'Awaiting confirmation from the responsible measurement services team',
    tone: 'warning',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText(
        'Awaiting confirmation from the responsible measurement services team'
      )
    ).toHaveAttribute('data-tone', 'warning');
  },
};
