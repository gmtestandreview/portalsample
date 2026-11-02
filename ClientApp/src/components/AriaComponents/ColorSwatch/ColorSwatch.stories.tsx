import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ColorSwatch } from './ColorSwatch';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorSwatch',
  component: ColorSwatch,
  parameters: {
    layout: 'centered',
  },
});

export const Example = meta.story({
  args: {
    color: '#f00a',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('img', { name: 'vibrant red, 33% transparent' }),
    ).toBeInTheDocument();
  },
});
