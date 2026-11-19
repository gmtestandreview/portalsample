import preview from '../../../../.storybook/preview';
import { useState } from 'react';
import { Button } from 'react-bootstrap';
import { expect, userEvent, within, screen, waitFor } from 'storybook/test';
import ConfirmationModal from './ConfirmationModal';
import { findVisibleDialog, modalsMetaOptions } from './modalsStoryHelpers';

const meta = preview.meta({
  title: 'Modals',
  ...modalsMetaOptions,
});

const DeleteConfirmationDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Open confirmation
      </Button>
      <ConfirmationModal
        isOpen={open}
        closeModal={() => {
          setOpen(false);
        }}
        onModalYes={() => {
          setOpen(false);
        }}
        onModalNo={() => {
          setOpen(false);
        }}
        titleText='Delete this request?'
        bodyText='Are you sure you want to delete this draft request? This action cannot be undone.'
        noButtonTitle='Cancel'
        yesButtonTitle='Yes, delete'
      />
    </div>
  );
};

const SaveAndExitDemo = () => {
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState('No choice made');
  return (
    <div>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Open confirmation modal
      </Button>
      <output>{outcome}</output>
      <ConfirmationModal
        isOpen={open}
        closeModal={() => {
          setOpen(false);
        }}
        onModalYes={() => {
          setOutcome('Saved draft and exited');
        }}
        onModalNo={() => {
          setOutcome('Chose to continue editing');
        }}
        titleText='Save and exit?'
        bodyText='Your changes will be saved as a draft. You can continue editing from the dashboard.'
        noButtonTitle='Continue editing'
        yesButtonTitle='Save and exit'
      />
    </div>
  );
};

export const ConfirmationOpen = meta.story({
  render: () => <DeleteConfirmationDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Modal renders via React Bootstrap portal into document.body — use screen
    const dialog = await findVisibleDialog(/delete this request\?/iu);

    await expect(
      within(dialog).getByRole('button', { name: /yes, delete/iu }),
    ).toBeInTheDocument();
    await expect(
      within(dialog).getByRole('button', { name: /^cancel$/iu }),
    ).toBeInTheDocument();
    // Button is still in the canvas
    await expect(
      canvas.getByRole('button', { name: 'Open confirmation' }),
    ).toBeInTheDocument();

    // SB-018: clicking No closes the modal
    await userEvent.click(
      within(dialog).getByRole('button', { name: /^cancel$/iu }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /delete this request\?/iu }),
      ).not.toBeInTheDocument(),
    );
  },
});

export const ConfirmationClosed = meta.story({
  render: () => <SaveAndExitDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const openButton = await canvas.findByRole('button', {
      name: 'Open confirmation modal',
    });

    await expect(openButton).toHaveAccessibleName('Open confirmation modal');

    await userEvent.click(openButton);
    // Modal renders via React Bootstrap portal into document.body — use screen
    const dialog = await findVisibleDialog(/save and exit\?/iu);

    await expect(within(dialog).getByText(/saved as a draft/iu)).toBeVisible();
    await expect(
      within(dialog).getByRole('button', { name: /save and exit/iu }),
    ).toBeInTheDocument();
    await expect(
      within(dialog).getByRole('button', { name: /continue editing/iu }),
    ).toBeInTheDocument();

    // keyboard={false}: Escape must not dismiss the modal
    await userEvent.keyboard('{Escape}');

    await expect(dialog).toBeVisible();
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'No choice made',
    );

    // Cancel path: closes, reports the choice and returns focus to the trigger
    await userEvent.click(
      within(dialog).getByRole('button', { name: /continue editing/iu }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /save and exit\?/iu }),
      ).not.toBeInTheDocument(),
    );

    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Chose to continue editing',
    );

    await waitFor(() => expect(openButton).toHaveFocus());

    // Confirm path: closes and reports the confirmed choice
    await userEvent.click(openButton);
    const reopened = await screen.findByRole('dialog', {
      name: /save and exit\?/iu,
    });
    await userEvent.click(
      within(reopened).getByRole('button', { name: /^save and exit$/iu }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /save and exit\?/iu }),
      ).not.toBeInTheDocument(),
    );

    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Saved draft and exited',
    );

    await waitFor(() => expect(openButton).toHaveFocus());
  },
});
