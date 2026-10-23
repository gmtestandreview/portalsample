import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Tooltip, TooltipTrigger } from './Tooltip';
import { Button } from '../Button/Button';
import { Save } from '../NmiIcon';
import { expect, userEvent, waitFor } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Example: Story = {
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
    await userEvent.hover(button);
    // React Aria sets `data-hovered` synchronously on pointer enter, but the
    // one-shot attribute read can run before that commit is observable under CI
    // load; waitFor retries the read until the hovered state has landed.
    await waitFor(() => expect(button).toHaveAttribute('data-hovered', 'true'));
  },
};
