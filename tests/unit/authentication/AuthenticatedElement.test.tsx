import { render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const authElementMocks = vi.hoisted(() => ({
    isRouteErrorResponse: vi.fn(),
    msalTemplateMode: 'children' satisfies 'children' | 'loading' | 'error',
    msalTemplateProps: undefined as {
        authenticationRequest: unknown;
        errorComponent: ComponentType;
        interactionType: unknown;
        loadingComponent: ComponentType;
    } | undefined,
    routeError: undefined as unknown,
    setActiveAccount: vi.fn(),
}));

vi.mock('@azure/msal-react', () => ({
    MsalAuthenticationTemplate: ({
        authenticationRequest,
        children,
        errorComponent: ErrorComponent,
        interactionType,
        loadingComponent: LoadingComponent,
    }: {
        authenticationRequest: unknown;
        children: ReactNode;
        errorComponent: ComponentType;
        interactionType: unknown;
        loadingComponent: ComponentType;
    }) => {
        authElementMocks.msalTemplateProps = {
            authenticationRequest,
            errorComponent: ErrorComponent,
            interactionType,
            loadingComponent: LoadingComponent,
        };

        if (authElementMocks.msalTemplateMode === 'loading') {
            return <LoadingComponent />;
        }

        if (authElementMocks.msalTemplateMode === 'error') {
            return <ErrorComponent />;
        }

        return <div data-testid="msal-template">{children}</div>;
    },
    useMsal: () => ({
        instance: {
            setActiveAccount: authElementMocks.setActiveAccount,
        },
    }),
}));

vi.mock('@azure/msal-browser', () => ({
    InteractionType: {
        Redirect: 'Redirect',
    },
}));

vi.mock('react-router', () => ({
    isRouteErrorResponse: authElementMocks.isRouteErrorResponse,
    Navigate: ({ to }: { to: string }) => <span data-testid="navigate">{to}</span>,
    useRouteError: () => authElementMocks.routeError,
}));

vi.mock('../../../ClientApp/src/routes/preConditions/PreConditions', () => ({
    default: ({ children, displayHeaderAndFooter }: { children: ReactNode; displayHeaderAndFooter: boolean }) => (
        <section data-header-and-footer={String(displayHeaderAndFooter)} data-testid="preconditions">
            {children}
        </section>
    ),
}));

vi.mock('../../../ClientApp/src/components/ErrorBoundary', () => ({
    default: ({ appInsights, children }: { appInsights: unknown; children: ReactNode }) => (
        <div data-has-app-insights={String(Boolean(appInsights))} data-testid="error-boundary">
            {children}
        </div>
    ),
}));

vi.mock('../../../ClientApp/src/components/BlockUISpinner', () => ({
    default: ({ children }: { children: ReactNode }) => <output>{children}</output>,
}));

vi.mock('../../../ClientApp/src/instrumentation/AppInsightsService', () => ({
    ai: {
        reactPlugin: { name: 'react-plugin' },
    },
}));

vi.mock('../../../ClientApp/src/authentication/authConfig', () => ({
    authRequest: {
        redirectUri: '/redirect',
        scopes: ['read'],
    },
}));

describe('AuthenticatedElement', () => {
    afterEach(() => {
        vi.clearAllMocks();
        authElementMocks.isRouteErrorResponse.mockReset();
        authElementMocks.msalTemplateMode = 'children';
        authElementMocks.msalTemplateProps = undefined;
        authElementMocks.routeError = undefined;
    });

    it('wraps children in preconditions, MSAL authentication, and an error boundary', async () => {
        const { default: AuthenticatedElement } = await import('../../../ClientApp/src/authentication/AuthenticatedElement');

        render(
            <AuthenticatedElement displayHeaderAndFooter={false}>
                <span>Secure content</span>
            </AuthenticatedElement>,
        );

        expect(screen.getByTestId('preconditions')).toHaveAttribute('data-header-and-footer', 'false');
        expect(screen.getByTestId('msal-template')).toBeInTheDocument();
        expect(screen.getByTestId('error-boundary')).toHaveAttribute('data-has-app-insights', 'true');
        expect(screen.getByText('Secure content')).toBeInTheDocument();
        expect(authElementMocks.msalTemplateProps).toMatchObject({
            authenticationRequest: {
                redirectUri: '/redirect',
                scopes: ['read'],
            },
            interactionType: 'Redirect',
        });
    });

    it('passes displayHeaderAndFooter as true by default', async () => {
        const { default: AuthenticatedElement } = await import('../../../ClientApp/src/authentication/AuthenticatedElement');

        render(<AuthenticatedElement />);

        expect(screen.getByTestId('preconditions')).toHaveAttribute('data-header-and-footer', 'true');
    });

    it('renders the logging in loading component for MSAL loading state', async () => {
        authElementMocks.msalTemplateMode = 'loading';
        const { default: AuthenticatedElement } = await import('../../../ClientApp/src/authentication/AuthenticatedElement');

        render(<AuthenticatedElement />);

        expect(screen.getByRole('status')).toHaveTextContent('Logging in...');
    });

    it('redirects 404 route errors to the not found route', async () => {
        authElementMocks.msalTemplateMode = 'error';
        authElementMocks.routeError = { status: 404 };
        authElementMocks.isRouteErrorResponse.mockReturnValue(true);
        const { default: AuthenticatedElement } = await import('../../../ClientApp/src/authentication/AuthenticatedElement');

        render(<AuthenticatedElement />);

        expect(authElementMocks.setActiveAccount).toHaveBeenCalledWith(null);
        expect(screen.getByTestId('navigate')).toHaveTextContent('/not-found');
    });

    it('redirects non-404 route errors to the server error route', async () => {
        authElementMocks.msalTemplateMode = 'error';
        authElementMocks.routeError = { status: 500 };
        authElementMocks.isRouteErrorResponse.mockReturnValue(true);
        const { default: AuthenticatedElement } = await import('../../../ClientApp/src/authentication/AuthenticatedElement');

        render(<AuthenticatedElement />);

        expect(authElementMocks.setActiveAccount).toHaveBeenCalledWith(null);
        expect(screen.getByTestId('navigate')).toHaveTextContent('/server-error');
    });

    it('redirects non-route errors to the home route', async () => {
        authElementMocks.msalTemplateMode = 'error';
        authElementMocks.routeError = new Error('Auth failed');
        authElementMocks.isRouteErrorResponse.mockReturnValue(false);
        const { default: AuthenticatedElement } = await import('../../../ClientApp/src/authentication/AuthenticatedElement');

        render(<AuthenticatedElement />);

        expect(authElementMocks.setActiveAccount).toHaveBeenCalledWith(null);
        expect(screen.getByTestId('navigate')).toHaveTextContent('/');
    });
});
