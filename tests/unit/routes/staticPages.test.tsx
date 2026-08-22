import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserUtils, InteractionStatus } from '@azure/msal-browser';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import type * as MsalBrowserModule from '@azure/msal-browser';
import FAQs from '../../../ClientApp/src/routes/help-guide/faqs';
import HelpGuide from '../../../ClientApp/src/routes/help-guide';
import HelpHowToSetupAccess from '../../../ClientApp/src/routes/help-guide/how-to-setup-access';
import ServicesWeOffer from '../../../ClientApp/src/routes/services-we-offer';
import SignIn from '../../../ClientApp/src/routes/sign-in';
import Signout from '../../../ClientApp/src/routes/sign-out';
import SignoutHelper from '../../../ClientApp/src/routes/sign-out-helper';
import { clearTargetOrganisation } from '../../../ClientApp/src/storage/targetOrganisation';

const mocks = vi.hoisted(() => ({
    useIsAuthenticated: vi.fn(),
    useMsal: vi.fn(),
    handleRedirectPromise: vi.fn(),
    logoutRedirect: vi.fn(),
    getActiveAccount: vi.fn(),
    clearTargetOrganisation: vi.fn(),
    isInIframe: vi.fn(),
    useAccountContext: vi.fn(),
    useAccountDispatch: vi.fn(),
}));

vi.mock('@azure/msal-react', () => ({
    useIsAuthenticated: mocks.useIsAuthenticated,
    useMsal: mocks.useMsal,
}));

vi.mock('@azure/msal-browser', async (importOriginal) => {
    const actual = await importOriginal<typeof MsalBrowserModule>();
    return {
        ...actual,
        BrowserUtils: {
            ...actual.BrowserUtils,
            isInIframe: mocks.isInIframe,
        },
    };
});

vi.mock('../../../ClientApp/src/storage/targetOrganisation', () => ({
    clearTargetOrganisation: mocks.clearTargetOrganisation,
}));

vi.mock('../../../ClientApp/src/authentication/hooks', () => ({
    default: mocks.useAccountContext,
    useAccountDispatch: mocks.useAccountDispatch,
}));

const renderRoute = (ui: React.ReactNode) => render(
    <MemoryRouter>
        {ui}
    </MemoryRouter>,
);

