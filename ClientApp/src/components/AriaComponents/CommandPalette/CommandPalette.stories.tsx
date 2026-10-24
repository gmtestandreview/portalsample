import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Button } from '../Button/Button.tsx';
import { CommandPalette } from './CommandPalette';
import { MenuItem } from '../Menu/Menu.tsx';
import { expect, fn, userEvent, within } from 'storybook/test';
import { useState } from 'react';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/CommandPalette',
  component: CommandPalette,
  parameters: {
    layout: 'centered',
  },
  args: {
    isOpen: false,
    onOpenChange: fn(),
  },
});

export const Example = meta.story({
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onPress={() => setIsOpen(true)}>
          Open Command Palette <kbd>⌘ J</kbd>
        </Button>
        <CommandPalette
          {...args}
          isOpen={isOpen}
          onOpenChange={(nextIsOpen = false) => setIsOpen(nextIsOpen)}
        >
          <MenuItem>Create new file...</MenuItem>
          <MenuItem>Create new folder...</MenuItem>
          <MenuItem>Assign to...</MenuItem>
          <MenuItem>Assign to me</MenuItem>
          <MenuItem>Change status...</MenuItem>
          <MenuItem>Change priority...</MenuItem>
          <MenuItem>Add label...</MenuItem>
          <MenuItem>Remove label...</MenuItem>
        </CommandPalette>
      </>
    );
  },
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
});
