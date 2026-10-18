import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { PageHeader } from './PageHeader';

const meta = {
  title: 'Components/React Aria/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {
  args: {
    title: 'Measurement services',
  },
  play: async ({ canvas }) => {
    const header = canvas.getByRole('banner');
    await expect(header).toBeInTheDocument();
    await expect(
      canvas.getByRole('heading', { name: 'Measurement services', level: 1 })
    ).toBeInTheDocument();
  },
};

export const WithContextAndActions: Story = {
  args: {
    actions: <button type='button'>Start a request</button>,
    description: 'Manage your applications and view the latest updates.',
    eyebrow: 'National Measurement Institute',
    title: 'Measurement services',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('National Measurement Institute')
    ).toBeInTheDocument();
    await expect(
      canvas.getByText('Manage your applications and view the latest updates.')
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('button', { name: 'Start a request' })
    ).toBeInTheDocument();
  },
};

export const LongContent: Story = {
  args: {
    description:
      'Use this heading state to check that long descriptive content wraps cleanly while the structural header and primary heading remain discoverable.',
    title: 'Applications and measurement service requests',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('banner')).toBeInTheDocument();
    await expect(
      canvas.getByRole('heading', {
        name: 'Applications and measurement service requests',
        level: 1,
      })
    ).toBeInTheDocument();
    await expect(
      canvas.getByText(
        'Use this heading state to check that long descriptive content wraps cleanly while the structural header and primary heading remain discoverable.'
      )
    ).toBeInTheDocument();
  },
};
