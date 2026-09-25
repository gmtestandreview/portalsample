import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {ColorSwatchPicker, ColorSwatchPickerItem} from './ColorSwatchPicker';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorSwatchPicker',
  component: ColorSwatchPicker,
  parameters: {
    layout: 'centered'
  },
} satisfies Meta<typeof ColorSwatchPicker>;

export default meta;
type Story = StoryFn<typeof ColorSwatchPicker>;

export const Example: Story = args => (
  <ColorSwatchPicker {...args}>
    <ColorSwatchPickerItem color="#A00" />
    <ColorSwatchPickerItem color="#f80" />
    <ColorSwatchPickerItem color="#080" />
    <ColorSwatchPickerItem color="#08f" />
    <ColorSwatchPickerItem color="#088" />
    <ColorSwatchPickerItem color="#008" />
  </ColorSwatchPicker>
);
