import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { createStandardPublicClientApplication as CreateStandardPublicClientApplication } from '@azure/msal-browser';
import type { hydrateRoot as HydrateRoot } from 'react-dom/client';

const mocks = vi.hoisted(() => ({
  hydrateRoot: vi.fn<(...args: unknown[]) => unknown>(),
  createStandardPublicClientApplication: vi
    .fn<(...args: unknown[]) => unknown>()
    .mockResolvedValue({ client: 'pca' }),
  createTrustedTypePolicy: vi.fn<(...args: unknown[]) => unknown>(),
}));

vi.mock(
  import('react-dom/client') as unknown as string,
  () =>
    ({
      hydrateRoot: mocks.hydrateRoot as unknown as typeof HydrateRoot,
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
      HydratedRouter: () => <main>Hydrated router</main>,
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

describe('framework client bootstrap', () => {
  it('initializes MSAL and Trusted Types before hydrating the document', async () => {
    expect.hasAssertions();

    vi.resetModules();

    await import('../../../ClientApp/src/entry.client');

    expect(mocks.createStandardPublicClientApplication).toHaveBeenCalledWith({
      auth: { clientId: 'client-id' },
    });
    expect(mocks.createTrustedTypePolicy).toHaveBeenCalledWith();
    expect(mocks.hydrateRoot).toHaveBeenCalledWith(
      document,
      expect.any(Object),
    );
  });

  it('wraps the hydrated router in Strict Mode', async () => {
    expect.hasAssertions();

    vi.resetModules();

    await import('../../../ClientApp/src/entry.client');

    const [, application] = mocks.hydrateRoot.mock.calls[0] ?? [];

    expect(application).toStrictEqual(
      expect.objectContaining({ type: StrictMode }),
    );
  });
});
