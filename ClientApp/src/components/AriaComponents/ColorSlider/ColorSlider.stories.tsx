import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ColorSlider } from './ColorSlider';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorSlider',
  component: ColorSlider,
  parameters: {
    layout: 'centered',
  },
});

export const Example = meta.story({
  render: (args) => <ColorSlider {...args} style={{ width: 200 }} />,
  args: {
    label: 'Red Opacity',
    defaultValue: '#f00',
    channel: 'alpha',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('slider', { name: 'Red Opacity' }),
    ).toBeInTheDocument();
  },
});
