import type React from 'react';

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import '@testing-library/jest-dom/vitest';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MemoryRouter, Route, Routes } from 'react-router';

import type { AccountDetails } from '../../../../ClientApp/src/authentication/accountContext';

import {
  ServiceType,
  type ServicesOffered,
} from '../../../../ClientApp/src/api/web-api-client';

import { defined } from '../../helpers/defined';

const {
  mockAcquireTokenSilent,
  mockAccountContextState,
  mockAccountDispatchState,
  mockAppLoggerError,
  mockAppLoggerInfo,
  mockClearDashboardInfoNotification,
  mockClearDashboardNotification,
  mockGetApplications,
  mockGetDashboardInfoNotification,
  mockGetDashboardNotification,
  mockGetDrafts,
  mockScrollIntoView,
  mockServicesState,
  mockSessionGetItem,
  mockSessionRemoveItem,
  mockSetAuthToken,
  mockSetDashboardInfoNotification,
  mockSetDashboardNotification,
  mockSetTargetOrganisation,
  mockSetUserProfile,
  mockTrackGAEvent,
  mockMsalContext,
} = vi.hoisted(() => ({
  mockAcquireTokenSilent: vi
    .fn()
    .mockResolvedValue({ accessToken: 'mock-token' }),
  mockAccountContextState: { value: null as Record<string, unknown> | null },
  mockAccountDispatchState: { value: null as Record<string, unknown> | null },
  mockAppLoggerError: vi.fn(),
  mockAppLoggerInfo: vi.fn(),
  mockClearDashboardInfoNotification: vi.fn(),
  mockClearDashboardNotification: vi.fn(),
  mockGetApplications: vi.fn(),
  mockGetDashboardInfoNotification: vi.fn(),
  mockGetDashboardNotification: vi.fn(),
  mockGetDrafts: vi.fn(),
  mockScrollIntoView: vi.fn(),
  mockServicesState: { value: [] as ServicesOffered[] },
  mockSessionGetItem: vi.fn(),
  mockSessionRemoveItem: vi.fn(),
  mockSetAuthToken: vi.fn(),
  mockSetDashboardInfoNotification: vi.fn(),
  mockSetDashboardNotification: vi.fn(),
  mockSetTargetOrganisation: vi.fn(),
  mockSetUserProfile: vi.fn(),
  mockTrackGAEvent: vi.fn(),
  mockMsalContext: {
    instance: { acquireTokenSilent: vi.fn() },
    accounts: [{ homeAccountId: 'account-id' }],
    inProgress: 'none',
  },
}));

let mockAccountDetails: AccountDetails | null;

