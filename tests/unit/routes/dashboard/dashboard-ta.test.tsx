import type React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { AccountDetails } from '../../../../ClientApp/src/authentication/accountContext';
import { ServiceType, type ServicesOffered } from '../../../../ClientApp/src/api/web-api-client';

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
    mockAcquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'mock-token' }),
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

vi.mock('../../../../ClientApp/src/api/web-api-client', () => ({
    PatternApprovalClient: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
        this.setAuthToken = mockSetAuthToken;
        this.getPatternApprovalApplicationDrafts = mockGetDrafts;
        this.getPatternApprovalApplications = mockGetApplications;
    }),
    ServiceType: {
        TestingCalibration: 'TestingCalibration',
        PatternApproval: 'PatternApproval',
    },
}));

vi.mock('@azure/msal-react', () => ({
    useMsal: () => mockMsalContext,
}));

vi.mock('@azure/msal-browser', () => ({
    InteractionStatus: { None: 'none' },
}));

vi.mock('../../../../ClientApp/src/authentication/hooks', () => ({
    default: () => mockAccountContextState.value,
    useAccountDispatch: () => mockAccountDispatchState.value,
}));

vi.mock('../../../../ClientApp/src/hooks/useUserServices', () => ({
    default: () => mockServicesState.value,
}));

vi.mock('../../../../ClientApp/src/authentication/authConfig', () => ({
    tokenRequest: { scopes: ['openid'] },
}));

vi.mock('../../../../ClientApp/src/components/Welcome', () => ({
    default: () => <div data-testid='welcome' />,
}));

vi.mock('../../../../ClientApp/src/components/BlockUISpinner', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid='block-spinner'>{children}</div>,
}));

vi.mock('../../../../ClientApp/src/components/Alert/NotificationMessage', () => ({
    default: ({ id, message, onClose }: { id: string; message: string; onClose: () => void }) => (
        <button data-testid={id} type='button' onClick={onClose}>
            {message}
        </button>
    ),
}));

vi.mock('../../../../ClientApp/src/components/Utilities/useHtmlTitle', () => ({ default: () => {} }));
vi.mock('../../../../ClientApp/src/components/Utilities/useBodyClass', () => ({ default: () => {} }));
vi.mock('../../../../ClientApp/src/components/tiles/StandardPathway', () => ({
    default: ({ title }: { title: string }) => <div data-testid='standard-pathway'>{title}</div>,
}));

vi.mock('../../../../ClientApp/src/components/RequestList/noRequests', () => ({
    default: () => <div data-testid='no-requests' />,
}));

vi.mock('../../../../ClientApp/src/components/RequestList/paRequestItem', () => ({
    default: ({ request, setDeleteSuccess, tab }: any) => (
        <div data-testid='request-item' data-tab={tab}>
            {request.referenceId}
            <button type='button' onClick={() => setDeleteSuccess(true)}>
                Delete
            </button>
        </div>
    ),
}));

vi.mock('../../../../ClientApp/src/components/SearchFilter/TypeApproval/paSearchFilter', () => ({
    default: ({ initialFilters, setCurrentPage, setInitialFilters }: any) => (
        <div data-testid='pa-search-filter' data-tab={initialFilters.filterActiveTab}>
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
}));

vi.mock('../../../../ClientApp/src/components/Pagination', () => ({
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
}));

vi.mock('../../../../ClientApp/src/components/PaginationHeader', () => ({
    default: ({ currentPage, pageSize, totalCount }: any) => (
        <div data-testid='pagination-header' data-current={currentPage} data-size={pageSize} data-total={totalCount} />
    ),
}));

vi.mock('../../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: {
        error: mockAppLoggerError,
        info: mockAppLoggerInfo,
        verbose: vi.fn(),
    },
}));

vi.mock('../../../../ClientApp/src/routes/common/errorRoutes', () => ({
    default: (status: number) => `/server-error/${status}`,
}));

vi.mock('../../../../ClientApp/src/routes/common/dashboardNotifications', () => ({
    DashBoardNotifications: {
        getForbiddenNotification: () => ({ message: 'forbidden', severity: 'error' }),
        getThirdPartyAccessNotification: (organisation: string) => ({ message: `no-third-party:${organisation}`, severity: 'error' }),
        getReportFormsGeneratedNotification: () => ({ message: 'reports-ready', severity: 'info' }),
    },
}));

vi.mock('../../../../ClientApp/src/storage/notification', () => ({
    getDashboardNotification: mockGetDashboardNotification,
    clearDashboardNotification: mockClearDashboardNotification,
    setDashboardNotification: mockSetDashboardNotification,
    getDashboardInfoNotification: mockGetDashboardInfoNotification,
    setDashboardInfoNotification: mockSetDashboardInfoNotification,
    clearDashboardInfoNotification: mockClearDashboardInfoNotification,
}));

