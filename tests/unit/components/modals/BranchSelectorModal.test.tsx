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
import { describe, expect, it, vi } from 'vitest';
import { MsalContext, type IMsalContext } from '@azure/msal-react';
import {
  InteractionStatus,
  Logger,
  stubbedPublicClientApplication,
  type AuthenticationResult,
  type SilentRequest,
} from '@azure/msal-browser';
import BranchSelectorModal from '@/components/modals/BranchSelectorModal';
import { BranchSelectionModalMode } from '@/components/modals/BranchSelectorModal/enums';
import {
  AccountDispatchCtx,
  AccountStateCtx,
} from '@/authentication/accountContext';
import type { AccountDispatchContext } from '@/authentication/accountContext';
import {
  State,
  type OrganisationDto,
  type SetDefaultOrganisationCommand,
} from '@/api/web-api-client';
import { NotificationSeverity, type Notification } from '@/storage/types';
import {
  type ModalDispatch,
  ModalDispatchCtx,
  ModalStateCtx,
} from '@/components/modals/ModalContext';

// ─── hoisted mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  setDefaultOrganisation: vi
    .fn<
      (
        command: SetDefaultOrganisationCommand,
        signal?: AbortSignal,
      ) => Promise<void>
    >()
    .mockResolvedValue(undefined),
  getBranchModalNotification: vi
    .fn<() => Notification | undefined>()
    .mockReturnValue(undefined),
  clearBranchModalNotification: vi.fn<() => void>(),
  navigate: vi.fn<() => void>(),
  appLoggerError:
    vi.fn<(message: string, error: Error, properties?: unknown) => void>(),
  setShowBranchSelector: vi.fn<(show: boolean) => void>(),
  setCompleted: vi.fn<() => void>(),
  setDefaultOrganisationId:
    vi.fn<
      (
        defaultOrganisationId: number | undefined,
        defaultOrganisationCRMId: string | undefined,
      ) => void
    >(),
  setOrganisationAndBranch:
    vi.fn<
      (
        organisationName: string,
        tradingName: string,
        branchName: string,
      ) => void
    >(),
  setTargetOrganisation:
    vi.fn<AccountDispatchContext['setTargetOrganisation']>(),
}));

const getOrganisationsByABN =
  vi.fn<
    (
      abn: string | undefined,
      isCompleted: boolean | null | undefined,
      signal?: AbortSignal,
    ) => Promise<OrganisationDto[]>
  >();

const mockMsalAccount = {
  homeAccountId: 'mock-home-account-id',
  environment: 'login.microsoftonline.com',
  tenantId: 'mock-tenant-id',
  username: 'test@example.com',
  localAccountId: 'mock-local-id',
  name: 'Test User',
};

const acquireTokenSilent = vi
  .fn<(request: SilentRequest) => Promise<AuthenticationResult>>()
  .mockResolvedValue({
    authority: 'https://login.microsoftonline.com/mock-tenant',
    uniqueId: 'mock-unique-id',
    tenantId: 'mock-tenant-id',
    scopes: ['mock-scope'],
    account: mockMsalAccount,
    idToken: 'mock-id-token',
    idTokenClaims: {},
    accessToken: 'mock-access-token',
    fromCache: true,
    expiresOn: null,
    tokenType: 'Bearer',
    correlationId: 'mock-correlation-id',
  });

vi.mock(import('@/api/web-api-client'), (async (
  importOriginal: Parameters<__DynamicPartialMockFactory<__TestMockModule4>>[0],
) => {
  const actual = await importOriginal<typeof WebApiClientModule>();
  return {
    ...actual,
    OrganisationsClient: vi.fn<() => void>(function OrganisationsClientMock() {
      return { setAuthToken: vi.fn<() => void>(), getOrganisationsByABN };
    }),
    UsersClient: vi.fn<() => void>(function UsersClientMock() {
      return {
        setAuthToken: vi.fn<() => void>(),
        setDefaultOrganisation: mocks.setDefaultOrganisation,
      };
    }),
  } satisfies __ExactMockModule<__TestMockModule4>;
}) as unknown as __DynamicPartialMockFactory<__TestMockModule4>);

vi.mock(
  import('@/storage/notification'),
  () =>
    ({
      getBranchModalNotification: mocks.getBranchModalNotification,
      clearBranchModalNotification: mocks.clearBranchModalNotification,
    }) satisfies __ExactMockModule<__TestMockModule46>,
);

