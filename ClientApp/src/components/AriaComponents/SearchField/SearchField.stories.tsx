import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { SearchField } from './SearchField';
import type { Meta, StoryFn, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/SearchField',
  component: SearchField,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SearchField>;

export default meta;

type Story = StoryFn<typeof SearchField>;

export const Example = {
  render: (args: Readonly<Parameters<Story>[0]>) => <SearchField {...args} />,
  args: {
    label: 'Search',
    placeholder: 'Search documents',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('searchbox', { name: 'Search' })
    ).toHaveAttribute('placeholder', 'Search documents');
  },
} satisfies StoryObj<typeof meta>;
