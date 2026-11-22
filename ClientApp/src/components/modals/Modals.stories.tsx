import preview from '../../../../.storybook/preview';
import { expect, userEvent, within, screen, waitFor } from 'storybook/test';
import BranchSelectorModal from './BranchSelectorModal';
import RFQDeleteModal from './RFQDeleteModal';
import { ApplicationType } from '../../api/web-api-client';
import { BranchSelectionModalMode } from './BranchSelectorModal/enums';
import {
  BranchSelectorHost,
  DeleteConfirmationDemo,
  RfqDeleteHost,
  SaveAndExitDemo,
} from '../../storybook/modalsStoryDemos';
import {
  branchSelectorPortal,
  createBranchSelectorFetch,
  expectEscapeLeavesOpen,
  findBranchRadios,
  findVisibleDialog,
  mockAccountDetails,
  modalsMetaOptions,
  observed,
  rfqDeletePortal,
} from '../../storybook/modalsStoryHelpers';

const meta = preview.meta({
  title: 'Modals',
  ...modalsMetaOptions,
});

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

export const BranchSelectorSelectAndEdit = meta.story({
  parameters: {
    docs: { story: { inline: false } },
    portal: {
      accountDetails: mockAccountDetails,
      fetch: createBranchSelectorFetch(),
      modalState: {
        showBranchSelector: true,
        showRFQDeleteModal: false,
        branchSelectionModalMode: BranchSelectionModalMode.SelectAndEditOrg,
      },
    },
  },
  render: () => <BranchSelectorModal />,
  play: async () => {
    const dialog = await findVisibleDialog(/manage your branch or location/iu);

    await expect(
      within(dialog).getByText(/branches or locations are available/iu),
    ).toBeVisible();

    const { selectedBranch, alternateBranch } = await findBranchRadios(dialog);

    await expect(selectedBranch).toBeChecked();
    await expect(alternateBranch).not.toBeChecked();
    await expect(
      within(dialog).getByRole('link', { name: /add branch or location/iu }),
    ).toBeVisible();

    const editLinks = within(dialog).getAllByRole('link', {
      name: /edit details for this branch\/location/iu,
    });

    await expect(editLinks).toHaveLength(2);

    await userEvent.click(alternateBranch);
    await waitFor(async () => {
      await expect(alternateBranch).toBeChecked();
      await expect(selectedBranch).not.toBeChecked();
    });

    await userEvent.click(selectedBranch);
    await waitFor(async () => {
      await expect(selectedBranch).toBeChecked();
      await expect(alternateBranch).not.toBeChecked();
    });
  },
});

export const BranchSelectorRFQMode = meta.story({
  parameters: {
    docs: { story: { inline: false } },
    portal: {
      accountDetails: mockAccountDetails,
      fetch: createBranchSelectorFetch(),
      modalState: {
        showBranchSelector: true,
        showRFQDeleteModal: false,
        branchSelectionModalMode: BranchSelectionModalMode.RFQSelectOrg,
        rfqId: 'RFQ-2024-001234',
      },
    },
  },
  render: () => <BranchSelectorModal />,
  play: async () => {
    const dialog = await findVisibleDialog(/change branch\/location/iu);

    await expect(
      within(dialog).getByText(
        /select default branch or location name to manage/iu,
      ),
    ).toBeVisible();

    const { selectedBranch, alternateBranch } = await findBranchRadios(dialog);

    await expect(selectedBranch).toBeChecked();
    await expect(
      within(dialog).queryByRole('link', { name: /add branch or location/iu }),
    ).not.toBeInTheDocument();
    await expect(
      within(dialog).queryByRole('link', {
        name: /edit details for this branch\/location/iu,
      }),
    ).not.toBeInTheDocument();

    await userEvent.click(alternateBranch);
    await waitFor(async () => {
      await expect(alternateBranch).toBeChecked();
      await expect(selectedBranch).not.toBeChecked();
    });
  },
});

export const BranchSelectorSaveSelection = meta.story({
  parameters: {
    docs: { story: { inline: false } },
    portal: branchSelectorPortal,
  },
  render: () => <BranchSelectorHost />,
  play: async ({ canvas }) => {
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Manage branch or location' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: /manage your branch or location/iu,
    });
    await userEvent.click(
      await within(dialog).findByRole('radio', {
        name: /acme melbourne branch/iu,
      }),
    );
    await expectEscapeLeavesOpen(dialog);
    await userEvent.click(
      within(dialog).getByRole('button', { name: /save and continue/iu }),
    );

    await expect(
      await canvas.findByRole('heading', { name: 'Dashboard destination' }),
    ).toBeVisible();
    await expect(observed.current.requests).toEqual([
      {
        method: 'PUT',
        url: '/api/users/set-default-organisation',
        body: { defaultOrganisationId: 2 },
      },
    ]);
    await expect(observed.current.defaultOrganisation).toEqual([
      [2, 'guid-002'],
    ]);
    await expect(observed.current.organisationAndBranch).toEqual([
      ['ACME Corporation', 'ACME Corporation', 'Melbourne Branch'],
    ]);
    await expect(observed.current.branchSelectorVisibility).toEqual([
      true,
      false,
    ]);
  },
});

