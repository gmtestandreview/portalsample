import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { createStandardPublicClientApplication as CreateStandardPublicClientApplication } from '@azure/msal-browser';
import type { createRoot as CreateRoot } from 'react-dom/client';

const mocks = vi.hoisted(() => ({
  createRoot: vi.fn<(...args: unknown[]) => unknown>(),
  render: vi.fn<(...args: unknown[]) => unknown>(),
  createStandardPublicClientApplication: vi
    .fn<(...args: unknown[]) => unknown>()
    .mockResolvedValue({ client: 'pca' }),
  createTrustedTypePolicy: vi.fn<(...args: unknown[]) => unknown>(),
}));

vi.mock(
  import('react-dom/client') as unknown as string,
  () =>
    ({
      createRoot: mocks.createRoot as unknown as typeof CreateRoot,
    }) satisfies __ExactMockModule<__TestMockModule154>,
);

vi.mock(
  import('@azure/msal-browser') as unknown as string,
  () =>
    ({
      createStandardPublicClientApplication:
        mocks.createStandardPublicClientApplication as unknown as typeof CreateStandardPublicClientApplication,
    }) satisfies __ExactMockModule<__TestMockModule3>,
);

vi.mock(
  import('@azure/msal-react') as unknown as string,
  () =>
    ({
      MsalProvider: ({ children }: { children: React.ReactNode }) => (
        <section data-testid='msal-provider'>{children}</section>
      ),
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(
  import('react-router/dom') as unknown as string,
  () =>
    ({
      RouterProvider: () => <main>Router provider</main>,
    }) satisfies __ExactMockModule<__TestMockModule155>,
);

vi.mock(
  import('../../../ClientApp/src/authentication/AccountProvider') as unknown as string,
  () =>
    ({
      default: ({ children }: { children: React.ReactNode }) => (
        <section data-testid='account-provider'>{children}</section>
      ),
    }) satisfies __ExactMockModule<__TestMockModule156>,
);

vi.mock(
  import('../../../ClientApp/src/authentication/authConfig') as unknown as string,
  () =>
    ({
      configuration: { auth: { clientId: 'client-id' } },
    }) satisfies __ExactMockModule<__TestMockModule8>,
);

vi.mock(
  import('../../../ClientApp/src/App') as unknown as string,
  () =>
    ({
      default: { routes: [] },
    }) satisfies __ExactMockModule<__TestMockModule157>,
);

vi.mock(
  import('../../../ClientApp/src/trustedtypes') as unknown as string,
  () =>
    ({
      TrustedTypes: {
        createTrustedTypePolicy: mocks.createTrustedTypePolicy,
      },
    }) satisfies __ExactMockModule<__TestMockModule158>,
);

vi.mock(
  import('../../../ClientApp/src/components/ErrorBoundary') as unknown as string,
  () =>
    ({
      default: ({ children }: { children: React.ReactNode }) => (
        <section data-testid='error-boundary'>{children}</section>
      ),
    }) satisfies __ExactMockModule<__TestMockModule13>,
);

vi.mock(
  import('../../../ClientApp/src/instrumentation/AppInsightsService') as unknown as string,
  () =>
    ({
      ai: {
        reactPlugin: { plugin: 'app-insights' },
      },
    }) satisfies __ExactMockModule<__TestMockModule15>,
);

describe('application bootstrap', () => {
  it('creates the root, initializes MSAL, installs Trusted Types, and renders providers', async () => {
    expect.hasAssertions();

    vi.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
    mocks.createRoot.mockReturnValue({ render: mocks.render });

    await import('../../../ClientApp/src/index');

    expect(mocks.createRoot).toHaveBeenCalledWith(
      document.getElementById('root'),
    );
    expect(mocks.createStandardPublicClientApplication).toHaveBeenCalledWith({
      auth: { clientId: 'client-id' },
    });
    expect(mocks.createTrustedTypePolicy).toHaveBeenCalledWith();
    expect(mocks.render).toHaveBeenCalledWith(expect.any(Object));
  });

  it('wraps the entire application in React Strict Mode', async () => {
    expect.hasAssertions();

    vi.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
    mocks.createRoot.mockReturnValue({ render: mocks.render });

    await import('../../../ClientApp/src/index');

    expect(mocks.render).toHaveBeenCalledWith(
      expect.objectContaining({ type: StrictMode }),
    );
  });
});