vi.mock(
  import('../../../../ClientApp/src/api/web-api-client'),
  () =>
    ({
      PatternApprovalClient: vi.fn().mockImplementation(function (
        this: Record<string, unknown>,
      ) {
        this['setAuthToken'] = mockSetAuthToken;
        this['getPatternApprovalApplicationDrafts'] = mockGetDrafts;
        this['getPatternApprovalApplications'] = mockGetApplications;
      }),
      ServiceType: {
        TestingCalibration: 'TestingCalibration',
        PatternApproval: 'PatternApproval',
      },
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
  import('../../../../ClientApp/src/authentication/hooks'),
  () =>
    ({
      default: () => mockAccountContextState.value,
      useAccountDispatch: () => mockAccountDispatchState.value,
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

vi.mock(
  import('../../../../ClientApp/src/hooks/useUserServices'),
  () =>
    ({
      default: () => mockServicesState.value,
    }) satisfies __ExactMockModule<__TestMockModule92>,
);

vi.mock(
  import('../../../../ClientApp/src/authentication/authConfig'),
  () =>
    ({
      tokenRequest: { scopes: ['openid'] },
    }) satisfies __ExactMockModule<__TestMockModule8>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Welcome'),
  () =>
    ({
      default: () => <div data-testid='welcome' />,
    }) satisfies __ExactMockModule<__TestMockModule93>,
);

vi.mock(
  import('../../../../ClientApp/src/components/BlockUISpinner'),
  () =>
    ({
      default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid='block-spinner'>{children}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule14>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Alert/NotificationMessage'),
  () =>
    ({
      default: ({
        id,
        message,
        onClose,
      }: {
        id: string;
        message: string;
        onClose: () => void;
      }) => (
        <button data-testid={id} type='button' onClick={onClose}>
          {message}
        </button>
      ),
    }) satisfies __ExactMockModule<__TestMockModule48>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Utilities/useHtmlTitle'),
  () =>
    ({
      default: () => {},
    }) satisfies __ExactMockModule<__TestMockModule89>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Utilities/useBodyClass'),
  () =>
    ({
      default: () => {},
    }) satisfies __ExactMockModule<__TestMockModule59>,
);

vi.mock(
  import('../../../../ClientApp/src/components/tiles/StandardPathway'),
  () =>
    ({
      default: ({ title }: { title: string }) => (
        <div data-testid='standard-pathway'>{title}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule94>,
);

vi.mock(
  import('../../../../ClientApp/src/components/RequestList/noRequests'),
  () =>
    ({
      default: () => <div data-testid='no-requests' />,
    }) satisfies __ExactMockModule<__TestMockModule95>,
);

vi.mock(
  import('../../../../ClientApp/src/components/RequestList/paRequestItem'),
  () =>
    ({
      default: ({ request, setDeleteSuccess, tab }: any) => (
        <div data-testid='request-item' data-tab={tab}>
          {request.referenceId}
          <button type='button' onClick={() => setDeleteSuccess(true)}>
            Delete
          </button>
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule96>,
);

vi.mock(
  import('../../../../ClientApp/src/components/SearchFilter/TypeApproval/paSearchFilter'),
  () =>
    ({
      default: ({ initialFilters, setCurrentPage, setInitialFilters }: any) => (
        <div
          data-testid='pa-search-filter'
          data-tab={initialFilters.filterActiveTab}
        >
          <button
            type='button'
            onClick={() => {
              setCurrentPage(1);
              setInitialFilters({
                ...initialFilters,
                filterCurrentPage: 1,
                filterYearType: '2024',
                filterStatusType: 'Submitted',
                filterSearchText: 'meter',
              });
            }}
          >
            Apply filters
          </button>
          <button type='button' onClick={() => setInitialFilters(undefined)}>
            Clear filters
          </button>
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule97>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Pagination'),
  () =>
    ({
      default: ({ currentPage, onPageChange, totalPages }: any) => (
        <button
          data-testid='pagination'
          data-current={currentPage}
          data-total={totalPages}
          type='button'
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
      ),
    }) satisfies __ExactMockModule<__TestMockModule98>,
);

vi.mock(
  import('../../../../ClientApp/src/components/PaginationHeader'),
  () =>
    ({
      default: ({ currentPage, pageSize, totalCount }: any) => (
        <div
          data-testid='pagination-header'
          data-current={currentPage}
          data-size={pageSize}
          data-total={totalCount}
        />
      ),
    }) satisfies __ExactMockModule<__TestMockModule99>,
);

vi.mock(
  import('../../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: {
        error: mockAppLoggerError,
        info: mockAppLoggerInfo,
        verbose: vi.fn(),
      },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/common/errorRoutes'),
  () =>
    ({
      default: (status: number) => `/server-error/${status}`,
    }) satisfies __ExactMockModule<__TestMockModule100>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/common/dashboardNotifications'),
  () =>
    ({
      DashBoardNotifications: {
        getForbiddenNotification: () => ({
          message: 'forbidden',
          severity: 'error',
        }),
        getThirdPartyAccessNotification: (organisation: string) => ({
          message: `no-third-party:${organisation}`,
          severity: 'error',
        }),
        getReportFormsGeneratedNotification: () => ({
          message: 'reports-ready',
          severity: 'info',
        }),
      },
    }) satisfies __ExactMockModule<__TestMockModule101>,
);

vi.mock(
  import('../../../../ClientApp/src/storage/notification'),
  () =>
    ({
      getDashboardNotification: mockGetDashboardNotification,
      clearDashboardNotification: mockClearDashboardNotification,
      setDashboardNotification: mockSetDashboardNotification,
      getDashboardInfoNotification: mockGetDashboardInfoNotification,
      setDashboardInfoNotification: mockSetDashboardInfoNotification,
      clearDashboardInfoNotification: mockClearDashboardInfoNotification,
    }) satisfies __ExactMockModule<__TestMockModule46>,
);

vi.mock(
  import('../../../../ClientApp/src/storage/sessionStorageCache'),
  () =>
    ({
      default: () => ({
        getItem: mockSessionGetItem,
        removeItem: mockSessionRemoveItem,
      }),
    }) satisfies __ExactMockModule<__TestMockModule72>,
);

vi.mock(
  import('../../../../ClientApp/src/analytics/GoogleAnalytics'),
  () =>
    ({
      trackGAEvent: mockTrackGAEvent,
    }) satisfies __ExactMockModule<__TestMockModule22>,
);

vi.mock(
  import('react-number-format'),
  () =>
    ({
      PatternFormat: ({ value }: { value: string }) => <span>{value}</span>,
    }) satisfies __ExactMockModule<__TestMockModule102>,
);

const ACTIVE_PATTERN_APPROVAL: ServicesOffered[] = [
  {
    service: ServiceType.PatternApproval,
    isActive: true,
  },
];

const BASE_FILTERS = {
  filterYearType: 'allYears',
  filterStatusType: 'allStatuses',
  filtersChanged: false,
  filterSortOrder: 'descending',
  filterCurrentPage: 1,
  filterActiveTab: 'drafts',
  filterSearchText: '',
};

const EMPTY_RESPONSE = {
  currentPage: 1,
  items: [],
  pageSize: 10,
  totalCount: 0,
  totalPages: 1,
};

const BASE_ACCOUNT: AccountDetails = {
  organisation: 'Acme Metrology',
  trading: 'Acme Trading',
  branch: 'Sydney',
  homeAccountId: 'account-id',
  abn: '12345678901',
  targetOrganisation: {
    targetOrganisationAbn: '98765432109',
    targetOrganisationName: 'Target Labs',
  },
  userAcceptedTermsOfUse: true,
  accountCreationCompleted: true,
  accountContactCompleted: true,
  currentTermsVersion: '1',
  defaultOrganisationId: 7,
  organisationCRMGuid: 'crm-guid-001',
  organisationIsCompleted: true,
  isDefaultOrganisation: true,
  showBranchSelector: false,
  userProfile: {
    services: ACTIVE_PATTERN_APPROVAL,
    patternApprovalDashboard: BASE_FILTERS,
  },
};

async function importDashboard() {
  return (
    await import('../../../../ClientApp/src/routes/dashboard/dashboard-ta')
  ).default;
}

function renderDashboard(Dashboard: React.ComponentType) {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path='/' element={<Dashboard />} />
        <Route
          path='/services-we-offer'
          element={<div data-testid='services-page' />}
        />
        <Route
          path='/server-error/:status'
          element={<div data-testid='error-page' />}
        />
        <Route path='*' element={<div data-testid='linked-page' />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('pattern/type approval dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAcquireTokenSilent.mockResolvedValue({ accessToken: 'mock-token' });
    mockMsalContext.instance.acquireTokenSilent = mockAcquireTokenSilent;
    mockMsalContext.accounts = [{ homeAccountId: 'account-id' }];
    mockMsalContext.inProgress = 'none';
    mockGetDrafts.mockResolvedValue({ ...EMPTY_RESPONSE });
    mockGetApplications.mockResolvedValue({ ...EMPTY_RESPONSE });
    mockGetDashboardNotification.mockReturnValue(null);
    mockGetDashboardInfoNotification.mockReturnValue(null);
    mockSessionGetItem.mockReturnValue(null);
    mockSetUserProfile.mockResolvedValue(true);
    mockAccountDetails = { ...BASE_ACCOUNT };
    mockAccountDispatchState.value = {
      setUserProfile: mockSetUserProfile,
      setTargetOrganisation: mockSetTargetOrganisation,
    };
    mockAccountContextState.value = {
      details: mockAccountDetails,
      ...mockAccountDispatchState.value,
    };
    mockServicesState.value = ACTIVE_PATTERN_APPROVAL;
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: mockScrollIntoView,
    });
  });
  it('loads organisation-scoped drafts with an auth token and renders the response', async () => {
    expect.assertions(1);
    mockGetDrafts.mockResolvedValue({
      currentPage: 2,
      items: [{ referenceId: 'TA-1001' }],
      pageSize: 10,
      totalCount: 24,
      totalPages: 3,
    });
    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);
    expect((await screen.findAllByText('TA-1001')).length).toBeGreaterThan(0);
  });
});

describe('pattern/type approval dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAcquireTokenSilent.mockResolvedValue({ accessToken: 'mock-token' });
    mockMsalContext.instance.acquireTokenSilent = mockAcquireTokenSilent;
    mockMsalContext.accounts = [{ homeAccountId: 'account-id' }];
    mockMsalContext.inProgress = 'none';
    mockGetDrafts.mockResolvedValue({ ...EMPTY_RESPONSE });
    mockGetApplications.mockResolvedValue({ ...EMPTY_RESPONSE });
    mockGetDashboardNotification.mockReturnValue(null);
    mockGetDashboardInfoNotification.mockReturnValue(null);
    mockSessionGetItem.mockReturnValue(null);
    mockSetUserProfile.mockResolvedValue(true);
    mockAccountDetails = { ...BASE_ACCOUNT };
    mockAccountDispatchState.value = {
      setUserProfile: mockSetUserProfile,
      setTargetOrganisation: mockSetTargetOrganisation,
    };
    mockAccountContextState.value = {
      details: mockAccountDetails,
      ...mockAccountDispatchState.value,
    };
    mockServicesState.value = ACTIVE_PATTERN_APPROVAL;
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: mockScrollIntoView,
    });
  });
  it('loads organisation-scoped drafts with an auth token and renders the response', async () => {
    expect.assertions(1);
    mockGetDrafts.mockResolvedValue({
      currentPage: 2,
      items: [{ referenceId: 'TA-1001' }],
      pageSize: 10,
      totalCount: 24,
      totalPages: 3,
    });
    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);
    expect(mockSetAuthToken).toHaveBeenCalledWith('mock-token');
  });
});

describe('pattern/type approval dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAcquireTokenSilent.mockResolvedValue({ accessToken: 'mock-token' });
    mockMsalContext.instance.acquireTokenSilent = mockAcquireTokenSilent;
    mockMsalContext.accounts = [{ homeAccountId: 'account-id' }];
    mockMsalContext.inProgress = 'none';
    mockGetDrafts.mockResolvedValue({ ...EMPTY_RESPONSE });
    mockGetApplications.mockResolvedValue({ ...EMPTY_RESPONSE });
    mockGetDashboardNotification.mockReturnValue(null);
    mockGetDashboardInfoNotification.mockReturnValue(null);
    mockSessionGetItem.mockReturnValue(null);
    mockSetUserProfile.mockResolvedValue(true);
    mockAccountDetails = { ...BASE_ACCOUNT };
    mockAccountDispatchState.value = {
      setUserProfile: mockSetUserProfile,
      setTargetOrganisation: mockSetTargetOrganisation,
    };
    mockAccountContextState.value = {
      details: mockAccountDetails,
      ...mockAccountDispatchState.value,
    };
    mockServicesState.value = ACTIVE_PATTERN_APPROVAL;
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: mockScrollIntoView,
    });
  });
  it('loads organisation-scoped drafts with an auth token and renders the response', async () => {
    expect.assertions(1);
    mockGetDrafts.mockResolvedValue({
      currentPage: 2,
      items: [{ referenceId: 'TA-1001' }],
      pageSize: 10,
      totalCount: 24,
      totalPages: 3,
    });
    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);
    expect(mockSetAuthToken.mock.invocationCallOrder[0]).toBeLessThan(
      defined(mockGetDrafts.mock.invocationCallOrder[0]),
    );
  });
});

