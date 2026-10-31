import preview from '../../../../.storybook/preview';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from 'react-bootstrap';
import { expect, userEvent, within, screen, waitFor } from 'storybook/test';
import ConfirmationModal from './ConfirmationModal';
import BranchSelectorModal from './BranchSelectorModal';
import RFQDeleteModal from './RFQDeleteModal';
import { ModalDispatchCtx, ModalStateCtx } from './ModalContext';
import type { ModalDispatch, ModalState } from './ModalContext';
import { ApplicationType } from '../../api/web-api-client';
import { BranchSelectionModalMode } from './BranchSelectorModal/enums';
import { clearDashboardNotification } from '../../storage/notification';
import { withPortalProviders } from '../../storybook/storybookHarness';

const mockBranches = [
  {
    organisationId: 1,
    name: 'ACME Corporation',
    businessListName: 'ACME Sydney Office',
    businessOrTradingName: 'ACME Corporation',
    branchOrLocationName: 'Sydney Office',
    abn: '00000000001',
    crmGuid: 'guid-001',
    streetAddress: {
      suburb: 'Sydney',
      state: 'NSW',
      postcode: '2000',
      streetLine1: '1 George St',
    },
  },
  {
    organisationId: 2,
    name: 'ACME Corporation',
    businessListName: 'ACME Melbourne Branch',
    businessOrTradingName: 'ACME Corporation',
    branchOrLocationName: 'Melbourne Branch',
    abn: '00000000001',
    crmGuid: 'guid-002',
    streetAddress: {
      suburb: 'Melbourne',
      state: 'VIC',
      postcode: '3000',
      streetLine1: '100 Collins St',
    },
  },
];

interface RecordedRequest {
  method: string;
  url: string;
  body: unknown;
}

interface ModalObservations {
  requests: RecordedRequest[];
  defaultOrganisation: Array<[number | undefined, string | undefined]>;
  organisationAndBranch: Array<[string, string, string]>;
  branchSelectorVisibility: boolean[];
  rfqDeleteVisibility: Array<[boolean, string]>;
}

const emptyObservations = (): ModalObservations => ({
  requests: [],
  defaultOrganisation: [],
  organisationAndBranch: [],
  branchSelectorVisibility: [],
  rfqDeleteVisibility: [],
});

const observed: { current: ModalObservations } = {
  current: emptyObservations(),
};

const meta = preview.meta({
  title: 'Modals',
  decorators: [withPortalProviders],
  beforeEach() {
    delete globalThis.document.body.dataset['storybookOrganisationLookupCount'];
    observed.current = emptyObservations();
    return () => {
      observed.current = emptyObservations();
      clearDashboardNotification();
    };
  },
  parameters: {
    layout: 'centered',
  },
});

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

const resolveFetchUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
};

const createBranchSelectorFetch =
  (branches = mockBranches): typeof globalThis.fetch =>
  async (input, init) => {
    const url = resolveFetchUrl(input);

    if (init?.method === 'PUT') {
      observed.current.requests.push({
        method: init.method,
        url,
        body: JSON.parse(String(init.body ?? 'null')) as unknown,
      });
      return new Response('', { status: 200 });
    }

    if (url.includes('/api/organisations/')) {
      const lookupCount =
        Number(
          globalThis.document.body.dataset[
            'storybookOrganisationLookupCount'
          ] ?? '0',
        ) + 1;
      globalThis.document.body.dataset['storybookOrganisationLookupCount'] =
        String(lookupCount);
      return jsonResponse(branches);
    }

    if (url.includes('/api/users/default-organisation')) {
      return jsonResponse({});
    }

    return new Response('Not found', { status: 404 });
  };

// Mirrors PreConditions: owns ModalState, mounts the modal only while it is shown
// and provides a real trigger so focus restoration can be observed.
const ModalHost = ({
  triggerLabel,
  openModal,
  children,
}: {
  triggerLabel: string;
  openModal: (dispatch: ModalDispatch) => void;
  children: (state: ModalState) => ReactNode;
}) => {
  const [state, setState] = useState<ModalState>({
    showBranchSelector: false,
    showRFQDeleteModal: false,
    branchSelectionModalMode: BranchSelectionModalMode.SelectAndEditOrg,
  });
  const dispatch = useMemo<ModalDispatch>(
    () => ({
      setShowBranchSelector: (show) => {
        observed.current.branchSelectorVisibility.push(show);
        setState((prev) => ({ ...prev, showBranchSelector: show }));
      },
      setShowRFQDeleteModal: (show, rfqId) => {
        observed.current.rfqDeleteVisibility.push([show, rfqId]);
        setState((prev) => ({ ...prev, showRFQDeleteModal: show, rfqId }));
      },
      setShowRFQSelectModal: () => undefined,
    }),
    [],
  );

  return (
    <ModalStateCtx.Provider value={state}>
      <ModalDispatchCtx.Provider value={dispatch}>
        <Button onClick={() => openModal(dispatch)}>{triggerLabel}</Button>
        {children(state)}
      </ModalDispatchCtx.Provider>
    </ModalStateCtx.Provider>
  );
};

const DeleteConfirmationDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open confirmation</Button>
      <ConfirmationModal
        isOpen={open}
        closeModal={() => setOpen(false)}
        onModalYes={() => setOpen(false)}
        onModalNo={() => setOpen(false)}
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
      <Button onClick={() => setOpen(true)}>Open confirmation modal</Button>
      <output>{outcome}</output>
      <ConfirmationModal
        isOpen={open}
        closeModal={() => setOpen(false)}
        onModalYes={() => setOutcome('Saved draft and exited')}
        onModalNo={() => setOutcome('Chose to continue editing')}
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
    const dialog = await screen.findByRole('dialog', {
      name: /delete this request\?/i,
    });
    await waitFor(() => expect(dialog).toBeVisible());

    await expect(
      within(dialog).getByRole('button', { name: /yes, delete/i }),
    ).toBeInTheDocument();
    await expect(
      within(dialog).getByRole('button', { name: /^cancel$/i }),
    ).toBeInTheDocument();
    // Button is still in the canvas
    await expect(
      canvas.getByRole('button', { name: 'Open confirmation' }),
    ).toBeInTheDocument();

    // SB-018: clicking No closes the modal
    await userEvent.click(
      within(dialog).getByRole('button', { name: /^cancel$/i }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /delete this request\?/i }),
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
    const dialog = await screen.findByRole('dialog', {
      name: /save and exit\?/i,
    });
    await waitFor(() => expect(dialog).toBeVisible());

    await expect(within(dialog).getByText(/saved as a draft/i)).toBeVisible();
    await expect(
      within(dialog).getByRole('button', { name: /save and exit/i }),
    ).toBeInTheDocument();
    await expect(
      within(dialog).getByRole('button', { name: /continue editing/i }),
    ).toBeInTheDocument();

    // keyboard={false}: Escape must not dismiss the modal
    await userEvent.keyboard('{Escape}');

    await expect(dialog).toBeVisible();
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'No choice made',
    );

    // Cancel path: closes, reports the choice and returns focus to the trigger
    await userEvent.click(
      within(dialog).getByRole('button', { name: /continue editing/i }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /save and exit\?/i }),
      ).not.toBeInTheDocument(),
    );

    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Chose to continue editing',
    );

    await waitFor(() => expect(openButton).toHaveFocus());

    // Confirm path: closes and reports the confirmed choice
    await userEvent.click(openButton);
    const reopened = await screen.findByRole('dialog', {
      name: /save and exit\?/i,
    });
    await userEvent.click(
      within(reopened).getByRole('button', { name: /^save and exit$/i }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /save and exit\?/i }),
      ).not.toBeInTheDocument(),
    );

    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Saved draft and exited',
    );

    await waitFor(() => expect(openButton).toHaveFocus());
  },
});

