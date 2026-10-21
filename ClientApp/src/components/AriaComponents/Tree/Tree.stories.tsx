import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Tree, TreeItem } from './Tree';
import { expect } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Tree',
  component: Tree,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Tree>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Example: Story = {
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
};
