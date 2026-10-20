import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ColorSwatchPicker, ColorSwatchPickerItem } from './ColorSwatchPicker';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorSwatchPicker',
  component: ColorSwatchPicker,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ColorSwatchPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  render: (args) => (
    <ColorSwatchPicker {...args}>
      <ColorSwatchPickerItem color='#A00' />
      <ColorSwatchPickerItem color='#f80' />
      <ColorSwatchPickerItem color='#080' />
      <ColorSwatchPickerItem color='#08f' />
      <ColorSwatchPickerItem color='#088' />
      <ColorSwatchPickerItem color='#008' />
    </ColorSwatchPicker>
  ),
  play: async ({ canvas }) => {
    const picker = canvas.getByRole('listbox', { name: 'Color swatches' });
    const swatches = canvas.getAllByRole('option');

    await expect(picker).toBeInTheDocument();
    await expect(swatches.length).toBeGreaterThan(0);
  },
};
