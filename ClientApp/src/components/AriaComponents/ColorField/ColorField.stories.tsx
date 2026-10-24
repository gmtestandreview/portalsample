import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ColorField } from './ColorField';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorField',
  component: ColorField,
  parameters: {
    layout: 'centered',
  },
  args: {
    placeholder: 'Enter a color',
  },
});

export const Example = meta.story({
  render: (args) => <ColorField {...args} />,
  args: {
    label: 'Color',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('textbox', { name: 'Color' }),
    ).toBeInTheDocument();
  },
});

export const WithDescription = meta.story({
  render: (args) => <ColorField {...args} />,
  args: {
    label: 'Color',
    description: 'Accepts hex, rgb or hsl notation.',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('Accepts hex, rgb or hsl notation.'),
    ).toBeVisible();
  },
});

export const Unlabelled = meta.story({
  render: (args) => <ColorField {...args} aria-label='Color' />,
  play: async ({ canvas }) => {
    // Without a label prop no Label element is rendered; the field is named by aria-label instead.
    await expect(
      canvas.getByRole('textbox', { name: 'Color' }),
    ).toBeInTheDocument();
    await expect(canvas.queryByText('Color')).not.toBeInTheDocument();
  },
});