const mockAccountDetails = {
  organisation: 'ACME Corporation',
  trading: 'ACME Corporation',
  branch: 'Sydney Office',
  homeAccountId: 'mock-id',
  abn: '00000000001',
  userAcceptedTermsOfUse: true,
  accountCreationCompleted: true,
  accountContactCompleted: true,
  currentTermsVersion: '1',
  defaultOrganisationId: 1,
  organisationCRMGuid: 'guid-001',
  organisationIsCompleted: true,
  isDefaultOrganisation: true,
};

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
    const dialog = await screen.findByRole('dialog', {
      name: /manage your branch or location/i,
    });
    await waitFor(() => expect(dialog).toBeVisible());

    await expect(
      within(dialog).getByText(/branches or locations are available/i),
    ).toBeVisible();

    const selectedBranch = await within(dialog).findByRole('radio', {
      name: /acme sydney office/i,
    });
    const alternateBranch = await within(dialog).findByRole('radio', {
      name: /acme melbourne branch/i,
    });

    await expect(selectedBranch).toBeChecked();
    await expect(alternateBranch).not.toBeChecked();
    await expect(
      within(dialog).getByRole('link', { name: /add branch or location/i }),
    ).toBeVisible();

    const editLinks = within(dialog).getAllByRole('link', {
      name: /edit details for this branch\/location/i,
    });

    await expect(editLinks).toHaveLength(2);

    await userEvent.click(alternateBranch);
    await waitFor(() => {
      expect(alternateBranch).toBeChecked();
      expect(selectedBranch).not.toBeChecked();
    });

    await userEvent.click(selectedBranch);
    await waitFor(() => {
      expect(selectedBranch).toBeChecked();
      expect(alternateBranch).not.toBeChecked();
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
    const dialog = await screen.findByRole('dialog', {
      name: /change branch\/location/i,
    });
    await waitFor(() => expect(dialog).toBeVisible());

    await expect(
      within(dialog).getByText(
        /select default branch or location name to manage/i,
      ),
    ).toBeVisible();

    const selectedBranch = await within(dialog).findByRole('radio', {
      name: /acme sydney office/i,
    });
    const alternateBranch = await within(dialog).findByRole('radio', {
      name: /acme melbourne branch/i,
    });

    await expect(selectedBranch).toBeChecked();
    await expect(
      within(dialog).queryByRole('link', { name: /add branch or location/i }),
    ).not.toBeInTheDocument();
    await expect(
      within(dialog).queryByRole('link', {
        name: /edit details for this branch\/location/i,
      }),
    ).not.toBeInTheDocument();

    await userEvent.click(alternateBranch);
    await waitFor(() => {
      expect(alternateBranch).toBeChecked();
      expect(selectedBranch).not.toBeChecked();
    });
  },
});

const dashboardDestination = [
  { path: '/', element: <h1>Dashboard destination</h1> },
];

const expectEscapeLeavesOpen = async (dialog: HTMLElement) => {
  // keyboard={false} on the modal: Escape must not dismiss it
  await userEvent.keyboard('{Escape}');

  await expect(dialog).toBeVisible();
};

const branchSelectorHost = (
  <ModalHost
    triggerLabel='Manage branch or location'
    openModal={(dispatch) => dispatch.setShowBranchSelector(true)}
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
      name: /manage your branch or location/i,
    });
    await userEvent.click(
      await within(dialog).findByRole('radio', {
        name: /acme melbourne branch/i,
      }),
    );
    await expectEscapeLeavesOpen(dialog);
    await userEvent.click(
      within(dialog).getByRole('button', { name: /save and continue/i }),
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
      name: /manage your branch or location/i,
    });
    const melbourne = await within(dialog).findByRole('radio', {
      name: /acme melbourne branch/i,
    });
    await userEvent.click(melbourne);
    await waitFor(() => expect(melbourne).toBeChecked());

    await userEvent.click(
      within(dialog).getByRole('button', { name: /cancel/i }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /manage your branch/i }),
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
      name: /manage your branch or location/i,
    });

    await expect(
      await within(reopened).findByRole('radio', {
        name: 'ACME Sydney Office',
      }),
    ).toBeChecked();
  },
});

const rfqDeleteHost = (
  <ModalHost
    triggerLabel='Delete draft request'
    openModal={(dispatch) =>
      dispatch.setShowRFQDeleteModal(true, 'RFQ-2024-001234')
    }
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
    const dialog = await screen.findByRole('dialog', {
      name: /confirm deletion/i,
    });
    await waitFor(() => expect(dialog).toBeVisible());

    await expect(
      within(dialog).getByText(/RFQ-2024-001234/),
    ).toBeInTheDocument();
    await expect(
      within(dialog).getByRole('button', { name: /^cancel$/i }),
    ).toBeInTheDocument();
    await expect(
      within(dialog).getByRole('button', { name: /yes, delete/i }),
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
    const dialog = await screen.findByRole('dialog', {
      name: /confirm deletion/i,
    });
    await waitFor(() => expect(dialog).toBeVisible());

    await expect(
      within(dialog).getByText(/RFQ-2024-001234/),
    ).toBeInTheDocument();

    await expectEscapeLeavesOpen(dialog);

    await userEvent.click(
      within(dialog).getByRole('button', { name: /^cancel$/i }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /confirm deletion/i }),
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
      name: /confirm deletion/i,
    });
    await userEvent.click(
      within(dialog).getByRole('button', { name: /yes, delete/i }),
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
