import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ColorField } from './ColorField';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorField',
  component: ColorField,
  parameters: {
    layout: 'centered',
  },
  args: {
    placeholder: 'Enter a color',
  },
} satisfies Meta<typeof ColorField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  render: (args) => <ColorField {...args} />,
  args: {
    label: 'Color',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('textbox', { name: 'Color' })
    ).toBeInTheDocument();
  },
};

export const WithDescription: Story = {
  render: (args) => <ColorField {...args} />,
  args: {
    label: 'Color',
    description: 'Accepts hex, rgb or hsl notation.',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('Accepts hex, rgb or hsl notation.')
    ).toBeVisible();
  },
};

export const Unlabelled: Story = {
  render: (args) => <ColorField {...args} aria-label='Color' />,
  play: async ({ canvas }) => {
    // Without a label prop no Label element is rendered; the field is named by aria-label instead.
    await expect(
      canvas.getByRole('textbox', { name: 'Color' })
    ).toBeInTheDocument();
    await expect(canvas.queryByText('Color')).not.toBeInTheDocument();
  },
};
