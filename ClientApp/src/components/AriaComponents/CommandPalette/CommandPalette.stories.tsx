import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Button } from '../Button/Button.tsx';
import { CommandPalette } from './CommandPalette';
import { DialogTrigger } from '../Dialog/Dialog';
import { MenuItem } from '../Menu/Menu.tsx';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/CommandPalette',
  component: CommandPalette,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CommandPalette>;

export default meta;
type ObjectStory = Omit<StoryObj<typeof meta>, 'args'> & {
  args?: Partial<Record<string, unknown>>;
};

export const Example: ObjectStory = {
  render: (args) => (
    <DialogTrigger>
      <Button>
        Open Command Palette <kbd>⌘ J</kbd>
      </Button>
      <CommandPalette {...args}>
        <MenuItem>Create new file...</MenuItem>
        <MenuItem>Create new folder...</MenuItem>
        <MenuItem>Assign to...</MenuItem>
        <MenuItem>Assign to me</MenuItem>
        <MenuItem>Change status...</MenuItem>
        <MenuItem>Change priority...</MenuItem>
        <MenuItem>Add label...</MenuItem>
        <MenuItem>Remove label...</MenuItem>
      </CommandPalette>
    </DialogTrigger>
  ),
  play: async ({ canvas, canvasElement }) => {
    const trigger = canvas.getByRole('button', {
      name: /Open Command Palette/,
    });

    await userEvent.click(trigger);

    const body = within(canvasElement.ownerDocument.body);
    const menu = body.getByRole('menu', { name: 'Suggestions' });
    const menuItem = body.getByRole('menuitem', {
      name: 'Create new file...',
    });
    const searchInput = body.getByRole('searchbox', {
      name: 'Search commands',
    });

    await expect(menuItem).toBeInTheDocument();
    await expect(searchInput).toHaveFocus();
    await expect(searchInput).not.toHaveAttribute('aria-activedescendant');
    await expect(menu).toHaveAttribute('tabindex', '0');

    await userEvent.tab();

    await expect(menuItem).toHaveFocus();
  },
};
