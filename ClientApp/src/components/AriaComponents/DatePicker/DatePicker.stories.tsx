import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { DatePicker } from './DatePicker';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/DatePicker',
  component: DatePicker,
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
    description: 'Pick the date the instrument was tested.',
  },

  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('Pick the date the instrument was tested.'),
    ).toBeVisible();
  },
});

export const Invalid = meta.story({
  args: {
    label: 'Event date',
    isInvalid: true,
    errorMessage: 'Choose a date on or before today.',
  },

  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('Choose a date on or before today.'),
    ).toBeVisible();
  },
});