vi.mock('../../../../ClientApp/src/storage/sessionStorageCache', () => ({
    default: () => ({
        getItem: mockSessionGetItem,
        removeItem: mockSessionRemoveItem,
    }),
}));

vi.mock('../../../../ClientApp/src/analytics/GoogleAnalytics', () => ({
    trackGAEvent: mockTrackGAEvent,
}));

vi.mock('react-number-format', () => ({
    PatternFormat: ({ value }: { value: string }) => <span>{value}</span>,
}));

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
    return (await import('../../../../ClientApp/src/routes/dashboard/dashboard-ta')).default;
}

function renderDashboard(Dashboard: React.ComponentType) {
    return render(
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route path='/' element={<Dashboard />} />
                <Route path='/services-we-offer' element={<div data-testid='services-page' />} />
                <Route path='/server-error/:status' element={<div data-testid='error-page' />} />
                <Route path='*' element={<div data-testid='linked-page' />} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('Pattern/type approval dashboard', () => {
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
        expect(mockSetAuthToken).toHaveBeenCalledWith('mock-token');
        expect(mockSetAuthToken.mock.invocationCallOrder[0]).toBeLessThan(mockGetDrafts.mock.invocationCallOrder[0]);
        expect(mockGetDrafts).toHaveBeenCalledWith('crm-guid-001', undefined, undefined, 'descending', '', 1, 10, undefined);
        expect(screen.getAllByTestId('pagination')[0]).toHaveAttribute('data-current', '2');
        expect(screen.getAllByTestId('pagination')[0]).toHaveAttribute('data-total', '3');
        expect(screen.getAllByTestId('pagination-header')[0]).toHaveAttribute('data-total', '24');
    });

    it('applies non-default year, status, and search filters to the request', async () => {
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);
        await waitFor(() => expect(mockGetDrafts).toHaveBeenCalled());

        fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

        await waitFor(() =>
            expect(mockGetDrafts).toHaveBeenLastCalledWith('crm-guid-001', '2024', 'Submitted', 'descending', 'meter', 1, 10, undefined),
        );
    });

    it('loads applications, persists the selected tab after the debounce, and records analytics', async () => {
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);
        await waitFor(() => expect(mockGetDrafts).toHaveBeenCalled());

        fireEvent.click(screen.getByRole('tab', { name: 'Applications' }));

        await waitFor(() => expect(mockGetApplications).toHaveBeenCalled());
        await waitFor(
            () =>
                expect(mockSetUserProfile).toHaveBeenCalledWith({
                    patternApprovalDashboard: expect.objectContaining({
                        filterActiveTab: 'requests',
                        filterCurrentPage: 1,
                    }),
                }),
            { timeout: 1_000 },
        );
        expect(mockTrackGAEvent).toHaveBeenCalledWith('requests');
    });

    it('returns to Drafts and records the selection', async () => {
        mockSessionGetItem.mockReturnValue('requests');
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);
        await waitFor(() => expect(mockGetApplications).toHaveBeenCalled());

        fireEvent.click(screen.getByRole('tab', { name: 'Drafts' }));

        await waitFor(() => expect(mockGetDrafts).toHaveBeenCalled());
        expect(screen.getByRole('tab', { name: 'Drafts' })).toHaveAttribute('aria-selected', 'true');
        expect(mockTrackGAEvent).toHaveBeenCalledWith('drafts');
    });

    it('restores a saved tab from session storage and removes the one-shot override', async () => {
        mockSessionGetItem.mockReturnValue('requests');
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await waitFor(() => expect(mockGetApplications).toHaveBeenCalled());
        expect(screen.getByRole('tab', { name: 'Applications' })).toHaveAttribute('aria-selected', 'true');
        expect(mockSessionRemoveItem).toHaveBeenCalledWith('set-tabop-after-save');
    });

    it('persists page changes, scrolls to the title, and records analytics', async () => {
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);
        await waitFor(() => expect(mockGetDrafts).toHaveBeenCalled());

        fireEvent.click(screen.getAllByTestId('pagination')[0]);

        await waitFor(() =>
            expect(mockSetUserProfile).toHaveBeenCalledWith({
                patternApprovalDashboard: expect.objectContaining({
                    filterActiveTab: 'drafts',
                    filterCurrentPage: 2,
                }),
            }),
        );
        expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
        expect(mockTrackGAEvent).toHaveBeenCalledWith('Request/pagechange');
    });

    it('resets the saved page once when a different organisation branch is selected', async () => {
        mockAccountDetails = {
            ...BASE_ACCOUNT,
            branchSelectionModalMode: 'SelectAndEditOrg',
            userProfile: {
                ...BASE_ACCOUNT.userProfile,
                patternApprovalDashboard: { ...BASE_FILTERS, filterCurrentPage: 4 },
            },
        };
        mockAccountContextState.value = { details: mockAccountDetails, ...mockAccountDispatchState.value };
        const Dashboard = await importDashboard();
        const view = renderDashboard(Dashboard);

        await waitFor(() => expect(mockSetUserProfile).toHaveBeenCalledTimes(1));
        expect(mockSetUserProfile).toHaveBeenCalledWith({
            patternApprovalDashboard: expect.objectContaining({ filterCurrentPage: 1 }),
        });

        mockAccountDetails = {
            ...mockAccountDetails,
            userProfile: {
                ...mockAccountDetails.userProfile,
                patternApprovalDashboard: { ...BASE_FILTERS, filterCurrentPage: 4 },
            },
        };
        mockAccountContextState.value = { details: mockAccountDetails, ...mockAccountDispatchState.value };
        view.rerender(
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route path='/' element={<Dashboard />} />
                </Routes>
            </MemoryRouter>,
        );

        await waitFor(() => expect(screen.getAllByTestId('pagination')[0]).toHaveAttribute('data-current', '1'));
        expect(mockSetUserProfile).toHaveBeenCalledTimes(1);
    });

    it('reports a rejected profile update without disrupting the dashboard', async () => {
        const saveError = new Error('profile unavailable');
        mockSetUserProfile.mockRejectedValueOnce(saveError);
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);
        await waitFor(() => expect(mockGetDrafts).toHaveBeenCalled());

        fireEvent.click(screen.getAllByTestId('pagination')[0]);

        await waitFor(() => expect(mockAppLoggerError).toHaveBeenCalledWith('T & C Dashboard failed to save user profile.', saveError));
        expect(screen.getByTestId('welcome')).toBeInTheDocument();
    });

    it('redirects users who do not have active Pattern Approval service', async () => {
        mockServicesState.value = [{ service: ServiceType.PatternApproval, isActive: false }];
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        expect(await screen.findByTestId('services-page')).toBeInTheDocument();
        expect(mockGetDrafts).not.toHaveBeenCalled();
    });

    it.each([
        [
            'account context',
            () => {
                mockAccountContextState.value = null;
            },
        ],
        [
            'account details',
            () => {
                mockAccountContextState.value = { details: null };
            },
        ],
        [
            'organisation CRM GUID',
            () => {
                mockAccountDetails = { ...BASE_ACCOUNT, organisationCRMGuid: undefined };
                mockAccountContextState.value = { details: mockAccountDetails, ...mockAccountDispatchState.value };
            },
        ],
        [
            'saved filters',
            () => {
                mockAccountDetails = { ...BASE_ACCOUNT, userProfile: { services: ACTIVE_PATTERN_APPROVAL } };
                mockAccountContextState.value = { details: mockAccountDetails, ...mockAccountDispatchState.value };
            },
        ],
        [
            'idle authentication',
            () => {
                mockMsalContext.inProgress = 'login';
            },
        ],
        [
            'signed-in account',
            () => {
                mockMsalContext.accounts = [];
            },
        ],
    ])('does not request dashboard data without %s', async (_condition, arrange) => {
        arrange();
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await screen.findByTestId('welcome');
        expect(mockGetDrafts).not.toHaveBeenCalled();
        expect(mockGetApplications).not.toHaveBeenCalled();
    });

    it('routes fatal API failures using the returned status', async () => {
        mockGetDrafts.mockRejectedValueOnce({ status: 500, title: 'Server Error' });
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        expect(await screen.findByTestId('error-page')).toBeInTheDocument();
        expect(mockAppLoggerError).toHaveBeenCalledWith('Failed to load dashboard.', { status: 500, title: 'Server Error' });
    });

    it('publishes a forbidden notification without leaving the dashboard', async () => {
        mockGetDrafts.mockRejectedValueOnce({ status: 403, title: 'Forbidden' });
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await waitFor(() =>
            expect(mockSetDashboardNotification).toHaveBeenCalledWith({
                message: 'forbidden',
                severity: 'error',
            }),
        );
        expect(screen.getByTestId('welcome')).toBeInTheDocument();
    });

    it('resets third-party organisation selection after an access failure', async () => {
        mockGetDrafts.mockRejectedValueOnce({ status: 403, title: 'No third-party access for organisation' });
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await waitFor(() =>
            expect(mockSetDashboardNotification).toHaveBeenCalledWith({
                message: 'no-third-party:Target Labs',
                severity: 'error',
            }),
        );
        expect(mockSetTargetOrganisation).toHaveBeenCalledWith('12345678901', 'Acme Metrology');
    });

    it('uses empty organisation values when third-party account data is absent', async () => {
        mockAccountDetails = {
            ...BASE_ACCOUNT,
            abn: undefined,
            organisation: undefined,
            targetOrganisation: undefined,
        } as unknown as AccountDetails;
        mockAccountContextState.value = { details: mockAccountDetails, ...mockAccountDispatchState.value };
        mockGetDrafts.mockRejectedValueOnce({ status: 403, title: 'No third-party access' });
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await waitFor(() => expect(mockSetTargetOrganisation).toHaveBeenCalledWith('', ''));
        expect(mockSetDashboardNotification).toHaveBeenCalledWith({
            message: 'no-third-party:undefined',
            severity: 'error',
        });
    });

    it('renders empty state instead of requests before terms are accepted and marks content inert', async () => {
        mockAccountDetails = { ...BASE_ACCOUNT, userAcceptedTermsOfUse: false, showBranchSelector: true };
        mockAccountContextState.value = { details: mockAccountDetails, ...mockAccountDispatchState.value };
        mockGetDrafts.mockResolvedValue({ ...EMPTY_RESPONSE, items: [{ referenceId: 'TA-HIDDEN' }] });
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await waitFor(() => expect(mockGetDrafts).toHaveBeenCalled());
        expect(screen.queryByText('TA-HIDDEN')).not.toBeInTheDocument();
        expect(screen.getAllByTestId('no-requests').length).toBeGreaterThan(0);
        expect(document.querySelectorAll('[inert]').length).toBeGreaterThan(0);
    });

    it('renders persisted notifications and clears them from their controls and on unmount', async () => {
        mockGetDashboardNotification.mockReturnValue({ message: 'saved', severity: 'success' });
        mockGetDashboardInfoNotification.mockReturnValue({ message: 'information', severity: 'info' });
        const Dashboard = await importDashboard();
        const view = renderDashboard(Dashboard);

        fireEvent.click(await screen.findByTestId('notif-message-1'));
        fireEvent.click(screen.getByTestId('notif-info-message-2'));
        expect(mockClearDashboardNotification).toHaveBeenCalledTimes(1);
        expect(mockClearDashboardInfoNotification).toHaveBeenCalled();

        view.unmount();
        expect(mockClearDashboardNotification).toHaveBeenCalledTimes(2);
    });

    it('cancels a pending tab-profile save when unmounted', async () => {
        vi.useFakeTimers();
        const Dashboard = await importDashboard();
        const view = renderDashboard(Dashboard);
        await act(async () => {
            await Promise.resolve();
        });

        fireEvent.click(screen.getByRole('tab', { name: 'Applications' }));
        view.unmount();
        await act(async () => {
            vi.advanceTimersByTime(301);
        });

        expect(mockSetUserProfile).not.toHaveBeenCalled();
        vi.useRealTimers();
    });

    it('reloads after a request deletion and sends the current tab to request items', async () => {
        mockGetDrafts.mockResolvedValue({ ...EMPTY_RESPONSE, items: [{ referenceId: 'TA-DELETE' }] });
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);
        const [deleteButton] = await screen.findAllByRole('button', { name: 'Delete' });

        fireEvent.click(deleteButton);

        await waitFor(() => expect(mockGetDrafts.mock.calls.length).toBeGreaterThanOrEqual(2));
        expect(screen.getAllByTestId('request-item')[0]).toHaveAttribute('data-tab', 'drafts');
    });

    it('retains the active tab while cleared filters suspend request loading', async () => {
        mockGetDrafts.mockResolvedValue({ ...EMPTY_RESPONSE, items: [{ referenceId: 'TA-CLEAR' }] });
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);
        await screen.findAllByText('TA-CLEAR');

        fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

        expect(screen.getByRole('tab', { name: 'Drafts' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getAllByTestId('block-spinner').length).toBeGreaterThan(0);
    });

    it('renders organisation identity, service-management affordance, and navigation analytics', async () => {
        mockServicesState.value = [
            { service: ServiceType.PatternApproval, isActive: true },
            { service: ServiceType.TestingCalibration, isActive: true },
        ];
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        expect(await screen.findByText('Acme Metrology')).toBeInTheDocument();
        expect(screen.getByText('Acme Trading - Sydney')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Change' })).toHaveAttribute('href', '/services-we-offer?mode=manage');

        fireEvent.click(screen.getByTestId('new-application-button'));
        expect(mockTrackGAEvent).toHaveBeenCalledWith('New TA application');
    });

    it('converts an unsupported restored tab into the standard error route', async () => {
        mockSessionGetItem.mockReturnValue('instruments');
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        expect(await screen.findByTestId('error-page')).toBeInTheDocument();
        expect(mockAppLoggerError).toHaveBeenCalledWith(
            'Failed to load dashboard.',
            expect.objectContaining({ message: 'Unsupported tab: instruments' }),
        );
    });
});
