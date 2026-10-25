import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import { MemoryRouter } from 'react-router';

import type * as ReactRouterModule from 'react-router';

import type * as WebApiClientModule from '@/api/web-api-client';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MsalContext, type IMsalContext } from '@azure/msal-react';

import { InteractionStatus, Logger } from '@azure/msal-browser';

import BranchSelectorModal from '@/components/modals/BranchSelectorModal';

import { BranchSelectionModalMode } from '@/components/modals/BranchSelectorModal/enums';

import {
  AccountDispatchCtx,
  AccountStateCtx,
} from '@/authentication/accountContext';

import type { AccountDispatchContext } from '@/authentication/accountContext';

import {
  ModalDispatchCtx,
  ModalStateCtx,
} from '@/components/modals/ModalContext';

// ─── hoisted mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  setDefaultOrganisation: vi.fn().mockResolvedValue(undefined),
  getBranchModalNotification: vi.fn().mockReturnValue(null),
  clearBranchModalNotification: vi.fn(),
  navigate: vi.fn(),
  appLoggerError: vi.fn(),
  setShowBranchSelector: vi.fn(),
  setCompleted: vi.fn(),
  setDefaultOrganisationId: vi.fn(),
  setOrganisationAndBranch: vi.fn(),
  setTargetOrganisation: vi.fn(),
}));

const getOrganisationsByABN = vi.fn();

vi.mock(import('@/api/web-api-client'), async (importOriginal) => {
  const actual = await importOriginal<typeof WebApiClientModule>();
  return {
    ...actual,
    OrganisationsClient: vi.fn(function OrganisationsClientMock() {
      return { setAuthToken: vi.fn(), getOrganisationsByABN };
    }),
    UsersClient: vi.fn(function UsersClientMock() {
      return {
        setAuthToken: vi.fn(),
        setDefaultOrganisation: mocks.setDefaultOrganisation,
      };
    }),
  } satisfies __ExactMockModule<__TestMockModule4>;
});

vi.mock(
  import('@/storage/notification'),
  () =>
    ({
      getBranchModalNotification: () => mocks.getBranchModalNotification(),
      clearBranchModalNotification: () => mocks.clearBranchModalNotification(),
    }) satisfies __ExactMockModule<__TestMockModule46>,
);

