import type { Meta, StoryFn } from '@storybook/react-vite';
import { withReactAriaEvaluation } from '../../storybook/withReactAriaEvaluation.tsx';
import { Heading } from '../react-aria-evaluation/primitives/Content.tsx';
import { Modal } from '../react-aria-evaluation/primitives/Modal.tsx';
import { TextField } from '../react-aria-evaluation/primitives/TextField.tsx';
import { Button } from '../Buttons/AriaButton/Button.tsx';
import { Dialog, DialogTrigger } from './Dialog.tsx';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryFn<typeof Dialog>;

export const Example: Story = (args) => (
  <DialogTrigger>
    <Button>Sign up…</Button>
    <Modal>
      <Dialog {...args}>
        <form>
          <Heading slot='title'>Sign up</Heading>
          <TextField
            autoFocus={true}
            label='First Name'
            placeholder='Enter your first name'
          />
          <TextField label='Last Name' placeholder='Enter your last name' />
          <Button slot='close' style={{ marginTop: 8 }}>
            Submit
          </Button>
        </form>
      </Dialog>
    </Modal>
  </DialogTrigger>
);
