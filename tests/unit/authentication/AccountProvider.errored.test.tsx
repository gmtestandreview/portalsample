import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type {
  AccountInfo,
  AuthenticationResult,
  IPublicClientApplication,
} from '@azure/msal-browser';
import type * as MsalBrowserModule from '@azure/msal-browser';
import type * as MsalReactModule from '@azure/msal-react';
import AccountProvider from '../../../ClientApp/src/authentication/AccountProvider';
import type { UsersClient } from '../../../ClientApp/src/api/web-api-client';
import type * as WebApiModule from '../../../ClientApp/src/api/web-api-client';
import type * as AppLoggerModule from '../../../ClientApp/src/instrumentation/AppLogger';
import { vi, describe, it, expect } from 'vitest';
import type * as TargetOrganisationModule from '../../../ClientApp/src/storage/targetOrganisation';
import type * as HelperFunctionsModule from '../../../ClientApp/src/routes/common/helperFunctions';
import type * as AuthConfigModule from '../../../ClientApp/src/authentication/authConfig';

// ── Mock setup ────────────────────────────────────────────────────────────────

const { appLoggerMocks, mockInstance, mockSignIn } = vi.hoisted(() => {
  const instance = {
    acquireTokenSilent: vi
      .fn<IPublicClientApplication['acquireTokenSilent']>()
      .mockResolvedValue({
        authority: 'https://login.microsoftonline.com/tenant-id',
        uniqueId: 'unique-id',
        tenantId: 'tenant-id',
        scopes: ['scope'],
        account: {
          homeAccountId: 'account-id',
          environment: 'login.microsoftonline.com',
          tenantId: 'tenant-id',
          username: 'test@example.com',
          localAccountId: 'local-account-id',
        } satisfies AccountInfo,
        idToken: 'id-token',
        idTokenClaims: {},
        accessToken: 'test-token',
        fromCache: false,
        expiresOn: null,
        tokenType: 'Bearer',
        correlationId: 'correlation-id',
      } satisfies AuthenticationResult & { account: AccountInfo }),
    handleRedirectPromise: vi
      .fn<IPublicClientApplication['handleRedirectPromise']>()
      .mockResolvedValue(null),
    logoutRedirect: vi
      .fn<IPublicClientApplication['logoutRedirect']>()
      .mockResolvedValue(undefined),
    getActiveAccount: vi
      .fn<IPublicClientApplication['getActiveAccount']>()
      .mockReturnValue(null),
  };

  return {
    appLoggerMocks: {
      verbose: vi.fn<(typeof AppLoggerModule)['default']['verbose']>(),
      error: vi.fn<(typeof AppLoggerModule)['default']['error']>(),
      trace: vi.fn<(typeof AppLoggerModule)['default']['trace']>(),
    },
    mockInstance: instance,
    mockSignIn: vi
      .fn<UsersClient['signIn']>()
      .mockRejectedValue(new Error('Network error')),
  };
});

vi.mock(import('@azure/msal-react'), async (importOriginal) => {
  const original = await importOriginal();
  const msalBrowser = await import('@azure/msal-browser');
  const instance = new msalBrowser.PublicClientApplication({
    auth: { clientId: 'test-client-id' },
  });
  instance.acquireTokenSilent = mockInstance.acquireTokenSilent;
  instance.handleRedirectPromise = mockInstance.handleRedirectPromise;
  instance.logoutRedirect = mockInstance.logoutRedirect;
  instance.getActiveAccount = mockInstance.getActiveAccount;

  const context = {
    inProgress: msalBrowser.InteractionStatus.None,
    accounts: [
      {
        homeAccountId: 'test-id',
        environment: 'login.microsoftonline.com',
        tenantId: 'tenant-id',
        username: 'test@example.com',
        localAccountId: 'local-account-id',
        idTokenClaims: {
          email: 'test@example.com',
          given_name: 'Test',
          family_name: 'User',
        },
      },
    ],
    instance,
    logger: new msalBrowser.Logger({ loggerCallback: () => undefined }),
  } satisfies ReturnType<(typeof MsalReactModule)['useMsal']>;

  return {
    ...original,
    useMsal: vi
      .fn<(typeof MsalReactModule)['useMsal']>()
      .mockReturnValue(context),
  } satisfies Partial<typeof MsalReactModule>;
});

vi.mock(import('@azure/msal-browser'), async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    InteractionStatus: { ...original.InteractionStatus },
  } satisfies Partial<typeof MsalBrowserModule>;
});

vi.mock(
  import('../../../ClientApp/src/api/web-api-client'),
  async (importOriginal) => {
    const original = await importOriginal();
    class MockUsersClient extends original.UsersClient {
      override setAuthToken = vi.fn<UsersClient['setAuthToken']>();
      override signIn = mockSignIn;
      override setUserProfile = vi.fn<UsersClient['setUserProfile']>();
    }

    return {
      ...original,
      UsersClient: MockUsersClient,
    } satisfies Partial<typeof WebApiModule>;
  },
);

