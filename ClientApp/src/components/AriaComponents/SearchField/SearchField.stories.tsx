import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { SearchField } from './SearchField';
import type { StoryFn } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/SearchField',
  component: SearchField,
  parameters: {
    layout: 'centered',
  },
});

type Story = StoryFn<typeof SearchField>;

export const Example = meta.story({
  render: (args: Readonly<Parameters<Story>[0]>) => <SearchField {...args} />,
  args: {
    label: 'Search',
    placeholder: 'Search documents',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('searchbox', { name: 'Search' }),
    ).toHaveAttribute('placeholder', 'Search documents');
  },
});
