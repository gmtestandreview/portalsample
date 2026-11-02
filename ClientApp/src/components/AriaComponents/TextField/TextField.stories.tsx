import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { TextField } from './TextField';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/TextField',
  component: TextField,
  parameters: {
    layout: 'centered',
  },
  args: {
    placeholder: 'Enter your full name',
  },
});

export const Example = meta.story({
  args: {
    label: 'Name',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Name' })).toBeVisible();
    await expect(
      canvas.getByPlaceholderText('Enter your full name'),
    ).toBeVisible();
  },
});
