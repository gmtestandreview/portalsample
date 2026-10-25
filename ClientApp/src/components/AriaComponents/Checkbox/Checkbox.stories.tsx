import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Checkbox } from './Checkbox';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
});

export const Example = meta.story({
  render: (args) => <Checkbox {...args}>Unsubscribe</Checkbox>,
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('checkbox', { name: 'Unsubscribe' }),
    ).toBeInTheDocument();
  },
});

export const Indeterminate = meta.story({
  render: (args) => <Checkbox {...args}>Unsubscribe</Checkbox>,
  args: {
    isIndeterminate: true,
  },
  play: async ({ canvas }) => {
    // The indeterminate state draws a dash rather than a tick, so it renders a different mark.
    await expect(
      canvas.getByRole('checkbox', { name: 'Unsubscribe' }),
    ).toBePartiallyChecked();
  },
});

export const WithDescription = meta.story({
  render: (args) => <Checkbox {...args}>Unsubscribe</Checkbox>,
  args: {
    description: 'You can resubscribe at any time.',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('You can resubscribe at any time.'),
    ).toBeVisible();
  },
});
