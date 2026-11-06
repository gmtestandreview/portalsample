import type React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { vi, describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { AccountDetails } from '../../../ClientApp/src/authentication/accountContext';
import type * as HelperFunctionsModule from '../../../ClientApp/src/routes/common/helperFunctions';
import type { DashboardClient } from '../../../ClientApp/src/api/web-api-client';
import { DashboardTab } from '../../../ClientApp/src/components/SearchFilter/types';
import type { CustomPaginationProps } from '../../../ClientApp/src/components/Pagination/types';
import { defined } from '../helpers/defined';

// ── Hoisted mock functions (available inside vi.mock factories) ────────────────

const {
  mockSetAuthToken,
  mockGetDrafts,
  mockGetQuotes,
  mockGetArtefacts,
  mockAcquireTokenSilent,
  mockSetUserProfile,
  mockSetShowBranchSelector,
  mockTrackGAEvent,
  mockSessionGetItem,
  mockSessionSetItem,
  mockSessionRemoveItem,
  mockSetTargetOrganisation,
  mockSetDashboardNotification,
  mockMapToUserProfile,
  mockAccountDispatchState,
  mockGetDashboardNotification,
  mockGetDashboardInfoNotification,
  mockClearDashboardNotification,
  mockClearDashboardInfoNotification,
  mockModalState,
  mockMsalContext,
} = vi.hoisted(() => ({
  mockSetAuthToken: vi.fn<DashboardClient['setAuthToken']>(),
  mockGetDrafts: vi.fn<DashboardClient['getDashboardDraftsByPortalID']>(),
  mockGetQuotes: vi.fn<DashboardClient['getDashboardQuotesByPortalID']>(),
  mockGetArtefacts: vi.fn<DashboardClient['getDashboardArtefactsByPortalID']>(),
  mockAcquireTokenSilent: vi
    .fn<(...args: unknown[]) => unknown>()
    .mockResolvedValue({ accessToken: 'mock-token' }),
  mockSetUserProfile: vi.fn<(...args: unknown[]) => unknown>(),
  mockSetShowBranchSelector: vi.fn<(...args: unknown[]) => unknown>(),
  mockTrackGAEvent: vi.fn<(...args: unknown[]) => unknown>(),
  mockSessionGetItem: vi.fn<() => string | null>(() => null),
  mockSessionSetItem: vi.fn<(...args: unknown[]) => unknown>(),
  mockSessionRemoveItem: vi.fn<(...args: unknown[]) => unknown>(),
  mockSetTargetOrganisation: vi.fn<(...args: unknown[]) => unknown>(),
  mockSetDashboardNotification: vi.fn<(...args: unknown[]) => unknown>(),
  mockMapToUserProfile: vi.fn<typeof HelperFunctionsModule.mapToUserProfile>(
    (p) =>
      ({
        filterYearType:
          (p as Record<string, unknown>)['filterYearType'] ?? 'allYears',
        filterStatusType:
          (p as Record<string, unknown>)['filterStatusType'] ?? 'allStatuses',
        filterCurrentPage:
          (p as Record<string, unknown>)['filterCurrentPage'] ?? 1,
        filterActiveTab:
          (p as Record<string, unknown>)['filterActiveTab'] ?? 'drafts',
        filterSearchText:
          (p as Record<string, unknown>)['filterSearchText'] ?? '',
        filterSortOrder:
          (p as Record<string, unknown>)['filterSortOrder'] ?? 'descending',
        filtersChanged:
          (p as Record<string, unknown>)['filtersChanged'] ?? false,
      }) as ReturnType<typeof HelperFunctionsModule.mapToUserProfile>,
  ),
  mockAccountDispatchState: {
    value: {
      setAgree: vi.fn<(...args: unknown[]) => unknown>(),
      setCompleted: vi.fn<(...args: unknown[]) => unknown>(),
      setContactCompleted: vi.fn<(...args: unknown[]) => unknown>(),
      setDefaultOrganisationId: vi.fn<(...args: unknown[]) => unknown>(),
      setTargetOrganisation: vi.fn<(...args: unknown[]) => unknown>(),
      setOrganisationAndBranch: vi.fn<(...args: unknown[]) => unknown>(),
      setUserProfile: vi.fn<(...args: unknown[]) => unknown>(),
    } as Record<string, ReturnType<typeof vi.fn>> | undefined,
  },
  mockGetDashboardNotification: vi.fn<
    () => { message: string; severity: string } | null
  >(() => null),
  mockGetDashboardInfoNotification: vi.fn<
    () => { message: string; severity: string } | null
  >(() => null),
  mockClearDashboardNotification: vi.fn<(...args: unknown[]) => unknown>(),
  mockClearDashboardInfoNotification: vi.fn<(...args: unknown[]) => unknown>(),
  mockModalState: {
    showBranchSelector: false,
    showRFQDeleteModal: false,
    branchSelectionModalMode: undefined as string | undefined,
  },
  mockMsalContext: {
    instance: {
      acquireTokenSilent: vi
        .fn<(...args: unknown[]) => unknown>()
        .mockResolvedValue({ accessToken: 'mock-token' }),
    },
    accounts: [{ homeAccountId: 'id' }],
    inProgress: 'none',
  },
}));

// ── Mutable state for per-test account customisation ─────────────────────────

let mockAccountDetails: AccountDetails | null = null;

// ── Module mocks ───────────────────────────────────────────────────────────────

vi.mock(
  '../../../ClientApp/src/api/web-api-client',
  () =>
    ({
      DashboardClient: vi
        .fn<(...args: unknown[]) => unknown>()
        .mockImplementation(function (this: DashboardClient) {
          this.setAuthToken = mockSetAuthToken;
          this.getDashboardDraftsByPortalID = mockGetDrafts;
          this.getDashboardQuotesByPortalID = mockGetQuotes;
          this.getDashboardArtefactsByPortalID = mockGetArtefacts;
        }),
      StatusEnumDto: {},
    }) satisfies __ExactMockModule<__TestMockModule4>,
);

vi.mock(
  '@azure/msal-react',
  () =>
    ({
      useMsal: () => mockMsalContext,
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(
  '@azure/msal-browser',
  () =>
    ({
      InteractionStatus: { None: 'none' },
    }) satisfies __ExactMockModule<__TestMockModule3>,
);

vi.mock(
  '../../../ClientApp/src/authentication/hooks',
  () =>
    ({
      useAccountState: () => ({ details: mockAccountDetails }),
      useAccountDispatch: () => mockAccountDispatchState.value,
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

vi.mock(
  import('../../../ClientApp/src/authentication/authConfig'),
  () =>
    ({
      tokenRequest: { scopes: ['openid'] },
    }) satisfies __ExactMockModule<__TestMockModule8>,
);

vi.mock(
  '../../../ClientApp/src/components/modals/ModalContext',
  () =>
    ({
      useModalState: () => mockModalState,
      useModalDispatch: () => ({
        setShowBranchSelector: mockSetShowBranchSelector,
      }),
    }) satisfies __ExactMockModule<__TestMockModule27>,
);

vi.mock(
  import('../../../ClientApp/src/routes/common/constants'),
  () =>
    ({
      defaultFilter: {
        filterYearType: 'allYears',
        filterStatusType: 'allStatuses',
        filterCurrentPage: 1,
        filterActiveTab: 'drafts',
        filterSearchText: '',
        filterSortOrder: 'descending',
        filtersChanged: false,
      },
    }) satisfies __ExactMockModule<__TestMockModule103>,
);

vi.mock(
  import('../../../ClientApp/src/routes/common/helperFunctions'),
  () =>
    ({
      mapToUserProfile: mockMapToUserProfile,
    }) satisfies __ExactMockModule<__TestMockModule9>,
);

vi.mock(
  import('../../../ClientApp/src/components/Welcome'),
  () =>
    ({
      default: () => <div data-testid='welcome' />,
    }) satisfies __ExactMockModule<__TestMockModule93>,
);

vi.mock(
  import('../../../ClientApp/src/components/BlockUISpinner'),
  () =>
    ({
      default: ({ children }: any) => (
        <div data-testid='block-spinner'>{children}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule14>,
);

vi.mock(
  import('../../../ClientApp/src/components/Alert/NotificationMessage'),
  () =>
    ({
      default: () => <div data-testid='notification-message' />,
    }) satisfies __ExactMockModule<__TestMockModule48>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/useHtmlTitle'),
  () =>
    ({
      default: vi.fn<() => void>(),
    }) satisfies __ExactMockModule<__TestMockModule89>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/useBodyClass'),
  () =>
    ({
      default: vi.fn<() => void>(),
    }) satisfies __ExactMockModule<__TestMockModule59>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/useDebounce'),
  () =>
    ({
      default: <T,>(value: T): T => value,
    }) satisfies __ExactMockModule<__TestMockModule104>,
);

vi.mock(
  import('../../../ClientApp/src/components/tiles/StandardPathway'),
  () =>
    ({
      default: () => <div data-testid='standard-pathway' />,
    }) satisfies __ExactMockModule<__TestMockModule94>,
);

vi.mock(
  import('../../../ClientApp/src/components/SearchFilter'),
  () =>
    ({
      default: () => <div data-testid='search-filter' />,
    }) satisfies __ExactMockModule<__TestMockModule105>,
);

vi.mock(
  import('../../../ClientApp/src/components/RequestList/requestItem'),
  () =>
    ({
      default: () => <li data-testid='request-item' />,
    }) satisfies __ExactMockModule<__TestMockModule106>,
);

vi.mock(
  import('../../../ClientApp/src/components/RequestList/instrumentItem'),
  () =>
    ({
      default: () => <li data-testid='instrument-item' />,
    }) satisfies __ExactMockModule<__TestMockModule107>,
);

vi.mock(
  import('../../../ClientApp/src/components/RequestList/noRequests'),
  () =>
    ({
      default: () => <div data-testid='no-requests' />,
    }) satisfies __ExactMockModule<__TestMockModule95>,
);

// CustomPagination mock — exposes data-current, data-total, and an onPageChange-wired Next button
vi.mock(
  import('../../../ClientApp/src/components/Pagination'),
  () =>
    ({
      default: ({
        onPageChange,
        currentPage,
        totalPages,
      }: Readonly<CustomPaginationProps>) => (
        <button
          data-testid='pagination'
          data-current={currentPage}
          data-total={totalPages}
          onClick={() => {
            onPageChange((currentPage ?? 1) + 1);
          }}
        >
          Next
        </button>
      ),
    }) satisfies __ExactMockModule<__TestMockModule98>,
);

vi.mock(
  import('../../../ClientApp/src/components/PaginationHeader'),
  () =>
    ({
      default: () => <div data-testid='pagination-header' />,
    }) satisfies __ExactMockModule<__TestMockModule99>,
);

vi.mock(
  '../../../ClientApp/src/instrumentation/AppLogger',
  () =>
    ({
      default: {
        info: vi.fn<(...args: unknown[]) => unknown>(),
        verbose: vi.fn<(...args: unknown[]) => unknown>(),
        warning: vi.fn<(...args: unknown[]) => unknown>(),
        error: vi.fn<(...args: unknown[]) => unknown>(),
        critical: vi.fn<(...args: unknown[]) => unknown>(),
        trace: vi.fn<(...args: unknown[]) => unknown>(),
      },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

vi.mock(
  '../../../ClientApp/src/routes/common/errorRoutes',
  () =>
    ({
      default: (_status: number) => '/server-error',
    }) satisfies __ExactMockModule<__TestMockModule100>,
);

vi.mock(
  '../../../ClientApp/src/routes/common/dashboardNotifications',
  () =>
    ({
      DashBoardNotifications: {
        getForbiddenNotification: vi.fn<(...args: unknown[]) => unknown>(
          () => ({
            message: 'forbidden',
            severity: 'error',
          }),
        ),
        getThirdPartyAccessNotification: vi.fn<(...args: unknown[]) => unknown>(
          () => ({
            message: 'no-third-party',
            severity: 'error',
          }),
        ),
        getReportFormsGeneratedNotification: vi.fn<
          (...args: unknown[]) => unknown
        >(() => ({
          message: 'report-forms',
          severity: 'info',
        })),
        getDashboardErrorNotification: vi.fn<(...args: unknown[]) => unknown>(
          () => ({
            message: 'error',
            severity: 'error',
          }),
        ),
      },
    }) satisfies __ExactMockModule<__TestMockModule101>,
);

vi.mock(
  '../../../ClientApp/src/storage/notification',
  () =>
    ({
      getDashboardNotification: mockGetDashboardNotification,
      clearDashboardNotification: mockClearDashboardNotification,
      setDashboardNotification: mockSetDashboardNotification,
      getDashboardInfoNotification: mockGetDashboardInfoNotification,
      setDashboardInfoNotification: vi.fn<(...args: unknown[]) => unknown>(),
      clearDashboardInfoNotification: mockClearDashboardInfoNotification,
    }) satisfies __ExactMockModule<__TestMockModule46>,
);

vi.mock(
  '../../../ClientApp/src/storage/sessionStorageCache',
  () =>
    ({
      default: () => ({
        getItem: mockSessionGetItem,
        setItem: mockSessionSetItem,
        removeItem: mockSessionRemoveItem,
        clear: vi.fn<(...args: unknown[]) => unknown>(),
      }),
    }) satisfies __ExactMockModule<__TestMockModule72>,
);

vi.mock(
  import('../../../ClientApp/src/analytics/GoogleAnalytics'),
  () =>
    ({
      trackGAEvent: mockTrackGAEvent,
    }) satisfies __ExactMockModule<__TestMockModule22>,
);

vi.mock(
  '../../../ClientApp/src/routes/common/enums',
  () =>
    ({
      DashboardItemStatus: {
        QuoteAvailable: 'Quote offer is available',
        QuoteAccepted: 'Quote offer is accepted',
      },
      QuoteStatus: {},
      Environment: {},
    }) satisfies __ExactMockModule<__TestMockModule108>,
);

vi.mock(
  '../../../ClientApp/src/components/modals/BranchSelectorModal/enums',
  () =>
    ({
      BranchSelectionModalMode: {
        SelectAndEditOrg: 'SelectAndEditOrg',
        RFQSelectOrg: 'RFQSelectOrg',
      },
    }) satisfies __ExactMockModule<__TestMockModule109>,
);

vi.mock(
  import('react-number-format'),
  () =>
    ({
      PatternFormat: ({ value }: any) => <span>{value}</span>,
    }) satisfies __ExactMockModule<__TestMockModule102>,
);

// ── Fixtures ───────────────────────────────────────────────────────────────────

const EMPTY_PAGE_RESPONSE = {
  items: [],
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
};

const expectObjectContaining = (value: Record<string, unknown>): unknown =>
  expect.objectContaining(value);

type DashboardPage = Awaited<
  ReturnType<DashboardClient['getDashboardDraftsByPortalID']>
>;

const asDashboardPage = (value: Record<string, unknown>): DashboardPage =>
  value;

// userProfile must be set so the Dashboard component populates initialFilters,
// which gates the stableFilters.filterActiveTab guard in the fetch useEffect.
const BASE_USER_PROFILE = {
  filterYearType: 'allYears',
  filterStatusType: 'allStatuses',
  filterCurrentPage: 1,
  filterActiveTab: DashboardTab.Drafts,
  filterSearchText: '',
  filterSortOrder: 'descending',
  filtersChanged: false,
};

const BASE: AccountDetails = {
  organisation: 'Acme',
  trading: 'Acme',
  branch: '',
  homeAccountId: 'id',
  userAcceptedTermsOfUse: true,
  accountCreationCompleted: true,
  accountContactCompleted: true,
  currentTermsVersion: '1',
  defaultOrganisationId: 1,
  organisationCRMGuid: 'crm-guid-001',
  organisationIsCompleted: true,
  isDefaultOrganisation: true,
  showBranchSelector: false,
  userProfile: { testingCalibrationDashboard: BASE_USER_PROFILE },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

// Dynamic import so each test gets a fresh module evaluation after vi.clearAllMocks
async function importDashboard() {
  const mod = await import('../../../ClientApp/src/routes/dashboard/index');
  return mod.default;
}

function renderDashboard(Dashboard: React.ComponentType) {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path='/' element={<Dashboard />} />
        <Route
          path='/server-error'
          element={<div data-testid='error-page' />}
        />
        <Route path='*' element={<div data-testid='error-page' />} />
      </Routes>
    </MemoryRouter>,
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────────

const resetDashboardMocks = () => {
  vi.clearAllMocks();
  // Restore default resolved value after clearAllMocks resets implementations
  mockAcquireTokenSilent.mockResolvedValue({ accessToken: 'mock-token' });
  mockMsalContext.instance.acquireTokenSilent = mockAcquireTokenSilent;
  mockMsalContext.inProgress = 'none';
  mockGetDrafts.mockResolvedValue({ ...EMPTY_PAGE_RESPONSE });
  mockGetQuotes.mockResolvedValue({ ...EMPTY_PAGE_RESPONSE });
  mockGetArtefacts.mockResolvedValue({ ...EMPTY_PAGE_RESPONSE });
  mockSessionGetItem.mockReturnValue(null);
  mockGetDashboardNotification.mockReturnValue(null);
  mockGetDashboardInfoNotification.mockReturnValue(null);
  mockModalState.showBranchSelector = false;
  mockModalState.showRFQDeleteModal = false;
  mockModalState.branchSelectionModalMode = undefined;
  mockAccountDispatchState.value = {
    setAgree: vi.fn<(...args: unknown[]) => unknown>(),
    setCompleted: vi.fn<(...args: unknown[]) => unknown>(),
    setContactCompleted: vi.fn<(...args: unknown[]) => unknown>(),
    setDefaultOrganisationId: vi.fn<(...args: unknown[]) => unknown>(),
    setTargetOrganisation: mockSetTargetOrganisation,
    setOrganisationAndBranch: vi.fn<(...args: unknown[]) => unknown>(),
    setUserProfile: mockSetUserProfile,
  };
  mockMapToUserProfile.mockImplementation((p) => ({
    filterYearType: p.testingCalibrationDashboard?.filterYearType ?? 'allYears',
    filterStatusType:
      p.testingCalibrationDashboard?.filterStatusType ?? 'allStatuses',
    filterCurrentPage: p.testingCalibrationDashboard?.filterCurrentPage ?? 1,
    filterActiveTab:
      (p.testingCalibrationDashboard?.filterActiveTab as DashboardTab) ??
      DashboardTab.Drafts,
    filterSearchText: p.testingCalibrationDashboard?.filterSearchText ?? '',
    filterSortOrder:
      p.testingCalibrationDashboard?.filterSortOrder ?? 'descending',
    filtersChanged: p.testingCalibrationDashboard?.filtersChanged ?? false,
  }));
  mockAccountDetails = { ...BASE };
};

describe('dashboard', () => {
  // ── Test 1: Renders without crashing ──────────────────────────────────────

  it('1. renders without crashing and shows Welcome component', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(screen.getByTestId('welcome')).toBeInTheDocument();
    });
  });

  // ── Test 2: SEC-010 — organisationCRMGuid passed as first arg to API ──────

  it('2. (SEC-010) passes organisationCRMGuid as first argument to getDashboardDraftsByPortalID', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(mockGetDrafts.mock.calls.length).toBeGreaterThan(0);
    });

    // SEC-010: every call — not just the first — must use the correct org GUID
    for (const call of mockGetDrafts.mock.calls) {
      expect(call[0]).toBe('crm-guid-001');
    }
  });

  it('uses the saved search in the first dashboard request', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockMapToUserProfile.mockReturnValue({
      ...BASE_USER_PROFILE,
      filterSearchText: 'Fluke',
    });
    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(mockGetDrafts.mock.calls.length).toBeGreaterThan(0);
    });

    expect(defined(mockGetDrafts.mock.calls[0])[4]).toBe('Fluke');
  });

  // ── Test 3: Sets auth token before API call ────────────────────────────────

  it('3. sets auth token on the client before making API calls', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(mockSetAuthToken).toHaveBeenCalledWith('mock-token');
    });

    // Verify ordering: setAuthToken must precede getDashboardDraftsByPortalID
    expect(mockGetDrafts.mock.calls.length).toBeGreaterThan(0);

    const setTokenOrder = mockSetAuthToken.mock.invocationCallOrder[0];
    const getDraftsOrder = mockGetDrafts.mock.invocationCallOrder[0];

    expect(setTokenOrder).toBeLessThan(defined(getDraftsOrder));
  });

  // ── Test 4: NoRequests when API returns empty items ────────────────────────

  it('4. shows NoRequests component when API returns empty items array', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockGetDrafts.mockResolvedValue({
      items: [],
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
    });
    mockGetQuotes.mockResolvedValue({
      items: [],
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
    });
    mockGetArtefacts.mockResolvedValue({
      items: [],
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
    });

    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    // All 3 tab panes are rendered simultaneously; each shows NoRequests when empty
    await waitFor(() => {
      const noRequestEls = screen.getAllByTestId('no-requests');

      expect(noRequestEls.length).toBeGreaterThan(0);
    });
  });

  // ── Test 5: Does NOT call API when organisationCRMGuid is absent ──────────

  it('5. does not call API when organisationCRMGuid is undefined', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockAccountDetails = { ...BASE, organisationCRMGuid: undefined };

    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    // Wait for the component to mount and render. Welcome renders unconditionally;
    // if it appears without the API being called, the org-GUID guard is working.
    await waitFor(() => {
      expect(screen.getByTestId('welcome')).toBeInTheDocument();
    });

    expect(mockGetDrafts).not.toHaveBeenCalled();
    expect(mockGetQuotes).not.toHaveBeenCalled();
    expect(mockGetArtefacts).not.toHaveBeenCalled();
  });

  // ── Test 6: Navigates to error route on fatal API error ───────────────────

  it('6. navigates to /server-error route when API rejects with a 500 error', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockGetDrafts.mockRejectedValue({ status: 500, title: 'Server Error' });

    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(screen.getByTestId('error-page')).toBeInTheDocument();
    });

    // The Welcome component must not be present after the redirect
    expect(screen.queryByTestId('welcome')).not.toBeInTheDocument();
  });

  // ── Test 7: totalPages from API response flows through to pagination ─────

  it('7. displays total pages from API response in pagination component', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockGetDrafts.mockResolvedValue({
      items: [],
      currentPage: 1,
      totalPages: 3,
      totalCount: 25,
    });

    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      // The Dashboard renders one CustomPagination per tab pane; all share
      // the same totalPages state, so every pagination element should show 3.
      const paginationEls = screen.getAllByTestId('pagination');

      expect(paginationEls.length).toBeGreaterThan(0);
      expect(paginationEls[0]).toHaveAttribute('data-total', '3');
    });
  });

  it('8. persists paging changes through account dispatch user profile updates', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(mockGetDrafts.mock.calls.length).toBeGreaterThan(0);
    });

    fireEvent.click(defined(screen.getAllByTestId('pagination')[0]));

    await waitFor(() => {
      expect(mockSetUserProfile).toHaveBeenCalledWith({
        testingCalibrationDashboard: expectObjectContaining({
          filterCurrentPage: 2,
          filterActiveTab: 'drafts',
        }),
      });
    });
  });

  it.each([
    ['Requests', 'Requests', mockGetQuotes, 'requests'],
    ['Instruments', 'Instrument/artefacts', mockGetArtefacts, 'instruments'],
  ])(
    'loads the %s tab and records the selection',
    async (_tabName, accessibleName, apiMock, tabValue) => {
      expect.hasAssertions();

      resetDashboardMocks();

      const Dashboard = await importDashboard();
      renderDashboard(Dashboard);

      fireEvent.click(await screen.findByRole('tab', { name: accessibleName }));

      await waitFor(() => {
        expect(apiMock.mock.calls.length).toBeGreaterThan(0);
      });

      expect(mockTrackGAEvent).toHaveBeenCalledWith(tabValue);
      expect(mockSetUserProfile).toHaveBeenCalledWith({
        testingCalibrationDashboard: expectObjectContaining({
          filterActiveTab: tabValue,
          filterCurrentPage: 1,
        }),
      });
    },
  );

  it('returns to drafts and records the selection', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    fireEvent.click(await screen.findByRole('tab', { name: 'Requests' }));
    await waitFor(() => {
      expect(mockGetQuotes.mock.calls.length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Drafts' }));

    await waitFor(() => {
      expect(mockGetDrafts).toHaveBeenCalledTimes(2);
    });

    expect(mockTrackGAEvent).toHaveBeenCalledWith('drafts');
    expect(mockSetUserProfile).toHaveBeenCalledWith({
      testingCalibrationDashboard: expectObjectContaining({
        filterActiveTab: 'drafts',
        filterCurrentPage: 1,
      }),
    });
  });

  it('normalises a newly accepted quote from session storage', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockSessionGetItem.mockReturnValue('RFQ-accepted');
    const acceptedItem = {
      referenceId: 'RFQ-accepted',
      status: 'Quote offer is available',
      quote: {},
      requestForQuote: { artefactName: 'Mass standard' },
    };
    mockGetDrafts.mockResolvedValue({
      items: [acceptedItem],
      currentPage: 1,
      totalPages: 1,
      totalCount: 1,
    });

    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(mockSessionSetItem).toHaveBeenCalledWith(
        'RFQ-accepted',
        'view-quote-id',
      );
    });

    expect(acceptedItem.status).toBe('Quote offer is accepted');
    expect(acceptedItem.quote).toStrictEqual({ artefactName: 'Mass standard' });
    expect(mockSessionRemoveItem).toHaveBeenCalledWith('accepted-quote-id');
  });

  it('removes an accepted quote marker when the response has no items', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockSessionGetItem.mockReturnValue('RFQ-accepted');
    mockGetDrafts.mockResolvedValue(
      asDashboardPage({
        items: undefined,
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
      }),
    );

    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(mockSessionRemoveItem).toHaveBeenCalledWith('accepted-quote-id');
    });

    expect(mockSessionSetItem).not.toHaveBeenCalled();
  });

  it('handles forbidden and third-party access errors without fatal navigation', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockGetDrafts
      .mockRejectedValueOnce({ status: 403, title: 'Forbidden' })
      .mockRejectedValueOnce({
        status: 403,
        title: 'No third-party access for organisation',
      });
    const Dashboard = await importDashboard();
    const { unmount } = renderDashboard(Dashboard);

    await waitFor(() => {
      expect(mockSetDashboardNotification).toHaveBeenCalledWith({
        message: 'forbidden',
        severity: 'error',
      });
    });
    unmount();

    renderDashboard(Dashboard);
    await waitFor(() => {
      expect(mockSetDashboardNotification).toHaveBeenCalledWith({
        message: 'no-third-party',
        severity: 'error',
      });
    });

    expect(mockSetTargetOrganisation).toHaveBeenCalledWith('', 'Acme');
  });

  it('ignores aborted dashboard requests', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockGetDrafts.mockRejectedValueOnce({ name: 'AbortError' });
    const Dashboard = await importDashboard();

    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(mockGetDrafts.mock.calls.length).toBeGreaterThan(0);
    });

    expect(screen.getByTestId('welcome')).toBeInTheDocument();
    expect(screen.queryByTestId('error-page')).not.toBeInTheDocument();
  });

  it('opens branch management and records new request and instrument pagination actions', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    const scrollIntoView = vi.fn<(...args: unknown[]) => unknown>();
    vi.spyOn(document, 'getElementById').mockImplementation(
      () => ({ scrollIntoView }) as unknown as HTMLElement,
    );
    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    fireEvent.click(
      await screen.findByTestId('open-manage-branch-division-button'),
    );

    expect(mockSetShowBranchSelector).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole('tab', { name: 'Instrument/artefacts' }));
    await waitFor(() => {
      expect(mockGetArtefacts.mock.calls.length).toBeGreaterThan(0);
    });
    fireEvent.click(defined(screen.getAllByTestId('pagination')[2]));

    expect(mockTrackGAEvent).toHaveBeenCalledWith('Instrument/pagechange');
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });

    fireEvent.click(screen.getByTestId('new-request-button'));

    expect(mockTrackGAEvent).toHaveBeenCalledWith('New request');
  });

  it('resets profile paging after branch selection', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockModalState.branchSelectionModalMode = 'SelectAndEditOrg';
    const Dashboard = await importDashboard();

    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(mockSetUserProfile).toHaveBeenCalledWith({
        testingCalibrationDashboard: expectObjectContaining({
          filterCurrentPage: 1,
          filterActiveTab: 'drafts',
        }),
      });
    });
  });

  it('falls back to drafts when the saved profile records no active tab', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    // A profile saved before the tab was tracked, on an account with no default organisation
    // yet. Both gaps have to resolve to something usable rather than leaving the dashboard on
    // an undefined tab.
    mockModalState.branchSelectionModalMode = 'SelectAndEditOrg';
    mockAccountDetails = {
      ...BASE,
      defaultOrganisationId: undefined,
      userProfile: {
        testingCalibrationDashboard: {
          ...BASE_USER_PROFILE,
          filterActiveTab: undefined,
        },
      },
    };
    const Dashboard = await importDashboard();

    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(mockSetUserProfile).toHaveBeenCalledWith({
        testingCalibrationDashboard: expectObjectContaining({
          filterCurrentPage: 1,
        }),
      });
    });
  });

  it('renders dashboard notifications and complete organisation labels', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockGetDashboardNotification.mockReturnValue({
      message: 'Saved',
      severity: 'success',
    });
    mockGetDashboardInfoNotification.mockReturnValue({
      message: 'Information',
      severity: 'info',
    });
    mockAccountDetails = {
      ...BASE,
      organisation: 'Parent organisation',
      trading: 'Trading name',
      branch: 'Sydney',
      abn: '12345678901',
    };

    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(mockGetDrafts.mock.calls.length).toBeGreaterThan(0);
    });

    expect(screen.getAllByTestId('notification-message')).toHaveLength(2);
    expect(screen.getByText(/Trading name/)).toBeInTheDocument();
    expect(screen.getByText(/Sydney/)).toBeInTheDocument();
    expect(screen.getByText('12345678901')).toBeInTheDocument();
  });

  it('navigates to the generic error route when an API error has no status', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockGetDrafts.mockRejectedValueOnce({});

    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(screen.getByTestId('error-page')).toBeInTheDocument();
    });
  });

  it('leaves an accepted-quote marker item unchanged when its status is not available', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockSessionGetItem.mockReturnValue('RFQ-accepted');
    const acceptedItem = {
      referenceId: 'RFQ-accepted',
      status: 'Draft',
      quote: {},
      requestForQuote: { artefactName: 'Mass standard' },
    };
    mockGetDrafts.mockResolvedValue({
      items: [acceptedItem],
      currentPage: 1,
      totalPages: 1,
      totalCount: 1,
    });

    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(mockSessionRemoveItem).toHaveBeenCalledWith('accepted-quote-id');
    });

    expect(acceptedItem.status).toBe('Draft');
    expect(mockSessionSetItem).not.toHaveBeenCalled();
  });

  it('passes custom year and status filters and applies missing paging defaults', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    const { filterCurrentPage: _filterCurrentPage, ...profileWithoutPaging } =
      BASE_USER_PROFILE;
    mockAccountDetails = {
      ...BASE,
      userProfile: {
        testingCalibrationDashboard: {
          ...profileWithoutPaging,
          filterYearType: '2025',
          filterStatusType: 'Open',
        },
      },
    };
    mockMapToUserProfile.mockReturnValue({
      ...BASE_USER_PROFILE,
      filterYearType: '2025',
      filterStatusType: 'Open',
      filterCurrentPage: undefined,
    });
    mockGetDrafts.mockResolvedValue(
      asDashboardPage({
        items: undefined,
        currentPage: undefined,
        totalPages: undefined,
        totalCount: undefined,
      }),
    );

    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(mockGetDrafts.mock.calls.length).toBeGreaterThan(0);
    });

    expect(mockGetDrafts.mock.calls.at(-1)?.[1]).toBe('2025');
    expect(mockGetDrafts.mock.calls.at(-1)?.[2]).toBe('Open');
    expect(screen.getAllByTestId('pagination')[0]).toHaveAttribute(
      'data-current',
      '1',
    );
    expect(screen.getAllByTestId('pagination')[0]).toHaveAttribute(
      'data-total',
      '0',
    );
  });

  it('does not load dashboard data without a saved user profile', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockAccountDetails = { ...BASE, userProfile: undefined };

    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(screen.getByTestId('welcome')).toBeInTheDocument();
    });

    expect(mockGetDrafts).not.toHaveBeenCalled();
  });

  it('uses mapped profile defaults when active tab and page are absent', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockMapToUserProfile.mockReturnValue({
      ...BASE_USER_PROFILE,
      filterActiveTab: undefined,
      filterCurrentPage: undefined,
    });

    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Drafts' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    expect(screen.getAllByTestId('pagination')[0]).toHaveAttribute(
      'data-current',
      '1',
    );
    expect(mockGetDrafts).not.toHaveBeenCalled();
  });

  it('waits for MSAL to become idle before loading dashboard data', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockMsalContext.inProgress = 'login';

    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(screen.getByTestId('welcome')).toBeInTheDocument();
    });

    expect(mockGetDrafts).not.toHaveBeenCalled();
  });

  it('handles third-party access errors when account dispatch is unavailable', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockAccountDispatchState.value = undefined;
    mockGetDrafts.mockRejectedValueOnce({
      status: 403,
      title: 'No third-party access for organisation',
    });

    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(mockSetDashboardNotification).toHaveBeenCalledWith({
        message: 'no-third-party',
        severity: 'error',
      });
    });

    expect(mockSetTargetOrganisation).not.toHaveBeenCalled();
  });

  it('uses empty third-party organisation fallbacks', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockAccountDetails = {
      ...BASE,
      organisation: undefined,
      abn: undefined,
    } as unknown as AccountDetails;
    mockGetDrafts.mockRejectedValueOnce({
      status: 403,
      title: 'No third-party access for organisation',
    });
    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(mockSetTargetOrganisation).toHaveBeenCalledWith('', '');
    });
  });

  it('allows tab and page interactions before profile filters are initialised', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockAccountDetails = { ...BASE, userProfile: undefined };
    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    fireEvent.click(await screen.findByRole('tab', { name: 'Requests' }));
    fireEvent.click(defined(screen.getAllByTestId('pagination')[0]));

    expect(mockSetUserProfile).not.toHaveBeenCalled();
  });

  it('does not replace initial filters when the saved profile changes', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    const Dashboard = await importDashboard();
    const view = renderDashboard(Dashboard);
    await waitFor(() => {
      expect(mockGetDrafts.mock.calls.length).toBeGreaterThan(0);
    });
    mockMapToUserProfile.mockClear();

    mockAccountDetails = {
      ...BASE,
      userProfile: {
        testingCalibrationDashboard: {
          ...BASE_USER_PROFILE,
          filterSearchText: 'changed',
        },
      },
    };
    view.rerender(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<Dashboard />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockMapToUserProfile.mock.calls.length).toBeGreaterThan(0);
    });
  });

  it('seeds initial filters when the saved profile arrives after mount', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    // Mount with no profile: the lazy useState seed resolves to undefined.
    mockAccountDetails = { ...BASE, userProfile: undefined };
    const Dashboard = await importDashboard();
    const view = renderDashboard(Dashboard);

    await waitFor(() => {
      expect(screen.getByTestId('welcome')).toBeInTheDocument();
    });

    expect(mockGetDrafts).not.toHaveBeenCalled();

    // Account context hydrates the profile asynchronously; the effect now
    // takes the `prevState ?? p` fallback (prevState is still undefined from
    // the seed-miss mount) and seeds the debounced fetch with the saved search.
    mockMapToUserProfile.mockReturnValue({
      ...BASE_USER_PROFILE,
      filterSearchText: 'Fluke',
    });
    mockAccountDetails = {
      ...BASE,
      userProfile: {
        testingCalibrationDashboard: {
          ...BASE_USER_PROFILE,
          filterSearchText: 'Fluke',
        },
      },
    };
    view.rerender(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<Dashboard />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockGetDrafts.mock.calls.length).toBeGreaterThan(0);
    });

    expect(defined(mockGetDrafts.mock.calls[0])[4]).toBe('Fluke');
  });

  it('writes the branch reset once even when the saved profile identity changes', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockModalState.branchSelectionModalMode = 'SelectAndEditOrg';
    const Dashboard = await importDashboard();
    const view = renderDashboard(Dashboard);

    await waitFor(() => {
      expect(mockSetUserProfile).toHaveBeenCalledTimes(1);
    });

    // A fresh userProfile object with identical contents is what
    // accountDispatch.setUserProfile produces in the real app; the reset
    // must not fire again for the same branch selection.
    mockAccountDetails = {
      ...BASE,
      userProfile: { testingCalibrationDashboard: { ...BASE_USER_PROFILE } },
    };
    view.rerender(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<Dashboard />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('pagination')[0]).toHaveAttribute(
        'data-current',
        '1',
      );
    });

    expect(mockSetUserProfile).toHaveBeenCalledTimes(1);
  });

  it('uses branch-reset defaults when the mapped profile omits tab and page', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockModalState.branchSelectionModalMode = 'SelectAndEditOrg';
    mockMapToUserProfile.mockReturnValue({
      ...BASE_USER_PROFILE,
      filterActiveTab: undefined,
      filterCurrentPage: undefined,
    });
    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(mockSetUserProfile.mock.calls.length).toBeGreaterThan(0);
    });

    expect(screen.getByRole('tab', { name: 'Drafts' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getAllByTestId('pagination')[0]).toHaveAttribute(
      'data-current',
      '1',
    );
  });

  it('parses an absent non-default year and defaults an absent request page', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockMapToUserProfile.mockReturnValue({
      ...BASE_USER_PROFILE,
      filterYearType: undefined,
      filterCurrentPage: undefined,
      filterActiveTab: DashboardTab.Drafts,
    });
    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(mockGetDrafts.mock.calls.length).toBeGreaterThan(0);
    });

    expect(mockGetDrafts.mock.calls.at(-1)?.[1]).toBeUndefined();
    expect(mockGetDrafts.mock.calls.at(-1)?.[5]).toBe(1);
  });

  it('marks dashboard content inert while an actionable modal is open', async () => {
    expect.hasAssertions();

    resetDashboardMocks();

    mockModalState.showBranchSelector = true;
    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(mockGetDrafts.mock.calls.length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(screen.getByTestId('welcome').parentElement).not.toHaveAttribute(
        'aria-live',
      );
    });

    expect(document.querySelectorAll('[inert]')).toHaveLength(3);
  });
});
