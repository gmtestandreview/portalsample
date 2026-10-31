import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Dialog, DialogTrigger } from './Dialog';
import { Button } from '../Button/Button';
import { Modal } from '../modal/Modal';
import { TextField } from '../TextField/TextField';
import { Heading } from '../Content/Content';
import { expect, screen, waitFor, within } from 'storybook/test';
import type { StoryFn } from '@storybook/react-vite';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
  },
});

type Story = StoryFn<typeof Dialog>;

export const Example = meta.story({
  render: (args: Readonly<Parameters<Story>[0]>) => (
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
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Sign up…' }));

    const dialog = await screen.findByRole('dialog', { name: 'Sign up' });
    const title = within(dialog).getByRole('heading', {
      name: 'Sign up',
      level: 2,
    });

    await expect(dialog).toHaveAccessibleName('Sign up');
    await expect(dialog).toHaveAttribute('aria-labelledby', title.id);

    await waitFor(() => expect(title).toBeVisible());
  },
});
