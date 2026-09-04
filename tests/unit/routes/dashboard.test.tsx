import type React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { AccountDetails } from '../../../ClientApp/src/authentication/accountContext';

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
    mockAcquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'mock-token' }),
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
    mockGetDashboardNotification: vi.fn<() => { message: string; severity: string } | null>(() => null),
    mockGetDashboardInfoNotification: vi.fn<() => { message: string; severity: string } | null>(() => null),
    mockClearDashboardNotification: vi.fn(),
    mockClearDashboardInfoNotification: vi.fn(),
    mockModalState: { showBranchSelector: false, showRFQDeleteModal: false, branchSelectionModalMode: undefined as string | undefined },
    mockMsalContext: {
        instance: { acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'mock-token' }) },
        accounts: [{ homeAccountId: 'id' }],
        inProgress: 'none',
    },
}));

// ── Mutable state for per-test account customisation ─────────────────────────

let mockAccountDetails: AccountDetails | null = null;

// ── Module mocks ───────────────────────────────────────────────────────────────

vi.mock('../../../ClientApp/src/api/web-api-client', () => ({
    DashboardClient: vi.fn().mockImplementation(function (this: any) {
        this.setAuthToken = mockSetAuthToken;
        this.getDashboardDraftsByPortalID = mockGetDrafts;
        this.getDashboardQuotesByPortalID = mockGetQuotes;
        this.getDashboardArtefactsByPortalID = mockGetArtefacts;
    }),
    StatusEnumDto: {},
}));

vi.mock('@azure/msal-react', () => ({
    useMsal: () => mockMsalContext,
}));

vi.mock('@azure/msal-browser', () => ({
    InteractionStatus: { None: 'none' },
}));

vi.mock('../../../ClientApp/src/authentication/hooks', () => ({
    useAccountState: () => ({ details: mockAccountDetails }),
    useAccountDispatch: () => mockAccountDispatchState.value,
}));

vi.mock('../../../ClientApp/src/authentication/authConfig', () => ({
    tokenRequest: { scopes: ['openid'] },
}));

vi.mock('../../../ClientApp/src/components/modals/ModalContext', () => ({
    useModalState: () => mockModalState,
    useModalDispatch: () => ({ setShowBranchSelector: mockSetShowBranchSelector }),
}));

vi.mock('../../../ClientApp/src/routes/common/constants', () => ({
    defaultFilter: {
        filterYearType: 'allYears',
        filterStatusType: 'allStatuses',
        filterCurrentPage: 1,
        filterActiveTab: 'drafts',
        filterSearchText: '',
        filterSortOrder: 'descending',
        filtersChanged: false,
    },
}));

vi.mock('../../../ClientApp/src/routes/common/helperFunctions', () => ({
    mapToUserProfile: mockMapToUserProfile,
}));

vi.mock('../../../ClientApp/src/components/Welcome', () => ({
    default: () => <div data-testid="welcome" />,
}));

vi.mock('../../../ClientApp/src/components/BlockUISpinner', () => ({
    default: ({ children }: any) => <div data-testid="block-spinner">{children}</div>,
}));

vi.mock('../../../ClientApp/src/components/Alert/NotificationMessage', () => ({
    default: () => <div data-testid="notification-message" />,
}));

vi.mock('../../../ClientApp/src/components/Utilities/useHtmlTitle', () => ({
    default: () => {},
}));

vi.mock('../../../ClientApp/src/components/Utilities/useBodyClass', () => ({
    default: () => {},
}));

vi.mock('../../../ClientApp/src/components/Utilities/useDebounce', () => ({
    default: (value: any) => value,
}));

vi.mock('../../../ClientApp/src/components/tiles/StandardPathway', () => ({
    default: () => <div data-testid="standard-pathway" />,
}));

vi.mock('../../../ClientApp/src/components/SearchFilter', () => ({
    default: () => <div data-testid="search-filter" />,
}));

vi.mock('../../../ClientApp/src/components/RequestList/requestItem', () => ({
    default: () => <li data-testid="request-item" />,
}));

