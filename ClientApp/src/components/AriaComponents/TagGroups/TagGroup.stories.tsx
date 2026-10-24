import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Tag, TagGroup } from './TagGroup';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/TagGroup',
  component: TagGroup,
  parameters: {
    layout: 'centered',
  },
});

export const Example = meta.story({
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
      canvas.getByRole('grid', { name: 'Ice cream flavor' }),
    ).toBeVisible();
    await expect(canvas.getByText('Chocolate')).toBeVisible();
  },
});
