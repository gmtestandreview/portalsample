import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { NumberField } from './NumberField';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/NumberField',
  component: NumberField,
  parameters: {
    layout: 'centered',
  },
});

export const Example = meta.story({
  args: {
    label: 'Cookies',
    placeholder: '-',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('textbox', { name: 'Cookies' }),
    ).toBeVisible();
  },
});
