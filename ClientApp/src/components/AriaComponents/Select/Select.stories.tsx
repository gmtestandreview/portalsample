import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Select, SelectItem } from './Select';
import type { StoryFn } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
});

type Story = StoryFn<typeof Select>;

export const Example = meta.story({
  render: (args: Readonly<Parameters<Story>[0]>) => (
    <Select {...args}>
      <SelectItem>Chocolate</SelectItem>
      <SelectItem>Mint</SelectItem>
      <SelectItem>Strawberry</SelectItem>
      <SelectItem>Vanilla</SelectItem>
    </Select>
  ),
  args: {
    label: 'Ice cream flavor',
    children: null,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Ice cream flavor')).toBeVisible();
    await expect(canvas.getByText('Select an item')).toBeVisible();
  },
});
