import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Menu, MenuTrigger, MenuItem, SubmenuTrigger } from './Menu';
import { Button } from '../Button/Button';
import type { StoryFn } from '@storybook/react-vite';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Menu',
  component: Menu,
  parameters: {
    layout: 'centered',
  },
});

type Story = StoryFn<typeof Menu>;

export const Example = meta.story({
  render: (args: Readonly<Parameters<Story>[0]>) => (
    <MenuTrigger>
      <Button>Edit</Button>
      <Menu {...args}>
        <MenuItem>Favorite</MenuItem>
        <MenuItem>Edit</MenuItem>
        <MenuItem>Delete</MenuItem>
        <SubmenuTrigger>
          <MenuItem>Share</MenuItem>
          <Menu>
            <MenuItem>SMS</MenuItem>
            <MenuItem>Email</MenuItem>
          </Menu>
        </SubmenuTrigger>
      </Menu>
    </MenuTrigger>
  ),

  args: {},
});