vi.mock(
  import('@/instrumentation/AppLogger'),
  (() =>
    ({
      default: {
        error: mocks.appLoggerError,
        verbose: vi.fn<() => void>(),
      },
    }) satisfies __ExactMockModule<__TestMockModule5>) as unknown as __DynamicPartialMockFactory<__TestMockModule5>,
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
  (() =>
    ({
      default: ({ id }: { id: string }) => (
        <div data-testid={id}>notification message</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule48>) as unknown as __DynamicPartialMockFactory<__TestMockModule48>,
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
    streetAddress: { suburb: 'Sydney', state: State.NSW },
  },
  {
    organisationId: 2,
    name: 'ACME Corporation',
    businessListName: 'ACME Melbourne Branch',
    businessOrTradingName: 'ACME Corporation',
    branchOrLocationName: 'Melbourne Branch',
    abn: '00000000001',
    crmGuid: 'guid-002',
    streetAddress: { suburb: 'Melbourne', state: State.VIC },
  },
];

// Branch with undefined businessListName — exercises the ?? '' fallback in toSortableText
const mockBranchUndefinedName = {
  organisationId: 3,
  name: 'ACME Corporation',
  businessListName: undefined,
  businessOrTradingName: 'ACME Corporation',
  branchOrLocationName: 'Perth Office',
  abn: '00000000001',
  crmGuid: 'guid-003',
  streetAddress: { suburb: 'Perth', state: State.WA },
};

const noop = vi.fn<() => void>();

const mockMsalContext: IMsalContext = {
  instance: {
    ...stubbedPublicClientApplication,
    acquireTokenSilent,
  },
  inProgress: InteractionStatus.None,
  accounts: [mockMsalAccount],
  logger: new Logger({ loggerCallback: noop, piiLoggingEnabled: false }),
};

const defaultAccountDispatch: AccountDispatchContext = {
  setAgree: noop,
  setCompleted: mocks.setCompleted,
  setContactCompleted: noop,
  setDefaultOrganisationId: mocks.setDefaultOrganisationId,
  setTargetOrganisation: mocks.setTargetOrganisation,
  setOrganisationAndBranch: mocks.setOrganisationAndBranch,
  setUserProfile: () => Promise.resolve(true),
  setShowBranchSelector: mocks.setShowBranchSelector,
  setShowRFQSelectModal:
    vi.fn<AccountDispatchContext['setShowRFQSelectModal']>(),
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
          <AccountDispatchCtx.Provider value={accountDispatch}>
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
                  setShowRFQDeleteModal:
                    vi.fn<ModalDispatch['setShowRFQDeleteModal']>(),
                  setShowRFQSelectModal:
                    vi.fn<ModalDispatch['setShowRFQSelectModal']>(),
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

// ─── tests ────────────────────────────────────────────────────────────────────

describe('branch selector modal', () => {
  const resetBranchSelectorMocks = () => {
    vi.clearAllMocks();
    getOrganisationsByABN.mockResolvedValue(mockBranches);
    mocks.setDefaultOrganisation.mockResolvedValue(undefined);
    mocks.getBranchModalNotification.mockReturnValue(undefined);
  };

  // ── branch loading ──────────────────────────────────────────────────────

  it('preselects the first branch when the account has no default organisation id', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

    renderModal();

    const firstBranch = await screen.findByRole('radio', {
      name: 'ACME Sydney Office',
    });

    await waitFor(() => {
      expect(firstBranch).toBeChecked();
    });
  });

  it('preselects the matching branch when the account has a default organisation id', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

    renderModal({ defaultOrganisationId: 1 });

    const firstBranch = await screen.findByRole('radio', {
      name: 'ACME Sydney Office',
    });

    await waitFor(() => {
      expect(firstBranch).toBeChecked();
    });
  });

  it('shows no-branches message when the API returns an empty array', async () => {
    // An empty result causes a TypeError accessing result[0] which the catch handles,
    // but branches is set to [] before the throw so the empty-branches tbody renders.
    expect.hasAssertions();

    resetBranchSelectorMocks();

    getOrganisationsByABN.mockResolvedValue([]);

    renderModal();

    await waitFor(() => {
      expect(
        screen.getByText(/No branch\/locations available/i),
      ).toBeInTheDocument();
    });
  });

  it('shows error alert when branch loading fails', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

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

  it('ignores branch load result after the component unmounts (covers !isActive return in try)', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

    let resolveLoad!: (value: OrganisationDto[]) => void;
    getOrganisationsByABN.mockReturnValueOnce(
      new Promise<OrganisationDto[]>((resolve) => {
        resolveLoad = resolve;
      }),
    );

    const { unmount } = renderModal();
    unmount();

    await act(async () => {
      resolveLoad(mockBranches);
      await Promise.resolve();
    });
    await Promise.resolve();

    expect(mocks.appLoggerError).not.toHaveBeenCalled();
  });

  it('ignores branch load error after the component unmounts (covers !isActive return in catch)', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

    let rejectLoad!: (error: Error) => void;
    getOrganisationsByABN.mockReturnValueOnce(
      new Promise<OrganisationDto[]>((_, reject) => {
        rejectLoad = reject;
      }),
    );

    const { unmount } = renderModal();
    unmount();

    await act(async () => {
      rejectLoad(new Error('stale error'));
      await Promise.resolve();
    });
    await Promise.resolve();

    // isActive was false when catch executed — error not logged
    expect(mocks.appLoggerError).not.toHaveBeenCalled();
  });

  it('skips branch loading when the account ABN is not set', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

    renderModal({ abn: undefined });

    await Promise.resolve();

    expect(getOrganisationsByABN).not.toHaveBeenCalled();
  });

  // ── UI modes ────────────────────────────────────────────────────────────

  it('renders the RFQ modal title and body text', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

    renderModal({ mode: BranchSelectionModalMode.RFQSelectOrg });

    await screen.findByRole('radio', { name: 'ACME Sydney Office' });

    expect(screen.getByText('Change branch/location')).toBeInTheDocument();
    expect(
      screen.getByText(/Select default branch or location name/i),
    ).toBeInTheDocument();
  });

  it('renders a notification message when getBranchModalNotification returns a value', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

    mocks.getBranchModalNotification.mockReturnValue({
      message: 'Info note',
      severity: NotificationSeverity.Information,
    });

    renderModal();

    await waitFor(() => {
      expect(screen.getByTestId('notif-message-1')).toBeInTheDocument();
    });
  });

  it('does not render a notification when storage has no branch notification', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

    renderModal();

    await screen.findByRole('radio', { name: 'ACME Sydney Office' });

    expect(screen.queryByTestId('notif-message-1')).not.toBeInTheDocument();
  });

  // ── interactions ────────────────────────────────────────────────────────

  it('updates selected branch when a different radio button is clicked', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

    renderModal();

    await screen.findByRole('radio', { name: 'ACME Sydney Office' });

    const secondBranch = screen.getByRole('radio', {
      name: 'ACME Melbourne Branch',
    });
    fireEvent.click(secondBranch);

    await waitFor(() => {
      expect(secondBranch).toBeChecked();
    });
  });

  it('shows the cancel button when a default organisation id is set', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

    renderModal({ defaultOrganisationId: 1 });

    await screen.findByRole('radio', { name: 'ACME Sydney Office' });

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('does not show the cancel button when no default organisation id is set', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

    renderModal();

    await screen.findByRole('radio', { name: 'ACME Sydney Office' });

    expect(
      screen.queryByRole('button', { name: /cancel/i }),
    ).not.toBeInTheDocument();
  });

  it('calls setShowBranchSelector(false) when the cancel button is clicked', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

    renderModal({ defaultOrganisationId: 1 });

    await screen.findByRole('radio', { name: 'ACME Sydney Office' });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mocks.setShowBranchSelector).toHaveBeenCalledWith(false);
    expect(mocks.clearBranchModalNotification).toHaveBeenCalledWith();
  });

  // ── sorting ─────────────────────────────────────────────────────────────

  it('toggles sort direction from asc to desc and covers all getArrow icon paths', async () => {
    // Branch with undefined businessListName exercises the ?? '' fallback in toSortableText
    expect.hasAssertions();

    resetBranchSelectorMocks();

    getOrganisationsByABN.mockResolvedValueOnce([
      ...mockBranches,
      mockBranchUndefinedName,
    ]);

    renderModal();

    await screen.findByRole('radio', { name: 'ACME Sydney Office' });

    const sortBtn = screen.getByRole('button', {
      name: /branch\/location name/i,
    });

    // First click: key 'branchOrLocationName' → 'businessListName', direction stays 'asc'
    // getArrow for businessListName now returns primary-down (direction=asc)
    fireEvent.click(sortBtn);

    // Second click: same key, direction 'asc' → 'desc'
    // getArrow returns primary-up (direction=desc); sort comparison uses -comparison
    fireEvent.click(sortBtn);

    // Three radio buttons still visible after sorting
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  // ── save — SelectAndEditOrg ─────────────────────────────────────────────

  it('calls setDefaultOrganisation without rfqId and navigates to home on save', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

    renderModal();

    await screen.findByRole('radio', { name: 'ACME Sydney Office' });

    fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));

    await waitFor(() => {
      expect(mocks.setDefaultOrganisation).toHaveBeenCalledWith(
        expect.objectContaining({ defaultOrganisationId: 1 }),
      );
    });

    expect(mocks.navigate).toHaveBeenCalledWith('/');
    expect(mocks.setShowBranchSelector).toHaveBeenCalledWith(false);
    expect(mocks.clearBranchModalNotification).toHaveBeenCalledWith();
    expect(mocks.setOrganisationAndBranch).toHaveBeenCalledWith(
      'ACME Corporation',
      'ACME Corporation',
      'Sydney Office',
    );
  });

  // ── save — RFQSelectOrg ─────────────────────────────────────────────────

  it('calls setDefaultOrganisation with rfqId and reloads the page on save (RFQ mode)', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

    const origLocation = globalThis.location;
    const reloadMock = vi.fn<() => void>();
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { ...origLocation, reload: reloadMock },
    });

    renderModal({
      mode: BranchSelectionModalMode.RFQSelectOrg,
      rfqId: 'RFQ-123',
    });

    await screen.findByRole('radio', { name: 'ACME Sydney Office' });

    fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));

    await waitFor(() => {
      expect(mocks.setDefaultOrganisation).toHaveBeenCalledWith(
        expect.objectContaining({ defaultOrganisationId: 1, rfqId: 'RFQ-123' }),
      );
    });

    expect(reloadMock).toHaveBeenCalledWith();
    expect(mocks.navigate).not.toHaveBeenCalled();

    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: origLocation,
    });
  });

  // ── save — error ────────────────────────────────────────────────────────

  it('shows error alert and logs when save fails', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

    mocks.setDefaultOrganisation.mockRejectedValueOnce(new Error('save error'));

    renderModal();

    await screen.findByRole('radio', { name: 'ACME Sydney Office' });

    fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Error trying to save default branch\/location/i),
      ).toBeInTheDocument();
    });

    expect(mocks.appLoggerError).toHaveBeenCalledWith(
      'Failed to select organisation',
      expect.any(Error),
    );
  });

  // ── dispatch helpers ────────────────────────────────────────────────────

  it('returns early from applyAccountDispatchUpdates when accountDispatch is null', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

    renderModal({ accountDispatch: null });

    await screen.findByRole('radio', { name: 'ACME Sydney Office' });

    fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));

    await waitFor(() => {
      expect(mocks.setDefaultOrganisation).toHaveBeenCalledWith({
        defaultOrganisationId: 1,
      });
    });

    // Helper returned early — no dispatch calls made
    expect(mocks.setDefaultOrganisationId).not.toHaveBeenCalled();
    expect(mocks.setOrganisationAndBranch).not.toHaveBeenCalled();
  });

  it('skips setOrganisationAndBranch when selectedOrganisation is undefined', async () => {
    // No ABN → branches never load → selectedOrganisation stays undefined
    expect.hasAssertions();

    resetBranchSelectorMocks();

    renderModal({ abn: undefined });

    fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));

    await waitFor(() => {
      expect(mocks.setDefaultOrganisation).toHaveBeenCalledWith({});
    });

    expect(mocks.setDefaultOrganisationId).toHaveBeenCalledWith(
      undefined,
      undefined,
    );
    expect(mocks.setOrganisationAndBranch).not.toHaveBeenCalled();
  });

  it('calls setCompleted and setTargetOrganisation when account creation is incomplete on save', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

    renderModal({ accountCreationCompleted: false });

    await screen.findByRole('radio', { name: 'ACME Sydney Office' });

    fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));

    await waitFor(() => {
      expect(mocks.setCompleted).toHaveBeenCalledWith();
    });

    expect(mocks.setTargetOrganisation).toHaveBeenCalledWith(
      'ACME Corporation',
      '00000000001',
    );
  });

  it('does nothing when MSAL interaction is in progress (line 187 false branch)', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

    renderModal({ msalInProgress: InteractionStatus.AcquireToken });

    await screen.findByRole('radio', { name: 'ACME Sydney Office' });

    fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));

    await Promise.resolve();

    expect(mocks.setDefaultOrganisation).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('passes empty-string fallbacks when tradingName and branchName are undefined on save', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

    getOrganisationsByABN.mockResolvedValueOnce([
      {
        organisationId: 5,
        name: 'No-Name Corp',
        businessListName: 'No-Name WA Office',
        businessOrTradingName: undefined,
        branchOrLocationName: undefined,
        abn: '00000000001',
        crmGuid: 'guid-005',
        streetAddress: { suburb: 'Perth', state: State.WA },
      },
    ]);

    renderModal();

    await screen.findByRole('radio', { name: 'No-Name WA Office' });

    fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));

    await waitFor(() => {
      expect(mocks.setOrganisationAndBranch).toHaveBeenCalledWith(
        'No-Name Corp',
        '',
        '',
      );
    });
  });

  it('skips setDefaultOrganisation and navigates when modal mode is unrecognised (line 199 false branch)', async () => {
    expect.hasAssertions();

    resetBranchSelectorMocks();

    renderModal({ mode: 'UnknownMode' });

    await screen.findByRole('radio', { name: 'ACME Sydney Office' });

    fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/');
    });

    expect(mocks.setDefaultOrganisation).not.toHaveBeenCalled();
  });
});
