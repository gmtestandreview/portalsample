import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {Toolbar} from './Toolbar';
import {Separator} from './Separator';
import {Group} from 'react-aria-components/Group';
import {Button} from '../Buttons/AriaButton/Button';
import {ToggleButton} from './ToggleButton';
import {Checkbox} from '../Inputs/AriaCheckbox/Checkbox';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Toolbar',
  component: Toolbar,
  parameters: {
    layout: 'centered'
  },
} satisfies Meta<typeof Toolbar>;

export default meta;

type Story = StoryFn<typeof Toolbar>;

export const Example: Story = args => (
  <Toolbar aria-label="Text formatting" {...args}>
    <Group aria-label="Style">
      <ToggleButton aria-label="Bold">
        <b>B</b>
      </ToggleButton>
      <ToggleButton aria-label="Italic">
        <i>I</i>
      </ToggleButton>
      <ToggleButton aria-label="Underline">
        <u>U</u>
      </ToggleButton>
    </Group>
    <Separator />
    <Group aria-label="Clipboard">
      <Button>Copy</Button>
      <Button>Paste</Button>
      <Button>Cut</Button>
    </Group>
    <Separator />
    <Checkbox>Night Mode</Checkbox>
  </Toolbar>
);
