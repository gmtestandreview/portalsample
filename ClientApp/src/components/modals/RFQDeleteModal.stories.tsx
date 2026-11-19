import preview from '../../../../.storybook/preview';
import { expect, userEvent, within, screen, waitFor } from 'storybook/test';
import RFQDeleteModal from './RFQDeleteModal';
import { ApplicationType } from '../../api/web-api-client';
import {
  ModalHost,
  createBranchSelectorFetch,
  dashboardDestination,
  expectEscapeLeavesOpen,
  findVisibleDialog,
  mockAccountDetails,
  modalsMetaOptions,
  observed,
} from './modalsStoryHelpers';

const meta = preview.meta({
  title: 'Modals',
  ...modalsMetaOptions,
});

const rfqDeleteHost = (
  <ModalHost
    triggerLabel='Delete draft request'
    openModal={(dispatch) => {
      dispatch.setShowRFQDeleteModal(true, 'RFQ-2024-001234');
    }}
  >
    {(state) => (state.showRFQDeleteModal ? <RFQDeleteModal /> : null)}
  </ModalHost>
);

const rfqDeletePortal = {
  accountDetails: mockAccountDetails,
  fetch: createBranchSelectorFetch(),
  initialEntries: ['/request'],
  destinationRoutes: dashboardDestination,
};

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
  render: () => rfqDeleteHost,
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
  render: () => rfqDeleteHost,
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
