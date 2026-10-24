import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Modal } from './Modal';
import { Dialog, DialogTrigger } from '../Dialog/Dialog.tsx';
import { TextField } from '../TextField/TextField.tsx';
import { Button } from '../Button/Button.tsx';
import { Heading } from '../Content/Content.tsx';
import type { StoryFn } from '@storybook/react-vite';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
});

type Story = StoryFn<typeof Modal>;

export const Example = meta.story({
  render: (args: Readonly<Parameters<Story>[0]>) => (
    <DialogTrigger>
      <Button>Sign up…</Button>
      <Modal {...args}>
        <Dialog>
          <form>
            <Heading slot='title'>Sign up</Heading>
            <TextField label='First Name' placeholder='Enter your first name' />
            <TextField label='Last Name' placeholder='Enter your last name' />
            <Button slot='close'>Submit</Button>
          </form>
        </Dialog>
      </Modal>
    </DialogTrigger>
  ),
});