describe('pattern/type approval dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAcquireTokenSilent.mockResolvedValue({ accessToken: 'mock-token' });
    mockMsalContext.instance.acquireTokenSilent = mockAcquireTokenSilent;
    mockMsalContext.accounts = [{ homeAccountId: 'account-id' }];
    mockMsalContext.inProgress = 'none';
    mockGetDrafts.mockResolvedValue({ ...EMPTY_RESPONSE });
    mockGetApplications.mockResolvedValue({ ...EMPTY_RESPONSE });
    mockGetDashboardNotification.mockReturnValue(null);
    mockGetDashboardInfoNotification.mockReturnValue(null);
    mockSessionGetItem.mockReturnValue(null);
    mockSetUserProfile.mockResolvedValue(true);
    mockAccountDetails = { ...BASE_ACCOUNT };
    mockAccountDispatchState.value = {
      setUserProfile: mockSetUserProfile,
      setTargetOrganisation: mockSetTargetOrganisation,
    };
    mockAccountContextState.value = {
      details: mockAccountDetails,
      ...mockAccountDispatchState.value,
    };
    mockServicesState.value = ACTIVE_PATTERN_APPROVAL;
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: mockScrollIntoView,
    });
  });
  it('loads organisation-scoped drafts with an auth token and renders the response', async () => {
    expect.assertions(1);
    mockGetDrafts.mockResolvedValue({
      currentPage: 2,
      items: [{ referenceId: 'TA-1001' }],
      pageSize: 10,
      totalCount: 24,
      totalPages: 3,
    });
    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);
    expect(mockGetDrafts).toHaveBeenCalledWith(
      'crm-guid-001',
      undefined,
      undefined,
      'descending',
      '',
      1,
      10,
      undefined,
    );
  });
});