vi.mock(
  import('@/instrumentation/AppLogger'),
  () =>
    ({
      default: {
        error: (...args: any[]) => mocks.appLoggerError(...args),
        verbose: vi.fn(),
      },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

vi.mock(import('react-router'), async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouterModule>();
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  } satisfies __ExactMockModule<__TestMockModule11>;
});

vi.mock(
  import('@/components/Alert/NotificationMessage'),
  () =>
    ({
      default: ({ id }: { id: string }) => (
        <div data-testid={id}>notification message</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule48>,
);

// ─── test data ────────────────────────────────────────────────────────────────

const mockBranches = [
  {
    organisationId: 1,
    name: 'ACME Corporation',
    businessListName: 'ACME Sydney Office',
    businessOrTradingName: 'ACME Corporation',
    branchOrLocationName: 'Sydney Office',
    abn: '00000000001',
    crmGuid: 'guid-001',
    streetAddress: { suburb: 'Sydney', state: 'NSW' },
  },
  {
    organisationId: 2,
    name: 'ACME Corporation',
    businessListName: 'ACME Melbourne Branch',
    businessOrTradingName: 'ACME Corporation',
    branchOrLocationName: 'Melbourne Branch',
    abn: '00000000001',
    crmGuid: 'guid-002',
    streetAddress: { suburb: 'Melbourne', state: 'VIC' },
  },
];

// Branch with undefined businessListName — exercises the ?? '' fallback in toSortableText
const mockBranchUndefinedName = {
  organisationId: 3,
  name: 'ACME Corporation',
  businessListName: undefined as unknown as string,
  businessOrTradingName: 'ACME Corporation',
  branchOrLocationName: 'Perth Office',
  abn: '00000000001',
  crmGuid: 'guid-003',
  streetAddress: { suburb: 'Perth', state: 'WA' },
};

const noop = () => {};

const mockMsalAccount = {
  homeAccountId: 'mock-home-account-id',
  environment: 'login.microsoftonline.com',
  tenantId: 'mock-tenant-id',
  username: 'test@example.com',
  localAccountId: 'mock-local-id',
  name: 'Test User',
};

const mockMsalContext: IMsalContext = {
  instance: {
    acquireTokenSilent: async () =>
      ({ accessToken: 'mock-access-token' }) as any,
  } as unknown as IMsalContext['instance'],
  inProgress: InteractionStatus.None,
  accounts: [mockMsalAccount],
  logger: new Logger({ loggerCallback: noop, piiLoggingEnabled: false }),
};

const defaultAccountDispatch: AccountDispatchContext = {
  setAgree: noop,
  setCompleted: () => mocks.setCompleted(),
  setContactCompleted: noop,
  setDefaultOrganisationId: (...args: any[]) =>
    mocks.setDefaultOrganisationId(...args),
  setTargetOrganisation: (...args: any[]) =>
    mocks.setTargetOrganisation(...args),
  setOrganisationAndBranch: (...args: any[]) =>
    mocks.setOrganisationAndBranch(...args),
  setUserProfile: () => Promise.resolve(true),
  setShowBranchSelector: vi.fn(),
  setShowRFQSelectModal: vi.fn(),
};

// ─── render helper ────────────────────────────────────────────────────────────

interface RenderOptions {
  defaultOrganisationId?: number;
  mode?: string;
  rfqId?: string | undefined;
  accountCreationCompleted?: boolean;
  abn?: string | undefined;
  accountDispatch?: AccountDispatchContext | null;
  msalInProgress?: InteractionStatus;
}

const renderModal = (opts: RenderOptions = {}) => {
  const {
    defaultOrganisationId,
    mode = BranchSelectionModalMode.SelectAndEditOrg,
    rfqId,
    accountCreationCompleted = true,
    accountDispatch = defaultAccountDispatch,
    msalInProgress = InteractionStatus.None,
  } = opts;
  // Use 'in' check so that abn:undefined is preserved — destructuring default would replace undefined with the default string
  const abn = 'abn' in opts ? opts.abn : '00000000001';

  const msalContextValue = { ...mockMsalContext, inProgress: msalInProgress };

  return render(
    <MemoryRouter>
      <MsalContext.Provider value={msalContextValue}>
        <AccountStateCtx.Provider
          value={{
            isLoading: false,
            details: {
              organisation: 'ACME Corporation',
              trading: 'ACME Corporation',
              branch: 'Sydney Office',
              homeAccountId: 'mock-id',
              ...(abn === undefined ? {} : { abn }),
              userAcceptedTermsOfUse: true,
              accountCreationCompleted,
              accountContactCompleted: true,
              currentTermsVersion: '1',
              defaultOrganisationId,
              organisationCRMGuid:
                defaultOrganisationId === 1 ? 'guid-001' : undefined,
              organisationIsCompleted: true,
              isDefaultOrganisation: defaultOrganisationId !== undefined,
              showBranchSelector: false,
            },
          }}
        >
          <AccountDispatchCtx.Provider value={accountDispatch as any}>
            <ModalStateCtx.Provider
              value={{
                showBranchSelector: true,
                showRFQDeleteModal: false,
                branchSelectionModalMode: mode,
                ...(rfqId === undefined ? {} : { rfqId }),
              }}
            >
              <ModalDispatchCtx.Provider
                value={{
                  setShowBranchSelector: mocks.setShowBranchSelector,
                  setShowRFQDeleteModal: noop as any,
                  setShowRFQSelectModal: noop as any,
                }}
              >
                <BranchSelectorModal />
              </ModalDispatchCtx.Provider>
            </ModalStateCtx.Provider>
          </AccountDispatchCtx.Provider>
        </AccountStateCtx.Provider>
      </MsalContext.Provider>
    </MemoryRouter>,
  );
};

describe(BranchSelectorModal, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrganisationsByABN.mockResolvedValue(mockBranches);
    mocks.setDefaultOrganisation.mockResolvedValue(undefined);
    mocks.getBranchModalNotification.mockReturnValue(null);
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('preselects the first branch when the account has no default organisation id', async () => {
    expect.assertions(1);
    renderModal();

    const firstBranch = await screen.findByRole('radio', {
      name: 'ACME Sydney Office',
    });

    await waitFor(() => {
      expect(firstBranch).toBeChecked();
    });
  });
});

describe(BranchSelectorModal, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrganisationsByABN.mockResolvedValue(mockBranches);
    mocks.setDefaultOrganisation.mockResolvedValue(undefined);
    mocks.getBranchModalNotification.mockReturnValue(null);
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('preselects the matching branch when the account has a default organisation id', async () => {
    expect.assertions(1);
    renderModal({ defaultOrganisationId: 1 });

    const firstBranch = await screen.findByRole('radio', {
      name: 'ACME Sydney Office',
    });

    await waitFor(() => {
      expect(firstBranch).toBeChecked();
    });
  });
});

describe(BranchSelectorModal, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrganisationsByABN.mockResolvedValue(mockBranches);
    mocks.setDefaultOrganisation.mockResolvedValue(undefined);
    mocks.getBranchModalNotification.mockReturnValue(null);
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('shows no-branches message when the API returns an empty array', async () => {
    expect.assertions(1);
    // An empty result causes a TypeError accessing result[0] which the catch handles,
    // but branches is set to [] before the throw so the empty-branches tbody renders.
    getOrganisationsByABN.mockResolvedValue([]);

    renderModal();

    await waitFor(() => {
      expect(
        screen.getByText(/No branch\/locations available/i),
      ).toBeInTheDocument();
    });
  });
});

describe(BranchSelectorModal, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrganisationsByABN.mockResolvedValue(mockBranches);
    mocks.setDefaultOrganisation.mockResolvedValue(undefined);
    mocks.getBranchModalNotification.mockReturnValue(null);
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('shows error alert when branch loading fails', async () => {
    expect.assertions(2);
    getOrganisationsByABN.mockRejectedValueOnce(new Error('network error'));

    renderModal();

    await waitFor(() => {
      expect(
        screen.getByText(/Error trying to save default branch\/location/i),
      ).toBeInTheDocument();
    });

    expect(mocks.appLoggerError).toHaveBeenCalledWith(
      'Failed to load branches',
      expect.any(Error),
    );
  });
});
