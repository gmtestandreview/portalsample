import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation.tsx';
import { Button } from '../../Buttons/AriaButton/Button.tsx';
import { DialogTrigger } from '../../Dialog/Dialog.tsx';
import { Heading } from './Content.tsx';
import { HelpCircle } from './NmiIcon.tsx';
import { Popover } from './Popover.tsx';
import './styles.css';
import type { Meta, StoryFn } from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryFn<typeof Popover>;

export const Example: Story = (args) => (
  <DialogTrigger>
    <Button aria-label='Help'>
      <HelpCircle size={18} />
    </Button>
    <Popover {...args} className='react-aria-Popover popover-padding'>
      <Heading slot='title'>Help</Heading>
      <p>For help accessing your account, please contact support.</p>
    </Popover>
  </DialogTrigger>
);
