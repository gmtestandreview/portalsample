import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { TimeField } from './TimeField';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/TimeField',
  component: TimeField,
  parameters: {
    layout: 'centered',
  },
});

export const Example = meta.story({
  args: {
    label: 'Event time',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('group', { name: 'Event time' }),
    ).toBeVisible();
  },
});
