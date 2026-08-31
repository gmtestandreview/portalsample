import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {Tooltip, TooltipTrigger} from './Tooltip';
import {Button} from '../Buttons/AriaButton/Button';
import {Save} from './NmiIcon';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryFn<typeof Tooltip>;

export const Example: Story = args => (
  <TooltipTrigger>
    <Button aria-label="Save">
      <Save size={18} />
    </Button>
    <Tooltip {...args}>Save</Tooltip>
  </TooltipTrigger>
);
