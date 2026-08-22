import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type * as ReactRouterModule from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MsalContext, type IMsalContext } from '@azure/msal-react';
import { InteractionStatus, Logger } from '@azure/msal-browser';
import BranchSelectorModal from '@/components/modals/BranchSelectorModal';
import { BranchSelectionModalMode } from '@/components/modals/BranchSelectorModal/enums';
import { AccountDispatchCtx, AccountStateCtx } from '@/authentication/accountContext';
import type { AccountDispatchContext } from '@/authentication/accountContext';
import { ModalDispatchCtx, ModalStateCtx } from '@/components/modals/ModalContext';


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

vi.mock('@/api/web-api-client', () => ({
    OrganisationsClient: function OrganisationsClient() {
        return { setAuthToken: vi.fn(), getOrganisationsByABN };
    },
    UsersClient: function UsersClient() {
        return { setAuthToken: vi.fn(), setDefaultOrganisation: mocks.setDefaultOrganisation };
    },
}));

vi.mock('@/storage/notification', () => ({
    getBranchModalNotification: () => mocks.getBranchModalNotification(),
    clearBranchModalNotification: () => mocks.clearBranchModalNotification(),
}));

vi.mock('@/instrumentation/AppLogger', () => ({
    default: { error: (...args: any[]) => mocks.appLoggerError(...args), verbose: vi.fn() },
}));

vi.mock('react-router', async (importOriginal) => {
    const actual = await importOriginal<typeof ReactRouterModule>();
    return { ...actual, useNavigate: () => mocks.navigate };
});

vi.mock('@/components/Alert/NotificationMessage', () => ({
    default: ({ id }: { id: string }) => <div data-testid={id}>notification message</div>,
}));

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
        acquireTokenSilent: async () => ({ accessToken: 'mock-access-token' } as any),
    } as unknown as IMsalContext['instance'],
    inProgress: InteractionStatus.None,
    accounts: [mockMsalAccount],
    logger: new Logger({ loggerCallback: noop, piiLoggingEnabled: false }),
};

const defaultAccountDispatch: AccountDispatchContext = {
    setAgree: noop,
    setCompleted: () => mocks.setCompleted(),
    setContactCompleted: noop,
    setDefaultOrganisationId: (...args: any[]) => mocks.setDefaultOrganisationId(...args),
    setTargetOrganisation: (...args: any[]) => mocks.setTargetOrganisation(...args),
    setOrganisationAndBranch: (...args: any[]) => mocks.setOrganisationAndBranch(...args),
    setUserProfile: () => Promise.resolve(true),
    setShowBranchSelector: vi.fn(),
    setShowRFQSelectModal: vi.fn(),
};

// ─── render helper ────────────────────────────────────────────────────────────

