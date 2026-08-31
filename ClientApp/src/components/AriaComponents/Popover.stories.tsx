import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {Popover} from './Popover';
import {Button} from '../Buttons/AriaButton/Button';
import {DialogTrigger} from '../Dialog/Dialog';
import {Heading} from './Content';
import {HelpCircle} from './NmiIcon';
import './styles.css';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Popover',
  component: Popover,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryFn<typeof Popover>;

export const Example: Story = args => (
  <DialogTrigger>
    <Button aria-label="Help">
      <HelpCircle size={18} />
    </Button>
    <Popover {...args} className="react-aria-Popover popover-padding">
      <Heading slot="title">Help</Heading>
      <p>For help accessing your account, please contact support.</p>
    </Popover>
  </DialogTrigger>
);
