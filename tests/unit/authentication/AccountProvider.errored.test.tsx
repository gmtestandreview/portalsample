import { render, screen, waitFor } from '@testing-library/react';

import '@testing-library/jest-dom/vitest';

import AccountProvider from '../../../ClientApp/src/authentication/AccountProvider';

import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mock setup ────────────────────────────────────────────────────────────────

const mockInstance = {
  acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'test-token' }),
  handleRedirectPromise: vi.fn().mockResolvedValue(null),
  logoutRedirect: vi.fn().mockResolvedValue(undefined),
  getActiveAccount: vi.fn().mockReturnValue(null),
};

vi.mock(
  import('@azure/msal-react'),
  () =>
    ({
      useMsal: vi.fn(() => ({
        inProgress: 'none',
        accounts: [
          {
            homeAccountId: 'test-id',
            idTokenClaims: {
              email: 'test@example.com',
              given_name: 'Test',
              family_name: 'User',
            },
          },
        ],
        instance: mockInstance,
      })),
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(
  import('@azure/msal-browser'),
  () =>
    ({
      InteractionStatus: { None: 'none', Startup: 'startup', Logout: 'logout' },
    }) satisfies __ExactMockModule<__TestMockModule3>,
);

// signIn mock — created once and reused
const mockSignIn = vi.fn().mockRejectedValue(new Error('Network error'));

vi.mock(import('../../../ClientApp/src/api/web-api-client'), () => {
  return {
    UsersClient: class {
      setAuthToken = vi.fn();
      signIn = mockSignIn;
      setUserProfile = vi.fn();
    },
  } satisfies __ExactMockModule<__TestMockModule4>;
});

vi.mock(
  import('../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: { verbose: vi.fn(), error: vi.fn(), trace: vi.fn() },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

vi.mock(
  import('../../../ClientApp/src/storage/targetOrganisation'),
  () =>
    ({
      default: vi.fn(),
      getTargetOrganisation: vi.fn().mockReturnValue(null),
    }) satisfies __ExactMockModule<__TestMockModule6>,
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
  () =>
    ({
      mapToUserProfile: vi.fn().mockReturnValue(undefined),
    }) satisfies __ExactMockModule<__TestMockModule9>,
);

vi.mock(
  import('../../../ClientApp/src/authentication/authConfig'),
  () =>
    ({
      tokenRequest: { scopes: [] },
    }) satisfies __ExactMockModule<__TestMockModule8>,
);

describe('accountProvider — errored state', () => {
  beforeEach(() => {
    // Clear all mock call histories
    vi.clearAllMocks();
    // Reset signIn to reject by default
    mockSignIn.mockClear().mockRejectedValue(new Error('Network error'));
  });
  it('renders children when account loads successfully', async () => {
    expect.assertions(3);
    // Override signIn to succeed for this test
    mockSignIn.mockResolvedValue({
      organisation: {
        name: 'Test Org',
        accountCompleted: true,
        isCompleted: true,
      },
      contact: { isCompleted: true },
      acceptedTerms: true,
      termsVersion: '1',
      defaultOrganisationId: 1,
      employerAbn: '12345678901',
      contactId: 1,
    });

    render(
      <AccountProvider>
        <div data-testid='protected-content'>Protected content</div>
      </AccountProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('protected-content')).toBeInTheDocument(),
    );

    expect(mockSignIn).toHaveBeenCalledWith();
    expect(mockSignIn).toHaveBeenCalledWith({});
  });
});