interface RenderOptions {
    defaultOrganisationId?: number;
    mode?: string;
    rfqId?: string;
    accountCreationCompleted?: boolean;
    abn?: string;
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
                            abn,
                            userAcceptedTermsOfUse: true,
                            accountCreationCompleted,
                            accountContactCompleted: true,
                            currentTermsVersion: '1',
                            defaultOrganisationId,
                            organisationCRMGuid: defaultOrganisationId === 1 ? 'guid-001' : undefined,
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
                                rfqId,
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

// ─── tests ────────────────────────────────────────────────────────────────────

describe('BranchSelectorModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getOrganisationsByABN.mockResolvedValue(mockBranches);
        mocks.setDefaultOrganisation.mockResolvedValue(undefined);
        mocks.getBranchModalNotification.mockReturnValue(null);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // ── branch loading ──────────────────────────────────────────────────────

    it('preselects the first branch when the account has no default organisation id', async () => {
        renderModal();

        const firstBranch = await screen.findByRole('radio', { name: 'ACME Sydney Office' });

        await waitFor(() => {
            expect(firstBranch).toBeChecked();
        });
    });

    it('preselects the matching branch when the account has a default organisation id', async () => {
        renderModal({ defaultOrganisationId: 1 });

        const firstBranch = await screen.findByRole('radio', { name: 'ACME Sydney Office' });

        await waitFor(() => {
            expect(firstBranch).toBeChecked();
        });
    });

    it('shows no-branches message when the API returns an empty array', async () => {
        // An empty result causes a TypeError accessing result[0] which the catch handles,
        // but branches is set to [] before the throw so the empty-branches tbody renders.
        getOrganisationsByABN.mockResolvedValue([]);

        renderModal();

        await waitFor(() => {
            expect(screen.getByText(/No branch\/locations available/i)).toBeInTheDocument();
        });
    });

    it('shows error alert when branch loading fails', async () => {
        getOrganisationsByABN.mockRejectedValueOnce(new Error('network error'));

        renderModal();

        await waitFor(() => {
            expect(screen.getByText(/Error trying to save default branch\/location/i)).toBeInTheDocument();
        });
        expect(mocks.appLoggerError).toHaveBeenCalledWith('Failed to load branches', expect.any(Error));
    });

    it('ignores branch load result after the component unmounts (covers !isActive return in try)', async () => {
        let resolveLoad!: (v: any) => void;
        getOrganisationsByABN.mockReturnValueOnce(
            new Promise((resolve) => { resolveLoad = resolve; }),
        );

        const { unmount } = renderModal();
        unmount();

        await act(async () => { resolveLoad(mockBranches); });
        await Promise.resolve();

        expect(mocks.appLoggerError).not.toHaveBeenCalled();
    });

    it('ignores branch load error after the component unmounts (covers !isActive return in catch)', async () => {
        let rejectLoad!: (e: any) => void;
        getOrganisationsByABN.mockReturnValueOnce(
            new Promise((_, reject) => { rejectLoad = reject; }),
        );

        const { unmount } = renderModal();
        unmount();

        await act(async () => { rejectLoad(new Error('stale error')); });
        await Promise.resolve();

        // isActive was false when catch executed — error not logged
        expect(mocks.appLoggerError).not.toHaveBeenCalled();
    });

    it('skips branch loading when the account ABN is not set', async () => {
        renderModal({ abn: undefined });

        await Promise.resolve();

        expect(getOrganisationsByABN).not.toHaveBeenCalled();
    });

    // ── UI modes ────────────────────────────────────────────────────────────

    it('renders the RFQ modal title and body text', async () => {
        renderModal({ mode: BranchSelectionModalMode.RFQSelectOrg });

        await screen.findByRole('radio', { name: 'ACME Sydney Office' });

        expect(screen.getByText('Change branch/location')).toBeInTheDocument();
        expect(screen.getByText(/Select default branch or location name/i)).toBeInTheDocument();
    });

    it('renders a notification message when getBranchModalNotification returns a value', async () => {
        mocks.getBranchModalNotification.mockReturnValue({ message: 'Info note', variant: 'info' });

        renderModal();

        await waitFor(() => {
            expect(screen.getByTestId('notif-message-1')).toBeInTheDocument();
        });
    });

    // ── interactions ────────────────────────────────────────────────────────

    it('updates selected branch when a different radio button is clicked', async () => {
        renderModal();

        await screen.findByRole('radio', { name: 'ACME Sydney Office' });

        const secondBranch = screen.getByRole('radio', { name: 'ACME Melbourne Branch' });
        fireEvent.click(secondBranch);

        await waitFor(() => {
            expect(secondBranch).toBeChecked();
        });
    });

    it('shows the cancel button when a default organisation id is set', async () => {
        renderModal({ defaultOrganisationId: 1 });

        await screen.findByRole('radio', { name: 'ACME Sydney Office' });

        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('does not show the cancel button when no default organisation id is set', async () => {
        renderModal();

        await screen.findByRole('radio', { name: 'ACME Sydney Office' });

        expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    it('calls setShowBranchSelector(false) when the cancel button is clicked', async () => {
        renderModal({ defaultOrganisationId: 1 });

        await screen.findByRole('radio', { name: 'ACME Sydney Office' });

        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

        expect(mocks.setShowBranchSelector).toHaveBeenCalledWith(false);
        expect(mocks.clearBranchModalNotification).toHaveBeenCalled();
    });

    // ── sorting ─────────────────────────────────────────────────────────────

    it('toggles sort direction from asc to desc and covers all getArrow icon paths', async () => {
        // Branch with undefined businessListName exercises the ?? '' fallback in toSortableText
        getOrganisationsByABN.mockResolvedValueOnce([...mockBranches, mockBranchUndefinedName]);

        renderModal();

        await screen.findByRole('radio', { name: 'ACME Sydney Office' });

        const sortBtn = screen.getByRole('button', { name: /branch\/location name/i });

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
        expect(mocks.clearBranchModalNotification).toHaveBeenCalled();
        expect(mocks.setOrganisationAndBranch).toHaveBeenCalled();
    });

    // ── save — RFQSelectOrg ─────────────────────────────────────────────────

    it('calls setDefaultOrganisation with rfqId and reloads the page on save (RFQ mode)', async () => {
        const origLocation = globalThis.location;
        const reloadMock = vi.fn();
        Object.defineProperty(globalThis, 'location', {
            configurable: true,
            value: { ...origLocation, reload: reloadMock },
        });

        renderModal({ mode: BranchSelectionModalMode.RFQSelectOrg, rfqId: 'RFQ-123' });

        await screen.findByRole('radio', { name: 'ACME Sydney Office' });

        fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));

        await waitFor(() => {
            expect(mocks.setDefaultOrganisation).toHaveBeenCalledWith(
                expect.objectContaining({ defaultOrganisationId: 1, rfqId: 'RFQ-123' }),
            );
        });
        expect(reloadMock).toHaveBeenCalled();
        expect(mocks.navigate).not.toHaveBeenCalled();

        Object.defineProperty(globalThis, 'location', { configurable: true, value: origLocation });
    });

    // ── save — error ────────────────────────────────────────────────────────

    it('shows error alert and logs when save fails', async () => {
        mocks.setDefaultOrganisation.mockRejectedValueOnce(new Error('save error'));

        renderModal();

        await screen.findByRole('radio', { name: 'ACME Sydney Office' });

        fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));

        await waitFor(() => {
            expect(screen.getByText(/Error trying to save default branch\/location/i)).toBeInTheDocument();
        });
        expect(mocks.appLoggerError).toHaveBeenCalledWith(
            'Failed to select organisation',
            expect.any(Error),
        );
    });

    // ── dispatch helpers ────────────────────────────────────────────────────

    it('returns early from applyAccountDispatchUpdates when accountDispatch is null', async () => {
        renderModal({ accountDispatch: null });

        await screen.findByRole('radio', { name: 'ACME Sydney Office' });

        fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));

        await waitFor(() => {
            expect(mocks.setDefaultOrganisation).toHaveBeenCalled();
        });
        // Helper returned early — no dispatch calls made
        expect(mocks.setDefaultOrganisationId).not.toHaveBeenCalled();
        expect(mocks.setOrganisationAndBranch).not.toHaveBeenCalled();
    });

    it('skips setOrganisationAndBranch when selectedOrganisation is undefined', async () => {
        // No ABN → branches never load → selectedOrganisation stays undefined
        renderModal({ abn: undefined });

        fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));

        await waitFor(() => {
            expect(mocks.setDefaultOrganisation).toHaveBeenCalled();
        });
        expect(mocks.setDefaultOrganisationId).toHaveBeenCalled();
        expect(mocks.setOrganisationAndBranch).not.toHaveBeenCalled();
    });

    it('calls setCompleted and setTargetOrganisation when account creation is incomplete on save', async () => {
        renderModal({ accountCreationCompleted: false });

        await screen.findByRole('radio', { name: 'ACME Sydney Office' });

        fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));

        await waitFor(() => {
            expect(mocks.setCompleted).toHaveBeenCalled();
        });
        expect(mocks.setTargetOrganisation).toHaveBeenCalled();
    });

    it('does nothing when MSAL interaction is in progress (line 187 false branch)', async () => {
        renderModal({ msalInProgress: InteractionStatus.Login });

        await screen.findByRole('radio', { name: 'ACME Sydney Office' });

        fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));

        await Promise.resolve();

        expect(mocks.setDefaultOrganisation).not.toHaveBeenCalled();
        expect(mocks.navigate).not.toHaveBeenCalled();
    });

    it('passes empty-string fallbacks when tradingName and branchName are undefined on save', async () => {
        getOrganisationsByABN.mockResolvedValueOnce([{
            organisationId: 5,
            name: 'No-Name Corp',
            businessListName: 'No-Name WA Office',
            businessOrTradingName: undefined as unknown as string,
            branchOrLocationName: undefined as unknown as string,
            abn: '00000000001',
            crmGuid: 'guid-005',
            streetAddress: { suburb: 'Perth', state: 'WA' },
        }]);

        renderModal();

        await screen.findByRole('radio', { name: 'No-Name WA Office' });

        fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));

        await waitFor(() => {
            expect(mocks.setOrganisationAndBranch).toHaveBeenCalledWith('No-Name Corp', '', '');
        });
    });

    it('skips setDefaultOrganisation and navigates when modal mode is unrecognised (line 199 false branch)', async () => {
        renderModal({ mode: 'UnknownMode' });

        await screen.findByRole('radio', { name: 'ACME Sydney Office' });

        fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));

        await waitFor(() => {
            expect(mocks.navigate).toHaveBeenCalledWith('/');
        });
        expect(mocks.setDefaultOrganisation).not.toHaveBeenCalled();
    });
});
