import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createRoot: vi.fn(),
  render: vi.fn(),
  createStandardPublicClientApplication: vi
    .fn()
    .mockResolvedValue({ client: 'pca' }),
  createTrustedTypePolicy: vi.fn(),
}));

vi.mock(import('react-dom/client'), () => ({
  createRoot: mocks.createRoot,
}));

vi.mock(import('@azure/msal-browser'), () => ({
  createStandardPublicClientApplication:
    mocks.createStandardPublicClientApplication,
}));

vi.mock(import('@azure/msal-react'), () => ({
  MsalProvider: ({ children }: { children: React.ReactNode }) => (
    <section data-testid='msal-provider'>{children}</section>
  ),
}));

vi.mock(import('react-router/dom'), () => ({
  RouterProvider: () => <main>Router provider</main>,
}));

vi.mock(
  import('../../../ClientApp/src/authentication/AccountProvider'),
  () => ({
    default: ({ children }: { children: React.ReactNode }) => (
      <section data-testid='account-provider'>{children}</section>
    ),
  })
);

vi.mock(import('../../../ClientApp/src/authentication/authConfig'), () => ({
  configuration: { auth: { clientId: 'client-id' } },
}));

vi.mock(import('../../../ClientApp/src/App'), () => ({
  default: { routes: [] },
}));

vi.mock(import('../../../ClientApp/src/trustedtypes'), () => ({
  TrustedTypes: {
    createTrustedTypePolicy: mocks.createTrustedTypePolicy,
  },
}));

vi.mock(import('../../../ClientApp/src/components/ErrorBoundary'), () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <section data-testid='error-boundary'>{children}</section>
  ),
}));

vi.mock(
  import('../../../ClientApp/src/instrumentation/AppInsightsService'),
  () => ({
    ai: {
      reactPlugin: { plugin: 'app-insights' },
    },
  })
);

describe('application bootstrap', () => {
  it('creates the root, initializes MSAL, installs Trusted Types, and renders providers', async () => {
    vi.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
    mocks.createRoot.mockReturnValue({ render: mocks.render });

    await import('../../../ClientApp/src/index');

    expect(mocks.createRoot).toHaveBeenCalledWith(
      document.getElementById('root')
    );
    expect(mocks.createStandardPublicClientApplication).toHaveBeenCalledWith({
      auth: { clientId: 'client-id' },
    });
    expect(mocks.createTrustedTypePolicy).toHaveBeenCalledWith();
    expect(mocks.render).toHaveBeenCalledWith(expect.any(Object));
  });

  it('wraps the entire application in React Strict Mode', async () => {
    vi.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
    mocks.createRoot.mockReturnValue({ render: mocks.render });

    await import('../../../ClientApp/src/index');

    expect(mocks.render).toHaveBeenCalledWith(
      expect.objectContaining({ type: StrictMode })
    );
  });
});