describe('pattern/type approval dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAcquireTokenSilent.mockResolvedValue({ accessToken: 'mock-token' });
    mockMsalContext.instance.acquireTokenSilent = mockAcquireTokenSilent;
    mockMsalContext.accounts = [{ homeAccountId: 'account-id' }];
    mockMsalContext.inProgress = 'none';
    mockGetDrafts.mockResolvedValue({ ...EMPTY_RESPONSE });
    mockGetApplications.mockResolvedValue({ ...EMPTY_RESPONSE });
    mockGetDashboardNotification.mockReturnValue(null);
    mockGetDashboardInfoNotification.mockReturnValue(null);
    mockSessionGetItem.mockReturnValue(null);
    mockSetUserProfile.mockResolvedValue(true);
    mockAccountDetails = { ...BASE_ACCOUNT };
    mockAccountDispatchState.value = {
      setUserProfile: mockSetUserProfile,
      setTargetOrganisation: mockSetTargetOrganisation,
    };
    mockAccountContextState.value = {
      details: mockAccountDetails,
      ...mockAccountDispatchState.value,
    };
    mockServicesState.value = ACTIVE_PATTERN_APPROVAL;
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: mockScrollIntoView,
    });
  });
  it('loads organisation-scoped drafts with an auth token and renders the response', async () => {
    expect.assertions(1);
    mockGetDrafts.mockResolvedValue({
      currentPage: 2,
      items: [{ referenceId: 'TA-1001' }],
      pageSize: 10,
      totalCount: 24,
      totalPages: 3,
    });
    const Dashboard = await importDashboard();
    renderDashboard(Dashboard);
    expect(screen.getAllByTestId('pagination')[0]).toHaveAttribute(
      'data-current',
      '2',
    );
  });
});