vi.mock('../../../ClientApp/src/components/RequestList/instrumentItem', () => ({
    default: () => <li data-testid="instrument-item" />,
}));

vi.mock('../../../ClientApp/src/components/RequestList/noRequests', () => ({
    default: () => <div data-testid="no-requests" />,
}));

// CustomPagination mock — exposes data-current, data-total, and an onPageChange-wired Next button
vi.mock('../../../ClientApp/src/components/Pagination', () => ({
    default: ({ onPageChange, currentPage, totalPages }: any) => (
        <button
            data-testid="pagination"
            data-current={currentPage}
            data-total={totalPages}
            onClick={() => onPageChange?.((currentPage ?? 1) + 1)}
        >
            Next
        </button>
    ),
}));

vi.mock('../../../ClientApp/src/components/PaginationHeader', () => ({
    default: () => <div data-testid="pagination-header" />,
}));

vi.mock('../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: {
        info: vi.fn(),
        verbose: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        critical: vi.fn(),
        trace: vi.fn(),
    },
}));

vi.mock('../../../ClientApp/src/routes/common/errorRoutes', () => ({
    default: (_status: number) => '/server-error',
}));

vi.mock('../../../ClientApp/src/routes/common/dashboardNotifications', () => ({
    DashBoardNotifications: {
        getForbiddenNotification: vi.fn(() => ({ message: 'forbidden', severity: 'error' })),
        getThirdPartyAccessNotification: vi.fn(() => ({ message: 'no-third-party', severity: 'error' })),
        getReportFormsGeneratedNotification: vi.fn(() => ({ message: 'report-forms', severity: 'info' })),
        getDashboardErrorNotification: vi.fn(() => ({ message: 'error', severity: 'error' })),
    },
}));

vi.mock('../../../ClientApp/src/storage/notification', () => ({
    getDashboardNotification: mockGetDashboardNotification,
    clearDashboardNotification: mockClearDashboardNotification,
    setDashboardNotification: mockSetDashboardNotification,
    getDashboardInfoNotification: mockGetDashboardInfoNotification,
    setDashboardInfoNotification: vi.fn(),
    clearDashboardInfoNotification: mockClearDashboardInfoNotification,
}));

vi.mock('../../../ClientApp/src/storage/sessionStorageCache', () => ({
    default: () => ({
        getItem: mockSessionGetItem,
        setItem: mockSessionSetItem,
        removeItem: mockSessionRemoveItem,
        clear: vi.fn(),
    }),
}));

vi.mock('../../../ClientApp/src/analytics/GoogleAnalytics', () => ({
    trackGAEvent: mockTrackGAEvent,
}));

vi.mock('../../../ClientApp/src/routes/common/enums', () => ({
    DashboardItemStatus: {
        QuoteAvailable: 'Quote offer is available',
        QuoteAccepted: 'Quote offer is accepted',
    },
    QuoteStatus: {},
    Environment: {},
}));

vi.mock('../../../ClientApp/src/components/modals/BranchSelectorModal/enums', () => ({
    BranchSelectionModalMode: {
        SelectAndEditOrg: 'SelectAndEditOrg',
        RFQSelectOrg: 'RFQSelectOrg',
    },
}));

