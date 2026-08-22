import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import PreConditions from '../../../ClientApp/src/routes/preConditions/PreConditions';
import type { AccountDetails } from '../../../ClientApp/src/authentication/accountContext';
import { ModalDispatchCtx } from '../../../ClientApp/src/components/modals/ModalContext';
import { getBranchModalNotification } from '../../../ClientApp/src/storage/notification';
import { NotificationSeverity } from '../../../ClientApp/src/storage/types';

// ── Mock factories ─────────────────────────────────────────────────────────────

let mockIsAuthenticated = false;
let mockAccountStateDetails: AccountDetails | null = null;
let mockAccountDispatchAvailable = true;

// ── Module mocks ───────────────────────────────────────────────────────────────

vi.mock('@azure/msal-react', () => ({
    useIsAuthenticated: () => mockIsAuthenticated,
    useMsal: vi.fn(() => ({
        inProgress: 'none',
        accounts: [],
        instance: {},
    })),
}));

vi.mock('../../../ClientApp/src/authentication/hooks', () => ({
    useAccountState: () => ({ details: mockAccountStateDetails }),
    useAccountDispatch: () => (mockAccountDispatchAvailable ? {
        setAgree: vi.fn(),
        setCompleted: vi.fn(),
        setContactCompleted: vi.fn(),
        setDefaultOrganisationId: vi.fn(),
        setTargetOrganisation: vi.fn(),
        setOrganisationAndBranch: vi.fn(),
        setUserProfile: vi.fn(),
    } : undefined),
}));