describe('static route pages', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.className = '';
        document.title = '';
        mocks.useIsAuthenticated.mockReturnValue(false);
        mocks.useMsal.mockReturnValue({
            instance: {
                handleRedirectPromise: mocks.handleRedirectPromise.mockResolvedValue(undefined),
                logoutRedirect: mocks.logoutRedirect.mockResolvedValue(undefined),
                getActiveAccount: mocks.getActiveAccount.mockReturnValue({ homeAccountId: 'account-1' }),
            },
            accounts: [],
            inProgress: InteractionStatus.None,
        });
        mocks.useAccountContext.mockReturnValue({
            details: {
                userProfile: {
                    services: [],
                },
            },
        });
        mocks.useAccountDispatch.mockReturnValue({
            setUserProfile: vi.fn(),
        });
        mocks.isInIframe.mockReturnValue(false);
    });

    it('renders HelpGuide for unauthenticated users with home navigation', () => {
        renderRoute(<HelpGuide />);

        expect(screen.getByRole('heading', { name: 'Help guide', level: 1 })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /How to set up access/i })).toHaveAttribute('href', '/help-guide/how-to-setup-access');
        expect(screen.getByRole('link', { name: /Frequently Asked Questions/i })).toHaveAttribute('href', '/help-guide/faqs');
        expect(screen.getByRole('link', { name: /Give us your feedback/i })).toHaveAttribute('target', '_blank');
        expect(screen.getByRole('link', { name: /Back to home/i })).toHaveAttribute('href', '/');
        expect(document.title).toBe('Help guide | NMI Services portal');
        expect(document.body).toHaveClass('help-guide');
    });

    it('renders HelpGuide dashboard navigation for authenticated users', () => {
        vi.mocked(useIsAuthenticated).mockReturnValue(true);

        renderRoute(<HelpGuide />);

        expect(screen.getByRole('link', { name: /Back to dashboard/i })).toHaveAttribute('href', '/dashboard');
    });

    it('renders FAQ and setup guide help pages with table-of-contents links', () => {
        const { unmount } = renderRoute(<FAQs />);

        expect(screen.getByRole('heading', { name: 'Frequently Asked Questions (FAQs)', level: 1 })).toBeInTheDocument();
        expect(screen.getByRole('navigation', { name: 'On this page' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Portal benefits' })).toHaveAttribute('href', '#faqs-01');
        expect(screen.getByRole('link', { name: /Back to help guide/i })).toHaveAttribute('href', '/help-guide');
        unmount();

        renderRoute(<HelpHowToSetupAccess />);

        expect(screen.getByRole('heading', { name: /How to set up access to the .*NMI Services portal/i, level: 1 })).toBeInTheDocument();
        expect(screen.getByRole('navigation', { name: 'On this page' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /View FAQs/i })).toHaveAttribute('href', '/help-guide/faqs/');
    });

    it('renders services offered and the simple sign-in/helper pages', () => {
        const { unmount } = renderRoute(<ServicesWeOffer />);

        expect(screen.getByRole('heading', { name: 'Services we offer', level: 1 })).toBeInTheDocument();
        expect(screen.getByRole('group', {
            name: /Set your default view and\/or add more NMI services/i,
        })).toBeInTheDocument();
        expect(document.title).toBe('Services we offer | NMI Services portal');
        expect(document.body).toHaveClass('services-we-offer');
        unmount();

        render(<SignIn />);
        expect(screen.getByRole('heading', { name: 'Logging in...' })).toBeInTheDocument();

        unmount();
        renderRoute(<SignoutHelper />);
        expect(screen.getByRole('heading', { name: /close your browser window/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Exit portal' })).toHaveAttribute('href', 'https://measurement.gov.au');
    });

    it('runs sign-out redirect when MSAL is idle and not inside an iframe', async () => {
        render(<Signout />);

        expect(screen.getByText('Logging out...')).toBeInTheDocument();
        await waitFor(() => expect(mocks.handleRedirectPromise).toHaveBeenCalled());
        expect(clearTargetOrganisation).toHaveBeenCalled();
        expect(mocks.logoutRedirect).toHaveBeenCalledWith({
            account: { homeAccountId: 'account-1' },
            onRedirectNavigate: expect.any(Function),
        });

        const options = mocks.logoutRedirect.mock.calls[0][0];
        expect(options.onRedirectNavigate()).toBe(true);
        expect(BrowserUtils.isInIframe).toHaveBeenCalled();
    });

    it('skips sign-out redirect while an interaction is already running', async () => {
        vi.mocked(useMsal).mockReturnValue({
            instance: {
                handleRedirectPromise: mocks.handleRedirectPromise.mockResolvedValue(undefined),
                logoutRedirect: mocks.logoutRedirect.mockResolvedValue(undefined),
                getActiveAccount: mocks.getActiveAccount,
            },
            inProgress: InteractionStatus.Login,
        } as unknown as ReturnType<typeof useMsal>);

        render(<Signout />);

        await waitFor(() => expect(mocks.handleRedirectPromise).toHaveBeenCalled());
        expect(mocks.logoutRedirect).not.toHaveBeenCalled();
        expect(clearTargetOrganisation).toHaveBeenCalled();
    });

    it('does not restart sign-out after the effect has been cleaned up', async () => {
        const { rerender } = render(<Signout />);
        await waitFor(() => expect(mocks.handleRedirectPromise).toHaveBeenCalledTimes(1));

        vi.mocked(useMsal).mockReturnValue({
            instance: {
                handleRedirectPromise: mocks.handleRedirectPromise,
                logoutRedirect: mocks.logoutRedirect,
                getActiveAccount: mocks.getActiveAccount,
            },
            inProgress: InteractionStatus.Login,
        } as unknown as ReturnType<typeof useMsal>);
        rerender(<Signout />);

        await waitFor(() => expect(mocks.handleRedirectPromise).toHaveBeenCalledTimes(1));
        expect(clearTargetOrganisation).toHaveBeenCalledTimes(1);
    });
});