export const BranchSelectorCancelDiscardsSelection = meta.story({
  parameters: {
    docs: { story: { inline: false } },
    portal: branchSelectorPortal,
  },
  render: () => <BranchSelectorHost />,
  play: async ({ canvas }) => {
    const trigger = await canvas.findByRole('button', {
      name: 'Manage branch or location',
    });
    await userEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', {
      name: /manage your branch or location/iu,
    });
    const melbourne = await within(dialog).findByRole('radio', {
      name: /acme melbourne branch/iu,
    });
    await userEvent.click(melbourne);
    await waitFor(() => expect(melbourne).toBeChecked());

    await userEvent.click(
      within(dialog).getByRole('button', { name: /cancel/iu }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /manage your branch/iu }),
      ).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());

    await expect(observed.current.branchSelectorVisibility).toEqual([
      true,
      false,
    ]);
    await expect(observed.current.requests).toEqual([]);
    await expect(observed.current.defaultOrganisation).toEqual([]);

    // Reopening shows the saved default again, not the discarded selection
    await userEvent.click(trigger);
    const reopened = await screen.findByRole('dialog', {
      name: /manage your branch or location/iu,
    });

    await expect(
      await within(reopened).findByRole('radio', {
        name: 'ACME Sydney Office',
      }),
    ).toBeChecked();
  },
});

export const RFQDeleteConfirmation = meta.story({
  parameters: {
    portal: {
      accountDetails: mockAccountDetails,
      modalState: {
        showBranchSelector: false,
        showRFQDeleteModal: true,
        rfqId: 'RFQ-2024-001234',
      },
    },
  },
  render: () => <RFQDeleteModal />,
  play: async () => {
    // RFQDeleteModal renders via React Bootstrap portal into document.body — use screen
    const dialog = await findVisibleDialog(/confirm deletion/iu);

    await expect(
      within(dialog).getByText(/RFQ-2024-001234/u),
    ).toBeInTheDocument();
    await expect(
      within(dialog).getByRole('button', { name: /^cancel$/iu }),
    ).toBeInTheDocument();
    await expect(
      within(dialog).getByRole('button', { name: /yes, delete/iu }),
    ).toBeInTheDocument();
  },
});

export const RFQDeleteCancelRestoresFocus = meta.story({
  parameters: { portal: rfqDeletePortal },
  render: () => <RfqDeleteHost />,
  play: async ({ canvas }) => {
    const trigger = await canvas.findByRole('button', {
      name: 'Delete draft request',
    });
    await userEvent.click(trigger);
    // RFQDeleteModal renders via React Bootstrap portal into document.body — use screen
    const dialog = await findVisibleDialog(/confirm deletion/iu);

    await expect(
      within(dialog).getByText(/RFQ-2024-001234/u),
    ).toBeInTheDocument();

    await expectEscapeLeavesOpen(dialog);

    await userEvent.click(
      within(dialog).getByRole('button', { name: /^cancel$/iu }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /confirm deletion/iu }),
      ).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
        canvas.getByRole('button', { name: 'Delete draft request' }),
      ).toHaveFocus(),
    );

    await expect(observed.current.rfqDeleteVisibility).toEqual([
      [true, 'RFQ-2024-001234'],
      [false, ''],
    ]);
    await expect(observed.current.requests).toEqual([]);
  },
});

export const RFQDeleteConfirmed = meta.story({
  parameters: { portal: rfqDeletePortal },
  render: () => <RfqDeleteHost />,
  play: async ({ canvas }) => {
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Delete draft request' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: /confirm deletion/iu,
    });
    await userEvent.click(
      within(dialog).getByRole('button', { name: /yes, delete/iu }),
    );

    await expect(
      await canvas.findByRole('heading', { name: 'Dashboard destination' }),
    ).toBeVisible();
    await expect(observed.current.requests).toEqual([
      {
        method: 'PUT',
        url: '/api/application/RFQ-2024-001234/delete',
        body: { applicationType: ApplicationType.QuoteRequest },
      },
    ]);
    await expect(
      globalThis.sessionStorage.getItem('dashboardNotification'),
    ).toContain('The draft request has been successfully deleted');
  },
});
