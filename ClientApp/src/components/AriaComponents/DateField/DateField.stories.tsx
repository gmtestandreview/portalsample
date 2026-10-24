import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { DateField } from './DateField';
import type { StoryFn } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/DateField',
  component: DateField,
  parameters: {
    layout: 'centered',
  },
});

type Story = StoryFn<typeof DateField>;

export const Example = meta.story({
  render: (args: Readonly<Parameters<Story>[0]>) => <DateField {...args} />,
  args: {
    label: 'Event date',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Event date')).toBeVisible();
  },
});

export const WithDescription = meta.story({
  args: {
    label: 'Event date',
    description: 'Use the date shown on your certificate.',
  },

  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('Use the date shown on your certificate.'),
    ).toBeVisible();
  },
});

export const Invalid = meta.story({
  args: {
    label: 'Event date',
    isInvalid: true,
    errorMessage: 'Enter a date that has already passed.',
  },

  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('Enter a date that has already passed.'),
    ).toBeVisible();
  },
});