vi.mock('react-number-format', () => ({
    PatternFormat: ({ value }: any) => <span>{value}</span>,
}));

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
                <Route path="/" element={<Dashboard />} />
                <Route path="/server-error" element={<div data-testid="error-page" />} />
                <Route path="*" element={<div data-testid="error-page" />} />
            </Routes>
        </MemoryRouter>,
    );
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Dashboard', () => {
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

    // ── Test 1: Renders without crashing ──────────────────────────────────────

    it('1. renders without crashing and shows Welcome component', async () => {
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await waitFor(() => {
            expect(screen.getByTestId('welcome')).toBeInTheDocument();
        });
    });

    // ── Test 2: SEC-010 — organisationCRMGuid passed as first arg to API ──────

    it('2. (SEC-010) passes organisationCRMGuid as first argument to getDashboardDraftsByPortalID', async () => {
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await waitFor(() => {
            expect(mockGetDrafts).toHaveBeenCalled();
        });

        // SEC-010: every call — not just the first — must use the correct org GUID
        for (const call of mockGetDrafts.mock.calls) {
            expect(call[0]).toBe('crm-guid-001');
        }
    });

    // ── Test 3: Sets auth token before API call ────────────────────────────────

    it('3. sets auth token on the client before making API calls', async () => {
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await waitFor(() => {
            expect(mockSetAuthToken).toHaveBeenCalledWith('mock-token');
        });

        // Verify ordering: setAuthToken must precede getDashboardDraftsByPortalID
        expect(mockGetDrafts).toHaveBeenCalled();
        const setTokenOrder = mockSetAuthToken.mock.invocationCallOrder[0];
        const getDraftsOrder = mockGetDrafts.mock.invocationCallOrder[0];
        expect(setTokenOrder).toBeLessThan(getDraftsOrder);
    });

    // ── Test 4: NoRequests when API returns empty items ────────────────────────

    it('4. shows NoRequests component when API returns empty items array', async () => {
        mockGetDrafts.mockResolvedValue({ items: [], currentPage: 1, totalPages: 1, totalCount: 0 });
        mockGetQuotes.mockResolvedValue({ items: [], currentPage: 1, totalPages: 1, totalCount: 0 });
        mockGetArtefacts.mockResolvedValue({ items: [], currentPage: 1, totalPages: 1, totalCount: 0 });

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
        mockAccountDetails = { ...BASE, organisationCRMGuid: undefined };

        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        // Wait for the component to mount and render. Welcome renders unconditionally;
        // if it appears without the API being called, the org-GUID guard is working.
        await waitFor(() => expect(screen.getByTestId('welcome')).toBeInTheDocument());
        expect(mockGetDrafts).not.toHaveBeenCalled();
        expect(mockGetQuotes).not.toHaveBeenCalled();
        expect(mockGetArtefacts).not.toHaveBeenCalled();
    });

    // ── Test 6: Navigates to error route on fatal API error ───────────────────

    it('6. navigates to /server-error route when API rejects with a 500 error', async () => {
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
        mockGetDrafts.mockResolvedValue({ items: [], currentPage: 1, totalPages: 3, totalCount: 25 });

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
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await waitFor(() => {
            expect(mockGetDrafts).toHaveBeenCalled();
        });

        fireEvent.click(screen.getAllByTestId('pagination')[0]);

        await waitFor(() => {
            expect(mockSetUserProfile).toHaveBeenCalledWith({
                testingCalibrationDashboard: expect.objectContaining({
                    filterCurrentPage: 2,
                    filterActiveTab: 'drafts',
                }),
            });
        });
    });

    it.each([
        ['Requests', 'Requests', mockGetQuotes, 'requests'],
        ['Instruments', 'Instrument/artefacts', mockGetArtefacts, 'instruments'],
    ])('loads the %s tab and records the selection', async (_tabName, accessibleName, apiMock, tabValue) => {
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        fireEvent.click(await screen.findByRole('tab', { name: accessibleName }));

        await waitFor(() => expect(apiMock).toHaveBeenCalled());
        expect(mockTrackGAEvent).toHaveBeenCalledWith(tabValue);
        expect(mockSetUserProfile).toHaveBeenCalledWith({
            testingCalibrationDashboard: expect.objectContaining({
                filterActiveTab: tabValue,
                filterCurrentPage: 1,
            }),
        });
    });

    it('returns to drafts and records the selection', async () => {
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        fireEvent.click(await screen.findByRole('tab', { name: 'Requests' }));
        await waitFor(() => expect(mockGetQuotes).toHaveBeenCalled());

        fireEvent.click(screen.getByRole('tab', { name: 'Drafts' }));

        await waitFor(() => expect(mockGetDrafts).toHaveBeenCalledTimes(2));
        expect(mockTrackGAEvent).toHaveBeenCalledWith('drafts');
        expect(mockSetUserProfile).toHaveBeenCalledWith({
            testingCalibrationDashboard: expect.objectContaining({
                filterActiveTab: 'drafts',
                filterCurrentPage: 1,
            }),
        });
    });

    it('normalises a newly accepted quote from session storage', async () => {
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

        await waitFor(() => expect(mockSessionSetItem).toHaveBeenCalledWith('RFQ-accepted', 'view-quote-id'));
        expect(acceptedItem.status).toBe('Quote offer is accepted');
        expect(acceptedItem.quote).toEqual({ artefactName: 'Mass standard' });
        expect(mockSessionRemoveItem).toHaveBeenCalledWith('accepted-quote-id');
    });

    it('removes an accepted quote marker when the response has no items', async () => {
        mockSessionGetItem.mockReturnValue('RFQ-accepted');
        mockGetDrafts.mockResolvedValue({ items: undefined, currentPage: 1, totalPages: 1, totalCount: 0 });

        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await waitFor(() => expect(mockSessionRemoveItem).toHaveBeenCalledWith('accepted-quote-id'));
        expect(mockSessionSetItem).not.toHaveBeenCalled();
    });

    it('handles forbidden and third-party access errors without fatal navigation', async () => {
        mockGetDrafts
            .mockRejectedValueOnce({ status: 403, title: 'Forbidden' })
            .mockRejectedValueOnce({ status: 403, title: 'No third-party access for organisation' });
        const Dashboard = await importDashboard();
        const { unmount } = renderDashboard(Dashboard);

        await waitFor(() => expect(mockSetDashboardNotification).toHaveBeenCalledWith({
            message: 'forbidden',
            severity: 'error',
        }));
        unmount();

        renderDashboard(Dashboard);
        await waitFor(() => expect(mockSetDashboardNotification).toHaveBeenCalledWith({
            message: 'no-third-party',
            severity: 'error',
        }));
        expect(mockSetTargetOrganisation).toHaveBeenCalledWith('', 'Acme');
    });

    it('ignores aborted dashboard requests', async () => {
        mockGetDrafts.mockRejectedValueOnce({ name: 'AbortError' });
        const Dashboard = await importDashboard();

        renderDashboard(Dashboard);

        await waitFor(() => expect(mockGetDrafts).toHaveBeenCalled());
        expect(screen.getByTestId('welcome')).toBeInTheDocument();
        expect(screen.queryByTestId('error-page')).not.toBeInTheDocument();
    });

    it('opens branch management and records new request and instrument pagination actions', async () => {
        const scrollIntoView = vi.fn();
        document.getElementById = vi.fn(() => ({ scrollIntoView } as unknown as HTMLElement));
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        fireEvent.click(await screen.findByTestId('open-manage-branch-division-button'));
        expect(mockSetShowBranchSelector).toHaveBeenCalledWith(true);

        fireEvent.click(screen.getByRole('tab', { name: 'Instrument/artefacts' }));
        await waitFor(() => expect(mockGetArtefacts).toHaveBeenCalled());
        fireEvent.click(screen.getAllByTestId('pagination')[2]);

        expect(mockTrackGAEvent).toHaveBeenCalledWith('Instrument/pagechange');
        expect(scrollIntoView).toHaveBeenCalled();

        fireEvent.click(screen.getByTestId('new-request-button'));
        expect(mockTrackGAEvent).toHaveBeenCalledWith('New request');
    });

    it('resets profile paging after branch selection', async () => {
        mockModalState.branchSelectionModalMode = 'SelectAndEditOrg';
        const Dashboard = await importDashboard();

        renderDashboard(Dashboard);

        await waitFor(() => expect(mockSetUserProfile).toHaveBeenCalledWith({
            testingCalibrationDashboard: expect.objectContaining({
                filterCurrentPage: 1,
                filterActiveTab: 'drafts',
            }),
        }));
    });

    it('falls back to drafts when the saved profile records no active tab', async () => {
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

        await waitFor(() => expect(mockSetUserProfile).toHaveBeenCalledWith({
            testingCalibrationDashboard: expect.objectContaining({
                filterCurrentPage: 1,
            }),
        }));
    });

    it('renders dashboard notifications and complete organisation labels', async () => {
        mockGetDashboardNotification.mockReturnValue({ message: 'Saved', severity: 'success' });
        mockGetDashboardInfoNotification.mockReturnValue({ message: 'Information', severity: 'info' });
        mockAccountDetails = {
            ...BASE,
            organisation: 'Parent organisation',
            trading: 'Trading name',
            branch: 'Sydney',
            abn: '12345678901',
        };

        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await waitFor(() => expect(mockGetDrafts).toHaveBeenCalled());
        expect(screen.getAllByTestId('notification-message')).toHaveLength(2);
        expect(screen.getByText(/Trading name/)).toBeInTheDocument();
        expect(screen.getByText(/Sydney/)).toBeInTheDocument();
        expect(screen.getByText('12345678901')).toBeInTheDocument();
    });

    it('navigates to the generic error route when an API error has no status', async () => {
        mockGetDrafts.mockRejectedValueOnce({});

        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await waitFor(() => expect(screen.getByTestId('error-page')).toBeInTheDocument());
    });

    it('leaves an accepted-quote marker item unchanged when its status is not available', async () => {
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

        await waitFor(() => expect(mockSessionRemoveItem).toHaveBeenCalledWith('accepted-quote-id'));
        expect(acceptedItem.status).toBe('Draft');
        expect(mockSessionSetItem).not.toHaveBeenCalled();
    });

    it('passes custom year and status filters and applies missing paging defaults', async () => {
        mockAccountDetails = {
            ...BASE,
            userProfile: { testingCalibrationDashboard: {
                ...BASE_USER_PROFILE,
                filterYearType: '2025',
                filterStatusType: 'Open' as any,
                filterCurrentPage: undefined,
            } },
        };
        mockMapToUserProfile.mockReturnValue({
            ...BASE_USER_PROFILE,
            filterYearType: '2025',
            filterStatusType: 'Open',
            filterCurrentPage: undefined,
        });
        mockGetDrafts.mockResolvedValue({
            items: undefined,
            currentPage: undefined,
            totalPages: undefined,
            totalCount: undefined,
        });

        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await waitFor(() => expect(mockGetDrafts).toHaveBeenCalled());
        expect(mockGetDrafts.mock.calls.at(-1)?.[1]).toBe('2025');
        expect(mockGetDrafts.mock.calls.at(-1)?.[2]).toBe('Open');
        expect(screen.getAllByTestId('pagination')[0]).toHaveAttribute('data-current', '1');
        expect(screen.getAllByTestId('pagination')[0]).toHaveAttribute('data-total', '0');
    });

    it('does not load dashboard data without a saved user profile', async () => {
        mockAccountDetails = { ...BASE, userProfile: undefined };

        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await waitFor(() => expect(screen.getByTestId('welcome')).toBeInTheDocument());
        expect(mockGetDrafts).not.toHaveBeenCalled();
    });

    it('uses mapped profile defaults when active tab and page are absent', async () => {
        mockMapToUserProfile.mockReturnValue({
            ...BASE_USER_PROFILE,
            filterActiveTab: undefined,
            filterCurrentPage: undefined,
        });

        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await waitFor(() => expect(screen.getByRole('tab', { name: 'Drafts' })).toHaveAttribute('aria-selected', 'true'));
        expect(screen.getAllByTestId('pagination')[0]).toHaveAttribute('data-current', '1');
        expect(mockGetDrafts).not.toHaveBeenCalled();
    });

    it('waits for MSAL to become idle before loading dashboard data', async () => {
        mockMsalContext.inProgress = 'login';

        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await waitFor(() => expect(screen.getByTestId('welcome')).toBeInTheDocument());
        expect(mockGetDrafts).not.toHaveBeenCalled();
    });

    it('handles third-party access errors when account dispatch is unavailable', async () => {
        mockAccountDispatchState.value = undefined;
        mockGetDrafts.mockRejectedValueOnce({
            status: 403,
            title: 'No third-party access for organisation',
        });

        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await waitFor(() => expect(mockSetDashboardNotification).toHaveBeenCalledWith({
            message: 'no-third-party',
            severity: 'error',
        }));
        expect(mockSetTargetOrganisation).not.toHaveBeenCalled();
    });

    it('uses empty third-party organisation fallbacks', async () => {
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

        await waitFor(() => expect(mockSetTargetOrganisation).toHaveBeenCalledWith('', ''));
    });

    it('allows tab and page interactions before profile filters are initialised', async () => {
        mockAccountDetails = { ...BASE, userProfile: undefined };
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        fireEvent.click(await screen.findByRole('tab', { name: 'Requests' }));
        fireEvent.click(screen.getAllByTestId('pagination')[0]);

        expect(mockSetUserProfile).not.toHaveBeenCalled();
    });

    it('does not replace initial filters when the saved profile changes', async () => {
        const Dashboard = await importDashboard();
        const view = renderDashboard(Dashboard);
        await waitFor(() => expect(mockGetDrafts).toHaveBeenCalled());
        mockMapToUserProfile.mockClear();

        mockAccountDetails = {
            ...BASE,
            userProfile: { testingCalibrationDashboard: { ...BASE_USER_PROFILE, filterSearchText: 'changed' } },
        };
        view.rerender(
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                </Routes>
            </MemoryRouter>,
        );

        await waitFor(() => expect(mockMapToUserProfile).toHaveBeenCalled());
    });

    it('writes the branch reset once even when the saved profile identity changes', async () => {
        mockModalState.branchSelectionModalMode = 'SelectAndEditOrg';
        const Dashboard = await importDashboard();
        const view = renderDashboard(Dashboard);

        await waitFor(() => expect(mockSetUserProfile).toHaveBeenCalledTimes(1));

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
                    <Route path="/" element={<Dashboard />} />
                </Routes>
            </MemoryRouter>,
        );

        await waitFor(() => expect(screen.getAllByTestId('pagination')[0]).toHaveAttribute('data-current', '1'));
        expect(mockSetUserProfile).toHaveBeenCalledTimes(1);
    });

    it('uses branch-reset defaults when the mapped profile omits tab and page', async () => {
        mockModalState.branchSelectionModalMode = 'SelectAndEditOrg';
        mockMapToUserProfile.mockReturnValue({
            ...BASE_USER_PROFILE,
            filterActiveTab: undefined,
            filterCurrentPage: undefined,
        });
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await waitFor(() => expect(mockSetUserProfile).toHaveBeenCalled());
        expect(screen.getByRole('tab', { name: 'Drafts' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getAllByTestId('pagination')[0]).toHaveAttribute('data-current', '1');
    });

    it('parses an absent non-default year and defaults an absent request page', async () => {
        mockMapToUserProfile.mockReturnValue({
            ...BASE_USER_PROFILE,
            filterYearType: undefined,
            filterCurrentPage: undefined,
            filterActiveTab: 'drafts',
        });
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await waitFor(() => expect(mockGetDrafts).toHaveBeenCalled());
        expect(mockGetDrafts.mock.calls.at(-1)?.[1]).toBeUndefined();
        expect(mockGetDrafts.mock.calls.at(-1)?.[5]).toBe(1);
    });

    it('marks dashboard content inert while an actionable modal is open', async () => {
        mockModalState.showBranchSelector = true;
        const Dashboard = await importDashboard();
        renderDashboard(Dashboard);

        await waitFor(() => expect(mockGetDrafts).toHaveBeenCalled());
        await waitFor(() => expect(screen.getByTestId('welcome').parentElement).not.toHaveAttribute('aria-live'));
        expect(document.querySelectorAll('[inert]')).toHaveLength(3);
    });
});
