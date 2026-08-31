import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {Tag, TagGroup} from './TagGroup';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/TagGroup',
  component: TagGroup,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof TagGroup>;

export default meta;

type Story = StoryFn<typeof TagGroup>;

export const Example: Story = args => (
  <TagGroup {...args}>
    <Tag>Chocolate</Tag>
    <Tag>Mint</Tag>
    <Tag>Strawberry</Tag>
    <Tag>Vanilla</Tag>
  </TagGroup>
);

Example.args = {
  label: 'Ice cream flavor',
  selectionMode: 'single'
};
