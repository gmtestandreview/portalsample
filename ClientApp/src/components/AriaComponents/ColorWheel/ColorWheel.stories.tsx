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

export const KeyboardAdjustsHue = meta.story({
  args: {
    defaultValue: 'hsl(30, 100%, 50%)',
  },
  play: async ({ canvas, userEvent }) => {
    const hue = canvas.getByRole('slider', { name: 'Hue' });
    const thumb = hue.parentElement;

    await expect(thumb).toHaveClass('react-aria-ColorThumb');
    await expect(thumb).toHaveStyle({ backgroundColor: 'rgb(255, 128, 0)' });
    await expect(hue).toHaveValue('30');
    await expect(hue).toHaveAttribute('aria-valuetext', '30°, orange');

    await userEvent.tab();

    await expect(hue).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');

    await expect(hue).toHaveValue('31');
    await expect(hue).toHaveAttribute('aria-valuetext', '31°, orange');
    await expect(thumb).not.toHaveStyle({
      backgroundColor: 'rgb(255, 128, 0)',
    });

    await userEvent.keyboard('{ArrowLeft}');

    await expect(hue).toHaveValue('30');
    await expect(thumb).toHaveStyle({ backgroundColor: 'rgb(255, 128, 0)' });
  },
});
