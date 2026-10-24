import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { expect } from 'storybook/test';
import { Calendar } from './Calendar';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Calendar',
  component: Calendar,
  tags: ['ai-generated'],
});

export const Default = meta.story({
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
});

export const Disabled = meta.story({
  args: {
    'aria-label': 'Unavailable appointment date',
    isDisabled: true,
  },
});

export const Invalid = meta.story({
  args: {
    'aria-label': 'Appointment date with error',
    isInvalid: true,
    errorMessage: 'Choose an available date.',
  },
});
