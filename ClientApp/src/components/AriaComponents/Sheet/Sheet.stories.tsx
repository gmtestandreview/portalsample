import preview from '../../../../../.storybook/preview';
import { expect, waitFor, within } from 'storybook/test';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Button } from '../Button/Button';
import { DialogTrigger } from '../Dialog/Dialog';
import { Sheet, Heading } from './Sheet';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Components/AriaComponents/Sheet',
  component: Sheet,
  parameters: {
    layout: 'fullscreen',
  },
});

export const ContextDrivenOpenAndDismiss = meta.story({
  render: () => (
    <DialogTrigger>
      <Button>Open settings</Button>
      <Sheet>
        <Heading slot='title'>Settings</Heading>
        <p>Choose which notifications you receive.</p>
        <Button slot='close'>Close</Button>
      </Sheet>
    </DialogTrigger>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Open settings' });

    await expect(trigger).toBeInTheDocument();

    await userEvent.click(trigger);

    const documentBody = within(canvasElement.ownerDocument.body);
    const dialog = await documentBody.findByRole('dialog', {
      name: 'Settings',
    });

    await expect(dialog).toBeInTheDocument();
    await expect(
      documentBody.getByText('Choose which notifications you receive.'),
    ).toBeInTheDocument();

    await expect(
      documentBody.getByRole('button', { name: 'Close' }),
    ).toBeInTheDocument();

    await userEvent.click(documentBody.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
});
