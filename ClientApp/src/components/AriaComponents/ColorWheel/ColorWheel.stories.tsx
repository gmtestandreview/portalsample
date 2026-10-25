import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ColorWheel } from './ColorWheel';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorWheel',
  component: ColorWheel,
  parameters: {
    layout: 'centered',
  },
});

export const Example = meta.story({
  args: {
    defaultValue: 'hsl(30, 100%, 50%)',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('slider', { name: 'Hue' }),
    ).toBeInTheDocument();
  },
});
