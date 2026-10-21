import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Tag, TagGroup } from './TagGroup';
import { expect } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/TagGroup',
  component: TagGroup,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof TagGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Example: Story = {
  render: (args) => (
    <TagGroup {...args}>
      <Tag>Chocolate</Tag>
      <Tag>Mint</Tag>
      <Tag>Strawberry</Tag>
      <Tag>Vanilla</Tag>
    </TagGroup>
  ),
  args: {
    label: 'Ice cream flavor',
    selectionMode: 'single',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('grid', { name: 'Ice cream flavor' })
    ).toBeVisible();
    await expect(canvas.getByText('Chocolate')).toBeVisible();
  },
};
