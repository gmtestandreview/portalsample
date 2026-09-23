import type { Meta, StoryFn } from '@storybook/react-vite';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation.tsx';
import { Button } from '../../Buttons/AriaButton/Button.tsx';
import { Menu, MenuItem, MenuTrigger, SubmenuTrigger } from './Menu.tsx';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Menu',
  component: Menu,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryFn<typeof Menu>;

export const Example: Story = (args) => (
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
);

Example.args = {};