vi.mock(
  import('../../../ClientApp/src/instrumentation/AppLogger'),
  async (importOriginal) => {
    const original = await importOriginal();
    class MockAppLogger extends original.default {
      static override verbose = appLoggerMocks.verbose;
      static override error = appLoggerMocks.error;
      static override trace = appLoggerMocks.trace;
    }

    return {
      ...original,
      default: MockAppLogger,
    } satisfies Partial<typeof AppLoggerModule>;
  },
);

vi.mock(
  import('../../../ClientApp/src/storage/targetOrganisation'),
  async (importOriginal) => {
    const original = await importOriginal();
    return {
      ...original,
      default: vi.fn<typeof TargetOrganisationModule.default>(),
      getTargetOrganisation:
        vi.fn<typeof TargetOrganisationModule.getTargetOrganisation>(),
    } satisfies Partial<typeof TargetOrganisationModule>;
  },
);

vi.mock(
  import('../../../ClientApp/src/terms-config.json'),
  () =>
    ({
      default: { TermsVersion: '1' },
    }) satisfies __ExactMockModule<__TestMockModule7>,
);

vi.mock(
  import('../../../ClientApp/src/routes/common/helperFunctions'),
  async (importOriginal) => {
    const original = await importOriginal();
    return {
      ...original,
      mapToUserProfile: vi.fn<typeof original.mapToUserProfile>(),
    } satisfies Partial<typeof HelperFunctionsModule>;
  },
);

vi.mock(
  import('../../../ClientApp/src/authentication/authConfig'),
  async (importOriginal) => {
    const original = await importOriginal();
    return {
      ...original,
      tokenRequest: { ...original.tokenRequest, scopes: [] },
    } satisfies Partial<typeof AuthConfigModule>;
  },
);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('accountProvider — errored state', () => {
  const resetErroredMocks = () => {
    // Clear all mock call histories
    vi.clearAllMocks();
    // Reset signIn to reject by default
    mockSignIn.mockClear().mockRejectedValue(new Error('Network error'));
  };

  it('renders children when account loads successfully', async () => {
    expect.hasAssertions();

    resetErroredMocks();

    // Override signIn to succeed for this test
    mockSignIn.mockResolvedValue({
      organisation: {
        name: 'Test Org',
        accountCompleted: true,
        isCompleted: true,
      },
      contact: { isCompleted: true },
      acceptedTerms: true,
      termsVersion: 1,
      defaultOrganisationId: 1,
      employerAbn: '12345678901',
      contactId: 1,
    });

    render(
      <AccountProvider>
        <div data-testid='protected-content'>Protected content</div>
      </AccountProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    expect(mockSignIn).toHaveBeenCalledWith({});
  });

  it('shows an error message and does NOT render children when account load fails', async () => {
    expect.hasAssertions();

    resetErroredMocks();

    render(
      <AccountProvider>
        <div data-testid='protected-content'>Protected content</div>
      </AccountProvider>,
    );

    // Wait for the error state to be set (loading spinner disappears)
    await waitFor(() => {
      // Check if logoutRedirect was called (which happens in the error handler)
      expect(mockInstance.logoutRedirect).toHaveBeenCalledWith({
        account: null,
      });
    });

    // The error message should be displayed
    expect(
      screen.getByText(/Unable to load account details/i),
    ).toBeInTheDocument();

    // Protected content must NOT be visible while errored
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

    // Verify that logoutRedirect was called to handle the error
    expect(mockInstance.logoutRedirect).toHaveBeenCalledWith({
      account: null,
    });
  });

  it('still requests logout when redirect response handling fails', async () => {
    expect.hasAssertions();

    resetErroredMocks();

    mockInstance.handleRedirectPromise.mockRejectedValueOnce(
      new Error('redirect response failed'),
    );

    render(
      <AccountProvider>
        <div data-testid='protected-content'>Protected content</div>
      </AccountProvider>,
    );

    await waitFor(() => {
      expect(mockInstance.logoutRedirect).toHaveBeenCalledWith({
        account: null,
      });
    });

    expect(
      screen.getByText(/Unable to load account details/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('keeps the recoverable error state when logout redirect rejects', async () => {
    expect.hasAssertions();

    resetErroredMocks();

    mockInstance.logoutRedirect.mockRejectedValueOnce(
      new Error('logout redirect failed'),
    );

    render(
      <AccountProvider>
        <div data-testid='protected-content'>Protected content</div>
      </AccountProvider>,
    );

    await waitFor(() => {
      expect(mockInstance.logoutRedirect).toHaveBeenCalledWith({
        account: null,
      });
    });

    expect(
      screen.getByText(/Unable to load account details/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
});
