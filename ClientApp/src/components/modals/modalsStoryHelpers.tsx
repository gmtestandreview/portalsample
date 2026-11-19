import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from 'react-bootstrap';
import { expect, userEvent, within, screen, waitFor } from 'storybook/test';
import ConfirmationModal from './ConfirmationModal';
import BranchSelectorModal from './BranchSelectorModal';
import RFQDeleteModal from './RFQDeleteModal';
import { ModalDispatchCtx, ModalStateCtx } from './ModalContext';
import type { ModalDispatch, ModalState } from './ModalContext';
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

export const mockAccountDetails = {
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

export const findVisibleDialog = async (name: RegExp) => {
  const dialog = await screen.findByRole('dialog', { name });
  await waitFor(() => expect(dialog).toBeVisible());
  return dialog;
};

export const findBranchRadios = async (dialog: HTMLElement) => ({
  selectedBranch: await within(dialog).findByRole('radio', {
    name: /acme sydney office/iu,
  }),
  alternateBranch: await within(dialog).findByRole('radio', {
    name: /acme melbourne branch/iu,
  }),
});

interface RecordedRequest {
  method: string;
  url: string;
  body: unknown;
}

interface ModalObservations {
  requests: RecordedRequest[];
  defaultOrganisation: [number | undefined, string | undefined][];
  organisationAndBranch: [string, string, string][];
  branchSelectorVisibility: boolean[];
  rfqDeleteVisibility: [boolean, string][];
}

const emptyObservations = (): ModalObservations => ({
  requests: [],
  defaultOrganisation: [],
  organisationAndBranch: [],
  branchSelectorVisibility: [],
  rfqDeleteVisibility: [],
});

export const observed: { current: ModalObservations } = {
  current: emptyObservations(),
};

// Shared meta options for every Modals story file. Each file keeps its own
// literal `title: 'Modals'` so story ids stay `modals--<story>`.
export const modalsMetaOptions = {
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
    layout: 'centered' as const,
  },
};

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

export const createBranchSelectorFetch =
  (branches = mockBranches): typeof globalThis.fetch =>
  (input, init) => {
    const url = resolveFetchUrl(input);

    if (init?.method === 'PUT') {
      observed.current.requests.push({
        method: init.method,
        url,
        body:
          typeof init.body === 'string'
            ? (JSON.parse(init.body) as unknown)
            : null,
      });
      return Promise.resolve(new Response('', { status: 200 }));
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
      return Promise.resolve(jsonResponse(branches));
    }

    if (url.includes('/api/users/default-organisation')) {
      return Promise.resolve(jsonResponse({}));
    }

    return Promise.resolve(new Response('Not found', { status: 404 }));
  };

// Mirrors PreConditions: owns ModalState, mounts the modal only while it is shown
// and provides a real trigger so focus restoration can be observed.
export const ModalHost = ({
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
        <Button
          onClick={() => {
            openModal(dispatch);
          }}
        >
          {triggerLabel}
        </Button>
        {children(state)}
      </ModalDispatchCtx.Provider>
    </ModalStateCtx.Provider>
  );
};

export const dashboardDestination = [
  { path: '/', element: <h1>Dashboard destination</h1> },
];

export const expectEscapeLeavesOpen = async (dialog: HTMLElement) => {
  // keyboard={false} on the modal: Escape must not dismiss it
  await userEvent.keyboard('{Escape}');

  await expect(dialog).toBeVisible();
};

export const DeleteConfirmationDemo = () => {
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

export const SaveAndExitDemo = () => {
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

export const branchSelectorHost = (
  <ModalHost
    triggerLabel='Manage branch or location'
    openModal={(dispatch) => {
      dispatch.setShowBranchSelector(true);
    }}
  >
    {(state) => (state.showBranchSelector ? <BranchSelectorModal /> : null)}
  </ModalHost>
);

export const branchSelectorPortal = {
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

export const rfqDeleteHost = (
  <ModalHost
    triggerLabel='Delete draft request'
    openModal={(dispatch) => {
      dispatch.setShowRFQDeleteModal(true, 'RFQ-2024-001234');
    }}
  >
    {(state) => (state.showRFQDeleteModal ? <RFQDeleteModal /> : null)}
  </ModalHost>
);

export const rfqDeletePortal = {
  accountDetails: mockAccountDetails,
  fetch: createBranchSelectorFetch(),
  initialEntries: ['/request'],
  destinationRoutes: dashboardDestination,
};
