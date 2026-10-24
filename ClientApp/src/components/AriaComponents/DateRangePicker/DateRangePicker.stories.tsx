import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { DateRangePicker } from './DateRangePicker';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/DateRangePicker',
  component: DateRangePicker,
  parameters: {
    layout: 'centered',
  },
});

export const Example = meta.story({
  args: {
    label: 'Event date',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('group', { name: 'Event date' }),
    ).toBeVisible();
  },
});

export const WithDescription = meta.story({
  args: {
    label: 'Event date',
    description: 'Both ends of the range are included.',
  },

  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('Both ends of the range are included.'),
    ).toBeVisible();
  },
});

export const Invalid = meta.story({
  args: {
    label: 'Event date',
    isInvalid: true,
    errorMessage: 'The end date must follow the start date.',
  },

  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('The end date must follow the start date.'),
    ).toBeVisible();
  },
});
