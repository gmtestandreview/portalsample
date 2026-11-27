import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Menu, MenuTrigger, MenuItem, SubmenuTrigger } from './Menu';
import { Button } from '../Button/Button';
import type { StoryObj } from '@storybook/react-vite';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Menu',
  component: Menu,
  parameters: {
    layout: 'centered',
  },
});

type Story = StoryObj<typeof Menu>;

const example = meta.story({
  render: (args) => (
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

export const Example: Story = example as unknown as Story;
