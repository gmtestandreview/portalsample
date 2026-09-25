import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    createRoot: vi.fn(),
    render: vi.fn(),
    createPublicClientApplication: vi.fn().mockResolvedValue({ client: 'pca' }),
    createTrustedTypePolicy: vi.fn(),
}));

vi.mock('react-dom/client', () => ({
    createRoot: mocks.createRoot,
}));

vi.mock('@azure/msal-browser', () => ({
    PublicClientApplication: {
        createPublicClientApplication: mocks.createPublicClientApplication,
    },
}));

vi.mock('@azure/msal-react', () => ({
    MsalProvider: ({ children }: { children: React.ReactNode }) => <section data-testid='msal-provider'>{children}</section>,
}));

vi.mock('react-router/dom', () => ({
    RouterProvider: () => <main>Router provider</main>,
}));

vi.mock('../../../ClientApp/src/authentication/AccountProvider', () => ({
    default: ({ children }: { children: React.ReactNode }) => <section data-testid='account-provider'>{children}</section>,
}));

vi.mock('../../../ClientApp/src/authentication/authConfig', () => ({
    configuration: { auth: { clientId: 'client-id' } },
}));

vi.mock('../../../ClientApp/src/App', () => ({
    default: { routes: [] },
}));

vi.mock('../../../ClientApp/src/trustedtypes', () => ({
    TrustedTypes: {
        createTrustedTypePolicy: mocks.createTrustedTypePolicy,
    },
}));

vi.mock('../../../ClientApp/src/components/ErrorBoundary', () => ({
    default: ({ children }: { children: React.ReactNode }) => <section data-testid='error-boundary'>{children}</section>,
}));

vi.mock('../../../ClientApp/src/instrumentation/AppInsightsService', () => ({
    ai: {
        reactPlugin: { plugin: 'app-insights' },
    },
}));

describe('application bootstrap', () => {
    it('creates the root, initializes MSAL, installs Trusted Types, and renders providers', async () => {
        vi.resetModules();
        document.body.innerHTML = '<div id="root"></div>';
        mocks.createRoot.mockReturnValue({ render: mocks.render });

        await import('../../../ClientApp/src/index');

        expect(mocks.createRoot).toHaveBeenCalledWith(document.getElementById('root'));
        expect(mocks.createPublicClientApplication).toHaveBeenCalledWith({ auth: { clientId: 'client-id' } });
        expect(mocks.createTrustedTypePolicy).toHaveBeenCalled();
        expect(mocks.render).toHaveBeenCalledWith(expect.any(Object));
    });

    it('wraps the entire application in React Strict Mode', async () => {
        vi.resetModules();
        document.body.innerHTML = '<div id="root"></div>';
        mocks.createRoot.mockReturnValue({ render: mocks.render });

        await import('../../../ClientApp/src/index');

        expect(mocks.render).toHaveBeenCalledWith(
            expect.objectContaining({ type: StrictMode }),
        );
    });
});
