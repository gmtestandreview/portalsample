import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Dialog, DialogTrigger } from './Dialog';
import { Button } from '../Button/Button';
import { Modal } from '../modal/Modal';
import { TextField } from '../TextField/TextField';
import { Heading } from '../Content/Content';
import type { Meta, StoryFn } from '@storybook/react-vite';

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

export const Example: Story = (args: Readonly<Parameters<Story>[0]>) => (
  <DialogTrigger>
    <Button>Sign up…</Button>
    <Modal>
      <Dialog {...args}>
        <form>
          <Heading slot='title'>Sign up</Heading>
          <TextField label='First Name' placeholder='Enter your first name' />
          <TextField label='Last Name' placeholder='Enter your last name' />
          <Button slot='close' style={{ marginTop: 8 }}>
            Submit
          </Button>
        </form>
      </Dialog>
    </Modal>
  </DialogTrigger>
);
