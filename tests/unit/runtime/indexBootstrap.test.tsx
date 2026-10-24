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

vi.mock(
  import('react-dom/client'),
  () =>
    ({
      createRoot: mocks.createRoot,
    }) satisfies __ExactMockModule<__TestMockModule154>
);

vi.mock(
  import('@azure/msal-browser'),
  () =>
    ({
      createStandardPublicClientApplication:
        mocks.createStandardPublicClientApplication,
    }) satisfies __ExactMockModule<__TestMockModule3>
);

vi.mock(
  import('@azure/msal-react'),
  () =>
    ({
      MsalProvider: ({ children }: { children: React.ReactNode }) => (
        <section data-testid='msal-provider'>{children}</section>
      ),
    }) satisfies __ExactMockModule<__TestMockModule2>
);

vi.mock(
  import('react-router/dom'),
  () =>
    ({
      RouterProvider: () => <main>Router provider</main>,
    }) satisfies __ExactMockModule<__TestMockModule155>
);

vi.mock(
  import('../../../ClientApp/src/authentication/AccountProvider'),
  () =>
    ({
      default: ({ children }: { children: React.ReactNode }) => (
        <section data-testid='account-provider'>{children}</section>
      ),
    }) satisfies __ExactMockModule<__TestMockModule156>
);

vi.mock(
  import('../../../ClientApp/src/authentication/authConfig'),
  () =>
    ({
      configuration: { auth: { clientId: 'client-id' } },
    }) satisfies __ExactMockModule<__TestMockModule8>
);

vi.mock(
  import('../../../ClientApp/src/App'),
  () =>
    ({
      default: { routes: [] },
    }) satisfies __ExactMockModule<__TestMockModule157>
);

vi.mock(
  import('../../../ClientApp/src/trustedtypes'),
  () =>
    ({
      TrustedTypes: {
        createTrustedTypePolicy: mocks.createTrustedTypePolicy,
      },
    }) satisfies __ExactMockModule<__TestMockModule158>
);

vi.mock(
  import('../../../ClientApp/src/components/ErrorBoundary'),
  () =>
    ({
      default: ({ children }: { children: React.ReactNode }) => (
        <section data-testid='error-boundary'>{children}</section>
      ),
    }) satisfies __ExactMockModule<__TestMockModule13>
);

vi.mock(
  import('../../../ClientApp/src/instrumentation/AppInsightsService'),
  () =>
    ({
      ai: {
        reactPlugin: { plugin: 'app-insights' },
      },
    }) satisfies __ExactMockModule<__TestMockModule15>
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
