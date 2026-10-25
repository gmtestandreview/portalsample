import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Tree, TreeItem } from './Tree';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Tree',
  component: Tree,
  parameters: {
    layout: 'centered',
  },
});

export const Example = meta.story({
  render: (args) => (
    <Tree aria-label='Files' {...args}>
      <TreeItem title='Documents'>
        <TreeItem title='Project'>
          <TreeItem title='Weekly Report' />
        </TreeItem>
      </TreeItem>
      <TreeItem title='Photos'>
        <TreeItem title='Image 1' />
        <TreeItem title='Image 2' />
      </TreeItem>
    </Tree>
  ),
  args: {
    style: { height: '300px' },
    defaultExpandedKeys: ['documents', 'photos', 'project'],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('treegrid', { name: 'Files' })).toBeVisible();
    await expect(canvas.getByRole('row', { name: 'Documents' })).toBeVisible();
  },
});
