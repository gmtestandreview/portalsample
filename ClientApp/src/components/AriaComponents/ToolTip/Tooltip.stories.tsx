import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Tooltip, TooltipTrigger } from './Tooltip';
import { Button } from '../Button/Button';
import { Save } from '../NmiIcon';
import { expect, userEvent, waitFor } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
});

export const Example = meta.story({
  args: { children: 'Save' },
  render: (args) => (
    <TooltipTrigger>
      <Button aria-label='Save'>
        <Save size={18} />
      </Button>
      <Tooltip {...args}>Save</Tooltip>
    </TooltipTrigger>
  ),
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Save' });
    // Reset the synthetic pointer so hover always emits a fresh enter event in CI.
    await userEvent.unhover(button);
    await userEvent.hover(button);
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Save' })).toHaveAttribute(
        'data-hovered',
        'true',
      ),
    );
  },
});