vi.mock('../../../ClientApp/src/components/Layout', () => ({
    default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

vi.mock('../../../ClientApp/src/components/modals/TermsAndCondition', () => ({
    default: () => <div data-testid="terms-modal">Terms Modal</div>,
}));

vi.mock('../../../ClientApp/src/components/modals/BranchSelectorModal', () => ({
    default: () => <div data-testid="branch-selector-modal">Branch Selector Modal</div>,
}));

vi.mock('../../../ClientApp/src/components/modals/BranchSelectorModal/enums', () => ({
    BranchSelectionModalMode: {
        SelectAndEditOrg: 'SelectAndEditOrg',
        RFQSelectOrg: 'RFQSelectOrg',
    },
}));

vi.mock('../../../ClientApp/src/components/modals/RFQDeleteModal', () => ({
    default: () => <div data-testid="rfq-delete-modal">RFQ Delete Modal</div>,
}));

vi.mock('../../../ClientApp/src/components/modals/ModalContext', () => ({
    ModalStateCtx: React.createContext(null),
    ModalDispatchCtx: React.createContext(null),
    useModalState: vi.fn(),
    useModalDispatch: vi.fn(),
}));

vi.mock('../../../ClientApp/src/components/Utilities/routeChangeScrollTop', () => ({
    default: () => null,
}));

vi.mock('../../../ClientApp/src/components/Utilities/backToTopButton', () => ({
    default: () => null,
}));

vi.mock('../../../ClientApp/src/components/Utilities/routeAccessibleNavigation', () => ({
    default: () => null,
}));

vi.mock('../../../ClientApp/src/storage/notification', () => ({
    clearDashboardNotification: vi.fn(),
    getBranchModalNotification: vi.fn(() => undefined),
}));

// ── Fixtures ───────────────────────────────────────────────────────────────────

/**
 * BASE has both account + contact completed, terms accepted, defaultOrganisationId set.
 * Completed users are redirected away from create-account/create-contact setup routes.
 * Tests override fields and use appropriate paths to isolate each condition.
 *
 * KEY PATH FACTS (from source):
 *   redirectToDashboard only applies on: paths containing 'create-account' OR 'create-contact'
 *   autoShowBranchSelector suppressed on: paths containing 'success-creating-account'
 *
 * Safe render paths for "both completed + terms accepted + want children to render":
 *   '/dashboard' — authenticated app route, does NOT suppress autoShowBranchSelector
 *   '/success-creating-account' — authenticated app route, suppresses autoShowBranchSelector
 */
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
    organisationCRMGuid: 'guid-001',
    organisationIsCompleted: true,
    isDefaultOrganisation: true,
    showBranchSelector: false,
};

// ── Location observer component ────────────────────────────────────────────────

/** Renders the current pathname into DOM so tests can assert navigation. */
const LocationDisplay = () => {
    const loc = useLocation();
    return <div data-testid="current-path">{loc.pathname}</div>;
};

const ModalControls = () => {
    const dispatch = React.useContext(ModalDispatchCtx);

    return (
        <>
            <button type="button" onClick={() => dispatch?.setShowBranchSelector(true)}>Show branch</button>
            <button type="button" onClick={() => dispatch?.setShowRFQDeleteModal(true, 'RFQ-1')}>Show delete</button>
            <button type="button" onClick={() => dispatch?.setShowRFQSelectModal(true, 'RFQ-2', '/request')}>Show RFQ branch</button>
        </>
    );
};

// ── Render helpers ─────────────────────────────────────────────────────────────

/**
 * Standard render: PreConditions is on every route including the redirect destinations.
 * Use this when you want to verify that after a Navigate the destination still works,
 * or when you need to verify children DO render (redirect suppressed).
 */
function renderAt(initialPath: string, displayHeaderAndFooter = true) {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <LocationDisplay />
            <Routes>
                <Route
                    path="/create-account"
                    element={
                        <PreConditions displayHeaderAndFooter={displayHeaderAndFooter}>
                            <div data-testid="child-content">Protected Content</div>
                        </PreConditions>
                    }
                />
                <Route
                    path="/create-contact"
                    element={
                        <PreConditions displayHeaderAndFooter={displayHeaderAndFooter}>
                            <div data-testid="child-content">Protected Content</div>
                        </PreConditions>
                    }
                />
                <Route
                    path="/success-creating-account"
                    element={
                        <PreConditions displayHeaderAndFooter={displayHeaderAndFooter}>
                            <div data-testid="child-content">Protected Content</div>
                        </PreConditions>
                    }
                />
                <Route
                    path="*"
                    element={
                        <PreConditions displayHeaderAndFooter={displayHeaderAndFooter}>
                            <div data-testid="child-content">Protected Content</div>
                        </PreConditions>
                    }
                />
            </Routes>
        </MemoryRouter>,
    );
}

/**
 * Render for redirect tests where '/' should be a plain landing page, not
 * another PreConditions route that immediately re-renders protected children.
 */
function renderAtPathWithPlainRoot(initialPath: string) {
    render(
        <MemoryRouter initialEntries={[initialPath]}>
            <LocationDisplay />
            <Routes>
                <Route
                    path="/wizard"
                    element={
                        <PreConditions displayHeaderAndFooter>
                            <div data-testid="child-content">Protected Content</div>
                        </PreConditions>
                    }
                />
                <Route
                    path="/create-account"
                    element={
                        <PreConditions displayHeaderAndFooter>
                            <div data-testid="child-content">Protected Content</div>
                        </PreConditions>
                    }
                />
                <Route
                    path="/create-contact"
                    element={
                        <PreConditions displayHeaderAndFooter>
                            <div data-testid="child-content">Protected Content</div>
                        </PreConditions>
                    }
                />
                <Route
                    path="/"
                    element={<div data-testid="root-page">Root Dashboard</div>}
                />
            </Routes>
        </MemoryRouter>,
    );
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('PreConditions state machine', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getBranchModalNotification).mockReturnValue(undefined);
        mockIsAuthenticated = false;
        mockAccountStateDetails = null;
        mockAccountDispatchAvailable = true;
    });

    // ── 1. Unauthenticated ────────────────────────────────────────────────────

    it('1. unauthenticated: renders children without any redirect', () => {
        mockIsAuthenticated = false;
        mockAccountStateDetails = null;
        // No account state → no precondition fires → children render
        renderAt('/some-path');
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    // ── 2-4. redirectToCreateAccount ─────────────────────────────────────────

    it('2. redirectToCreateAccount: navigates to /create-account when org exists and account not created', () => {
        mockIsAuthenticated = true;
        mockAccountStateDetails = {
            ...BASE,
            accountCreationCompleted: false,
            // defaultOrganisationId: 1 from BASE — 1 !== null → redirect fires
        };
        // Start at /some-path → Navigate to /create-account → on /create-account path is suppressed
        renderAt('/some-path');
        // After redirect, current path is /create-account
        expect(screen.getByTestId('current-path').textContent).toBe('/create-account');
        // Children render on /create-account because redirect is suppressed there
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('3. redirectToCreateAccount suppressed: children render when already on /create-account', () => {
        mockIsAuthenticated = true;
        mockAccountStateDetails = {
            ...BASE,
            accountCreationCompleted: false,
            defaultOrganisationId: 1,
        };
        renderAt('/create-account');
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
        expect(screen.getByTestId('current-path').textContent).toBe('/create-account');
    });

    it('4. redirectToCreateAccount not triggered when defaultOrganisationId is exactly null', () => {
        mockIsAuthenticated = true;
        mockAccountStateDetails = {
            ...BASE,
            accountCreationCompleted: false,
            // null === null → condition (defaultOrganisationId !== null) is false → no redirect
            defaultOrganisationId: null as unknown as number,
        };
        // With null orgId: redirectToCreateAccount is false.
        // But redirectToCreateContact: accountContactCompleted=true → false (no redirect).
        // redirectToDashboard: accountCreationCompleted=false → condition false (both must be true).
        // No redirects → children render.
        renderAt('/some-path');
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    // ── 5-7. redirectToCreateContact ─────────────────────────────────────────

    it('5. redirectToCreateContact: navigates to /create-contact when account created but contact not completed', () => {
        mockIsAuthenticated = true;
        mockAccountStateDetails = {
            ...BASE,
            accountCreationCompleted: true,
            accountContactCompleted: false,
        };
        renderAt('/some-path');
        // Navigate fires → lands on /create-contact (suppressed there)
        expect(screen.getByTestId('current-path').textContent).toBe('/create-contact');
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('6. redirectToCreateContact suppressed: children render when on /create-contact', () => {
        mockIsAuthenticated = true;
        mockAccountStateDetails = {
            ...BASE,
            accountCreationCompleted: true,
            accountContactCompleted: false,
        };
        renderAt('/create-contact');
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
        expect(screen.getByTestId('current-path').textContent).toBe('/create-contact');
    });

    it('7. redirectToCreateContact not triggered when on /create-account (create-account path suppresses it)', () => {
        mockIsAuthenticated = true;
        mockAccountStateDetails = {
            ...BASE,
            accountCreationCompleted: true,
            accountContactCompleted: false,
        };
        renderAt('/create-account');
        // redirectToCreateContact has guard: !path.includes('create-account') → suppressed
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
        expect(screen.getByTestId('current-path').textContent).toBe('/create-account');
    });

    // ── 8-9. redirectToDashboard ──────────────────────────────────────────────

    it('8. redirectToDashboard NOT triggered on authenticated app routes when account setup is complete', () => {
        mockIsAuthenticated = true;
        mockAccountStateDetails = {
            ...BASE,
            accountCreationCompleted: true,
            accountContactCompleted: true,
        };
        renderAtPathWithPlainRoot('/wizard');
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
        expect(screen.queryByTestId('root-page')).not.toBeInTheDocument();
        expect(screen.getByTestId('current-path').textContent).toBe('/wizard');
    });

    it('9. redirectToDashboard: completed users are redirected out of /create-account', () => {
        mockIsAuthenticated = true;
        mockAccountStateDetails = {
            ...BASE,
            accountCreationCompleted: true,
            accountContactCompleted: true,
        };
        renderAtPathWithPlainRoot('/create-account');
        expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
        expect(screen.getByTestId('current-path').textContent).toBe('/');
    });

    // ── 10-11. showTermsAndConditions ─────────────────────────────────────────
    //
    // To reach the render branch (where modal is shown), all redirect conditions
    // must be false. Use /dashboard:
    //   - authenticated app routes no longer trigger redirectToDashboard
    //   - redirectToCreateAccount: accountCreationCompleted = true → false
    //   - redirectToCreateContact: accountContactCompleted = true → false
    // NOTE: 'success-creating-account' does NOT contain 'create-account' as substring

    it('10. showTermsAndConditions: TermsAndConditionModal renders when terms not accepted', () => {
        mockIsAuthenticated = true;
        mockAccountStateDetails = {
            ...BASE,
            userAcceptedTermsOfUse: false,
            accountCreationCompleted: true,
            accountContactCompleted: true,
            defaultOrganisationId: 1,
        };
        renderAt('/dashboard');
        expect(screen.getByTestId('terms-modal')).toBeInTheDocument();
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('11. showTermsAndConditions: modal absent when terms accepted', () => {
        mockIsAuthenticated = true;
        mockAccountStateDetails = {
            ...BASE,
            userAcceptedTermsOfUse: true,
            accountCreationCompleted: true,
            accountContactCompleted: true,
            defaultOrganisationId: 1,
        };
        renderAt('/dashboard');
        expect(screen.queryByTestId('terms-modal')).not.toBeInTheDocument();
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    // ── 12-14. autoShowBranchSelector ────────────────────────────────────────
    //
    // autoShowBranchSelector requires:
    //   - authenticated
    //   - terms accepted (userAcceptedTermsOfUse === true)
    //   - defaultOrganisationId === null (exactly null, not undefined)
    //   - accountContactCompleted === true
    //   - !path.includes('success-creating-account')
    //
    // Use authenticated app routes so setup-route redirection does not mask the modal state.

    it('12. autoShowBranchSelector: BranchSelectorModal renders when defaultOrganisationId is null and contact active', () => {
        mockIsAuthenticated = true;
        mockAccountStateDetails = {
            ...BASE,
            userAcceptedTermsOfUse: true,
            // Must be exactly null for: defaultOrganisationId === null
            defaultOrganisationId: null as unknown as number,
            accountCreationCompleted: true,
            accountContactCompleted: true,
        };
        renderAt('/dashboard');
        expect(screen.getByTestId('branch-selector-modal')).toBeInTheDocument();
    });

    it('13. autoShowBranchSelector suppressed when path contains success-creating-account', () => {
        mockIsAuthenticated = true;
        mockAccountStateDetails = {
            ...BASE,
            userAcceptedTermsOfUse: true,
            defaultOrganisationId: null as unknown as number,
            accountCreationCompleted: true,
            accountContactCompleted: true,
        };
        renderAt('/success-creating-account');
        expect(screen.queryByTestId('branch-selector-modal')).not.toBeInTheDocument();
    });

    it('14. autoShowBranchSelector not triggered when defaultOrganisationId is set (not null)', () => {
        mockIsAuthenticated = true;
        mockAccountStateDetails = {
            ...BASE,
            userAcceptedTermsOfUse: true,
            defaultOrganisationId: 1, // not null → autoShowBranchSelector false
            accountCreationCompleted: true,
            accountContactCompleted: true,
        };
        renderAt('/dashboard');
        expect(screen.queryByTestId('branch-selector-modal')).not.toBeInTheDocument();
    });

    it('initializes the branch selector from a persisted notification', () => {
        vi.mocked(getBranchModalNotification).mockReturnValue({
            message: 'Select a branch to continue.',
            severity: NotificationSeverity.Information,
        });
        mockIsAuthenticated = true;
        mockAccountStateDetails = { ...BASE };

        renderAt('/dashboard');

        expect(screen.getByTestId('branch-selector-modal')).toBeInTheDocument();
    });

    // ── 15-16. Layout rendering ───────────────────────────────────────────────
    // Use /create-account to suppress redirectToDashboard.

    it('15. renders with Layout wrapper when displayHeaderAndFooter is true', () => {
        mockIsAuthenticated = true;
        mockAccountStateDetails = {
            ...BASE,
            defaultOrganisationId: 1,
        };
        renderAt('/create-account', true);
        expect(screen.getByTestId('layout')).toBeInTheDocument();
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('16. renders without Layout wrapper when displayHeaderAndFooter is false', () => {
        mockIsAuthenticated = true;
        mockAccountStateDetails = {
            ...BASE,
            defaultOrganisationId: 1,
        };
        renderAt('/create-account', false);
        expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('renders terms and branch modals without the Layout wrapper', () => {
        mockIsAuthenticated = true;
        mockAccountStateDetails = {
            ...BASE,
            userAcceptedTermsOfUse: false,
        };
        const { unmount } = renderAt('/dashboard', false);
        expect(screen.getByTestId('terms-modal')).toBeInTheDocument();
        unmount();

        mockAccountStateDetails = {
            ...BASE,
            defaultOrganisationId: null as unknown as number,
        };
        renderAt('/dashboard', false);
        expect(screen.getByTestId('branch-selector-modal')).toBeInTheDocument();
    });

    it('renders without a merged account when account dispatch is unavailable', () => {
        mockAccountDispatchAvailable = false;
        renderAt('/some-path');
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('17. exposes modal dispatch callbacks to protected route children', () => {
        mockIsAuthenticated = true;
        mockAccountStateDetails = { ...BASE };

        render(
            <MemoryRouter initialEntries={['/dashboard']}>
                <PreConditions displayHeaderAndFooter>
                    <ModalControls />
                </PreConditions>
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Show branch' }));
        expect(screen.getByTestId('branch-selector-modal')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Show delete' }));
        expect(screen.getByTestId('rfq-delete-modal')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Show RFQ branch' }));
        expect(screen.getByTestId('branch-selector-modal')).toBeInTheDocument();
    });
});
