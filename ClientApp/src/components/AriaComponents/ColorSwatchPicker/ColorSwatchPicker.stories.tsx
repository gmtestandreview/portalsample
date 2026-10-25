import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ColorSwatchPicker, ColorSwatchPickerItem } from './ColorSwatchPicker';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorSwatchPicker',
  component: ColorSwatchPicker,
  parameters: {
    layout: 'centered',
  },
});

export const Example = meta.story({
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
});
