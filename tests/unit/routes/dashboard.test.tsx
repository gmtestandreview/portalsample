import type React from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import '@testing-library/jest-dom/vitest';

import { vi, describe, it, expect, beforeEach } from 'vitest';

import { MemoryRouter, Route, Routes } from 'react-router';

import type { AccountDetails } from '../../../ClientApp/src/authentication/accountContext';

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
  mockSetAuthToken: vi.fn(),
  mockGetDrafts: vi.fn(),
  mockGetQuotes: vi.fn(),
  mockGetArtefacts: vi.fn(),
  mockAcquireTokenSilent: vi
    .fn()
    .mockResolvedValue({ accessToken: 'mock-token' }),
  mockSetUserProfile: vi.fn(),
  mockSetShowBranchSelector: vi.fn(),
  mockTrackGAEvent: vi.fn(),
  mockSessionGetItem: vi.fn<() => string | null>(() => null),
  mockSessionSetItem: vi.fn(),
  mockSessionRemoveItem: vi.fn(),
  mockSetTargetOrganisation: vi.fn(),
  mockSetDashboardNotification: vi.fn(),
  mockMapToUserProfile: vi.fn((p: any) => ({
    filterYearType: p?.filterYearType ?? 'allYears',
    filterStatusType: p?.filterStatusType ?? 'allStatuses',
    filterCurrentPage: p?.filterCurrentPage ?? 1,
    filterActiveTab: p?.filterActiveTab ?? 'drafts',
    filterSearchText: p?.filterSearchText ?? '',
    filterSortOrder: p?.filterSortOrder ?? 'descending',
    filtersChanged: p?.filtersChanged ?? false,
  })),
  mockAccountDispatchState: {
    value: {
      setAgree: vi.fn(),
      setCompleted: vi.fn(),
      setContactCompleted: vi.fn(),
      setDefaultOrganisationId: vi.fn(),
      setTargetOrganisation: vi.fn(),
      setOrganisationAndBranch: vi.fn(),
      setUserProfile: vi.fn(),
    } as Record<string, ReturnType<typeof vi.fn>> | undefined,
  },
  mockGetDashboardNotification: vi.fn<
    () => { message: string; severity: string } | null
  >(() => null),
  mockGetDashboardInfoNotification: vi.fn<
    () => { message: string; severity: string } | null
  >(() => null),
  mockClearDashboardNotification: vi.fn(),
  mockClearDashboardInfoNotification: vi.fn(),
  mockModalState: {
    showBranchSelector: false,
    showRFQDeleteModal: false,
    branchSelectionModalMode: undefined as string | undefined,
  },
  mockMsalContext: {
    instance: {
      acquireTokenSilent: vi
        .fn()
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
  import('../../../ClientApp/src/api/web-api-client'),
  () =>
    ({
      DashboardClient: vi.fn().mockImplementation(function (this: any) {
        this.setAuthToken = mockSetAuthToken;
        this.getDashboardDraftsByPortalID = mockGetDrafts;
        this.getDashboardQuotesByPortalID = mockGetQuotes;
        this.getDashboardArtefactsByPortalID = mockGetArtefacts;
      }),
      StatusEnumDto: {},
    }) satisfies __ExactMockModule<__TestMockModule4>,
);

vi.mock(
  import('@azure/msal-react'),
  () =>
    ({
      useMsal: () => mockMsalContext,
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(
  import('@azure/msal-browser'),
  () =>
    ({
      InteractionStatus: { None: 'none' },
    }) satisfies __ExactMockModule<__TestMockModule3>,
);

vi.mock(
  import('../../../ClientApp/src/authentication/hooks'),
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
  import('../../../ClientApp/src/components/modals/ModalContext'),
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
      default: () => {},
    }) satisfies __ExactMockModule<__TestMockModule89>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/useBodyClass'),
  () =>
    ({
      default: () => {},
    }) satisfies __ExactMockModule<__TestMockModule59>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/useDebounce'),
  () =>
    ({
      default: (value: any) => value,
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
      default: ({ onPageChange, currentPage, totalPages }: any) => (
        <button
          data-testid='pagination'
          data-current={currentPage}
          data-total={totalPages}
          onClick={() => onPageChange?.((currentPage ?? 1) + 1)}
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
  import('../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: {
        info: vi.fn(),
        verbose: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        critical: vi.fn(),
        trace: vi.fn(),
      },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

vi.mock(
  import('../../../ClientApp/src/routes/common/errorRoutes'),
  () =>
    ({
      default: (_status: number) => '/server-error',
    }) satisfies __ExactMockModule<__TestMockModule100>,
);

vi.mock(
  import('../../../ClientApp/src/routes/common/dashboardNotifications'),
  () =>
    ({
      DashBoardNotifications: {
        getForbiddenNotification: vi.fn(() => ({
          message: 'forbidden',
          severity: 'error',
        })),
        getThirdPartyAccessNotification: vi.fn(() => ({
          message: 'no-third-party',
          severity: 'error',
        })),
        getReportFormsGeneratedNotification: vi.fn(() => ({
          message: 'report-forms',
          severity: 'info',
        })),
        getDashboardErrorNotification: vi.fn(() => ({
          message: 'error',
          severity: 'error',
        })),
      },
    }) satisfies __ExactMockModule<__TestMockModule101>,
);

vi.mock(
  import('../../../ClientApp/src/storage/notification'),
  () =>
    ({
      getDashboardNotification: mockGetDashboardNotification,
      clearDashboardNotification: mockClearDashboardNotification,
      setDashboardNotification: mockSetDashboardNotification,
      getDashboardInfoNotification: mockGetDashboardInfoNotification,
      setDashboardInfoNotification: vi.fn(),
      clearDashboardInfoNotification: mockClearDashboardInfoNotification,
    }) satisfies __ExactMockModule<__TestMockModule46>,
);

vi.mock(
  import('../../../ClientApp/src/storage/sessionStorageCache'),
  () =>
    ({
      default: () => ({
        getItem: mockSessionGetItem,
        setItem: mockSessionSetItem,
        removeItem: mockSessionRemoveItem,
        clear: vi.fn(),
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
  import('../../../ClientApp/src/routes/common/enums'),
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
  import('../../../ClientApp/src/components/modals/BranchSelectorModal/enums'),
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

// userProfile must be set so the Dashboard component populates initialFilters,
// which gates the stableFilters.filterActiveTab guard in the fetch useEffect.
const BASE_USER_PROFILE = {
  filterYearType: 'allYears',
  filterStatusType: 'allStatuses',
  filterCurrentPage: 1,
  filterActiveTab: 'drafts' as any,
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

describe('dashboard', () => {
  beforeEach(() => {
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
      setAgree: vi.fn(),
      setCompleted: vi.fn(),
      setContactCompleted: vi.fn(),
      setDefaultOrganisationId: vi.fn(),
      setTargetOrganisation: mockSetTargetOrganisation,
      setOrganisationAndBranch: vi.fn(),
      setUserProfile: mockSetUserProfile,
    };
    mockMapToUserProfile.mockImplementation((p: any) => ({
      filterYearType: p?.filterYearType ?? 'allYears',
      filterStatusType: p?.filterStatusType ?? 'allStatuses',
      filterCurrentPage: p?.filterCurrentPage ?? 1,
      filterActiveTab: p?.filterActiveTab ?? 'drafts',
      filterSearchText: p?.filterSearchText ?? '',
      filterSortOrder: p?.filterSortOrder ?? 'descending',
      filtersChanged: p?.filtersChanged ?? false,
    }));
    mockAccountDetails = { ...BASE };
  });
  it('1. renders without crashing and shows Welcome component', async () => {
    expect.assertions(1);
    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(screen.getByTestId('welcome')).toBeInTheDocument();
    });
  });
});

describe('dashboard', () => {
  beforeEach(() => {
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
      setAgree: vi.fn(),
      setCompleted: vi.fn(),
      setContactCompleted: vi.fn(),
      setDefaultOrganisationId: vi.fn(),
      setTargetOrganisation: mockSetTargetOrganisation,
      setOrganisationAndBranch: vi.fn(),
      setUserProfile: mockSetUserProfile,
    };
    mockMapToUserProfile.mockImplementation((p: any) => ({
      filterYearType: p?.filterYearType ?? 'allYears',
      filterStatusType: p?.filterStatusType ?? 'allStatuses',
      filterCurrentPage: p?.filterCurrentPage ?? 1,
      filterActiveTab: p?.filterActiveTab ?? 'drafts',
      filterSearchText: p?.filterSearchText ?? '',
      filterSortOrder: p?.filterSortOrder ?? 'descending',
      filtersChanged: p?.filtersChanged ?? false,
    }));
    mockAccountDetails = { ...BASE };
  });
  it('2. (SEC-010) passes organisationCRMGuid as first argument to getDashboardDraftsByPortalID', async () => {
    expect.assertions(2);
    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => {
      expect(mockGetDrafts).toHaveBeenCalledWith();
    });

    // SEC-010: every call — not just the first — must use the correct org GUID
    for (const call of mockGetDrafts.mock.calls) {
      expect(call[0]).toBe('crm-guid-001');
    }
  });
});

describe('dashboard', () => {
  beforeEach(() => {
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
      setAgree: vi.fn(),
      setCompleted: vi.fn(),
      setContactCompleted: vi.fn(),
      setDefaultOrganisationId: vi.fn(),
      setTargetOrganisation: mockSetTargetOrganisation,
      setOrganisationAndBranch: vi.fn(),
      setUserProfile: mockSetUserProfile,
    };
    mockMapToUserProfile.mockImplementation((p: any) => ({
      filterYearType: p?.filterYearType ?? 'allYears',
      filterStatusType: p?.filterStatusType ?? 'allStatuses',
      filterCurrentPage: p?.filterCurrentPage ?? 1,
      filterActiveTab: p?.filterActiveTab ?? 'drafts',
      filterSearchText: p?.filterSearchText ?? '',
      filterSortOrder: p?.filterSortOrder ?? 'descending',
      filtersChanged: p?.filtersChanged ?? false,
    }));
    mockAccountDetails = { ...BASE };
  });
  it('uses the saved search in the first dashboard request', async () => {
    expect.assertions(2);
    mockMapToUserProfile.mockReturnValue({
      ...BASE_USER_PROFILE,
      filterSearchText: 'Fluke',
    });
    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);

    await waitFor(() => expect(mockGetDrafts).toHaveBeenCalledWith());

    expect(defined(mockGetDrafts.mock.calls[0])[4]).toBe('Fluke');
  });
});
