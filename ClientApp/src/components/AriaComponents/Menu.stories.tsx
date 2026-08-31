import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {Menu, MenuTrigger, MenuItem, SubmenuTrigger} from './Menu';
import {Button} from '../Buttons/AriaButton/Button';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Menu',
  component: Menu,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryFn<typeof Menu>;

export const Example: Story = args => (
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
