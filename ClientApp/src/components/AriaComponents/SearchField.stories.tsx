import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {SearchField} from './SearchField';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/SearchField',
  component: SearchField,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof SearchField>;

export default meta;

type Story = StoryFn<typeof SearchField>;

export const Example: Story = args => <SearchField {...args} />;

Example.args = {
  label: 'Search',
  placeholder: 'Search documents'
};
