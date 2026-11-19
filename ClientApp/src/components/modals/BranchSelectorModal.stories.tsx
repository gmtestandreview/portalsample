import preview from '../../../../.storybook/preview';
import { expect, userEvent, within, screen, waitFor } from 'storybook/test';
import BranchSelectorModal from './BranchSelectorModal';
import { BranchSelectionModalMode } from './BranchSelectorModal/enums';
import {
  ModalHost,
  createBranchSelectorFetch,
  dashboardDestination,
  expectEscapeLeavesOpen,
  findBranchRadios,
  findVisibleDialog,
  mockAccountDetails,
  modalsMetaOptions,
  observed,
} from './modalsStoryHelpers';

const meta = preview.meta({
  title: 'Modals',
  ...modalsMetaOptions,
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

const branchSelectorHost = (
  <ModalHost
    triggerLabel='Manage branch or location'
    openModal={(dispatch) => {
      dispatch.setShowBranchSelector(true);
    }}
  >
    {(state) => (state.showBranchSelector ? <BranchSelectorModal /> : null)}
  </ModalHost>
);

const branchSelectorPortal = {
  accountDetails: mockAccountDetails,
  fetch: createBranchSelectorFetch(),
  initialEntries: ['/branches'],
  destinationRoutes: dashboardDestination,
  accountDispatch: {
    setDefaultOrganisationId: (id?: number, crmGuid?: string) => {
      observed.current.defaultOrganisation.push([id, crmGuid]);
    },
    setOrganisationAndBranch: (
      name: string,
      tradingName: string,
      branchName: string,
    ) => {
      observed.current.organisationAndBranch.push([
        name,
        tradingName,
        branchName,
      ]);
    },
  },
};

export const BranchSelectorSaveSelection = meta.story({
  parameters: {
    docs: { story: { inline: false } },
    portal: branchSelectorPortal,
  },
  render: () => branchSelectorHost,
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
  render: () => branchSelectorHost,
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
