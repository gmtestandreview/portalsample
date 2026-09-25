import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {Dialog, DialogTrigger} from './Dialog';
import {Button} from '../Buttons/AriaButton/Button';
import {Modal} from '../AriaComponents/Modal';
import {TextField} from '../AriaComponents/TextField';
import {Heading} from '../AriaComponents/Content';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered'
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryFn<typeof Dialog>;

export const Example: Story = args => (
  <DialogTrigger>
    <Button>Sign up…</Button>
    <Modal>
      <Dialog {...args}>
        <form>
          <Heading slot="title">Sign up</Heading>
          <TextField autoFocus label="First Name" placeholder="Enter your first name" />
          <TextField label="Last Name" placeholder="Enter your last name" />
          <Button slot="close" style={{marginTop: 8}}>
            Submit
          </Button>
        </form>
      </Dialog>
    </Modal>
  </DialogTrigger>
);
