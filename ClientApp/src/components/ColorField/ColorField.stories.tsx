import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {ColorField} from './ColorField';
import type {Meta, StoryFn} from '@storybook/react-vite';
import {expect} from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorField',
  component: ColorField,
  parameters: {
    layout: 'centered'
  },
  args: {
    placeholder: 'Enter a color'
  }
} satisfies Meta<typeof ColorField>;

export default meta;
type Story = StoryFn<typeof ColorField>;

export const Example: Story = args => <ColorField {...args} />;

Example.args = {
  label: 'Color'
};

export const WithDescription: Story = args => <ColorField {...args} />;

WithDescription.args = {
  label: 'Color',
  description: 'Accepts hex, rgb or hsl notation.'
};

WithDescription.play = async ({canvas}) => {
  await expect(canvas.getByText('Accepts hex, rgb or hsl notation.')).toBeVisible();
};

export const Unlabelled: Story = args => <ColorField {...args} aria-label="Color" />;

Unlabelled.play = async ({canvas}) => {
  // Without a label prop no Label element is rendered; the field is named by aria-label instead.
  await expect(canvas.getByRole('textbox', {name: 'Color'})).toBeInTheDocument();
  await expect(canvas.queryByText('Color')).not.toBeInTheDocument();
};
