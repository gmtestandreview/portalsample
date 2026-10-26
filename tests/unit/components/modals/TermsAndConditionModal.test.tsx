import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TermsAndConditionModal from '../../../../ClientApp/src/components/modals/TermsAndCondition/index';
import type {
  AccountDetails,
  AccountDispatchContext,
  AccountStateContext,
} from '../../../../ClientApp/src/authentication/accountContext';
import type {
  AccountInfo,
  AuthenticationResult,
  SilentRequest,
} from '@azure/msal-browser';

// ── Mock external dependencies ──────────────────────────────────────────────

const mockMsal = vi.hoisted(() => {
  const account: AccountInfo = {
    homeAccountId: 'mock-home-account-id',
    environment: 'login.microsoftonline.com',
    tenantId: 'mock-tenant-id',
    username: 'test@example.com',
    localAccountId: 'mock-local-id',
    name: 'Test User',
  };
  const authenticationResult: AuthenticationResult = {
    authority: 'https://login.microsoftonline.com/mock-tenant',
    uniqueId: 'mock-unique-id',
    tenantId: 'mock-tenant-id',
    scopes: ['mock-scope'],
    account,
    idToken: 'mock-id-token',
    idTokenClaims: {},
    accessToken: 'mock-token',
    fromCache: true,
    expiresOn: null,
    tokenType: 'Bearer',
    correlationId: 'mock-correlation-id',
  };

  return {
    inProgress: 'none',
    account,
    accounts: [account],
    authenticationResult,
    acquireTokenSilent: vi
      .fn<(request: SilentRequest) => Promise<AuthenticationResult>>()
      .mockResolvedValue(authenticationResult),
  };
});

vi.mock(
  '@azure/msal-react',
  () =>
    ({
      useMsal: () => ({
        inProgress: mockMsal.inProgress,
        accounts: mockMsal.accounts,
        instance: {
          acquireTokenSilent: mockMsal.acquireTokenSilent,
        },
      }),
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

const mockSetAgree = vi.fn<() => void>();
const mockDispatch: AccountDispatchContext = {
  setAgree: mockSetAgree,
  setCompleted: vi.fn<AccountDispatchContext['setCompleted']>(),
  setContactCompleted: vi.fn<AccountDispatchContext['setContactCompleted']>(),
  setDefaultOrganisationId:
    vi.fn<AccountDispatchContext['setDefaultOrganisationId']>(),
  setTargetOrganisation:
    vi.fn<AccountDispatchContext['setTargetOrganisation']>(),
  setOrganisationAndBranch:
    vi.fn<AccountDispatchContext['setOrganisationAndBranch']>(),
  setShowBranchSelector:
    vi.fn<AccountDispatchContext['setShowBranchSelector']>(),
  setShowRFQSelectModal:
    vi.fn<AccountDispatchContext['setShowRFQSelectModal']>(),
  setUserProfile: vi
    .fn<AccountDispatchContext['setUserProfile']>()
    .mockResolvedValue(true),
};

const createAccountState = (
  overrides: Partial<AccountDetails> = {},
): AccountStateContext => ({
  details: {
    organisation: 'ACME Corporation',
    trading: 'ACME Corporation',
    branch: 'Sydney Office',
    homeAccountId: 'mock-id',
    userAcceptedTermsOfUse: false,
    accountCreationCompleted: false,
    accountContactCompleted: false,
    currentTermsVersion: '1',
    organisationIsCompleted: false,
    isDefaultOrganisation: false,
    showBranchSelector: false,
    ...overrides,
  },
});

vi.mock(
  import('../../../../ClientApp/src/authentication/hooks'),
  () =>
    ({
      useAccountState: vi.fn<() => AccountStateContext | null>(),
      useAccountDispatch: vi.fn<() => AccountDispatchContext | null>(),
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

// UsersClient must be a constructor (class/function), not an arrow function,
// because the component uses `new UsersClient()`.
const mockAcceptTermsAndCondition = vi
  .fn<() => Promise<void>>()
  .mockResolvedValue(undefined);
const mockSetAuthToken = vi.fn<() => void>();
type MockUsersClient = {
  setAuthToken: typeof mockSetAuthToken;
  acceptTermsAndCondition: typeof mockAcceptTermsAndCondition;
};

vi.mock(
  '../../../../ClientApp/src/api/web-api-client',
  () =>
    ({
      UsersClient: vi.fn<() => void>(function (this: MockUsersClient) {
        this.setAuthToken = mockSetAuthToken;
        this.acceptTermsAndCondition = mockAcceptTermsAndCondition;
      }),
    }) satisfies __ExactMockModule<__TestMockModule4>,
);

vi.mock(
  import('../../../../ClientApp/src/authentication/authConfig'),
  () =>
    ({
      tokenRequest: { scopes: ['api://mock/.default'] },
    }) satisfies __ExactMockModule<__TestMockModule8>,
);

vi.mock(
  import('../../../../ClientApp/src/terms-config.json'),
  () =>
    ({
      default: { TermsVersion: '2' },
    }) satisfies __ExactMockModule<__TestMockModule7>,
);

import {
  useAccountState,
  useAccountDispatch,
} from '../../../../ClientApp/src/authentication/hooks';

// ── Tests ────────────────────────────────────────────────────────────────────

describe(TermsAndConditionModal, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMsal.inProgress = 'none';
    mockMsal.accounts = [mockMsal.account];
    mockMsal.acquireTokenSilent.mockResolvedValue(
      mockMsal.authenticationResult,
    );
    vi.mocked(useAccountDispatch).mockReturnValue(mockDispatch);
    // Restore the default success implementation after clearAllMocks
    mockAcceptTermsAndCondition.mockResolvedValue(undefined);
  });

  it('renders the modal when userAcceptedTermsOfUse is false', () => {
    expect.hasAssertions();
    vi.mocked(useAccountState).mockReturnValue(
      createAccountState({
        givenName: 'Alice',
        familyName: 'Smith',
      }),
    );

    render(<TermsAndConditionModal />);

    expect(
      screen.getByTestId('prompt-termsandcondition-modal'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('termsofuse-heading')).toBeInTheDocument();
  });

  it('does not render the modal when userAcceptedTermsOfUse is true', () => {
    expect.hasAssertions();
    vi.mocked(useAccountState).mockReturnValue(
      createAccountState({
        userAcceptedTermsOfUse: true,
        givenName: 'Alice',
        familyName: 'Smith',
      }),
    );

    render(<TermsAndConditionModal />);

    expect(
      screen.queryByTestId('prompt-termsandcondition-modal'),
    ).not.toBeInTheDocument();
  });

  it('dispatches setAgree after successful ToU acceptance', async () => {
    expect.hasAssertions();
    vi.mocked(useAccountState).mockReturnValue(
      createAccountState({
        givenName: 'Bob',
        familyName: 'Jones',
      }),
    );

    render(<TermsAndConditionModal />);
    fireEvent.click(
      screen.getByRole('button', { name: /agree and continue/i }),
    );

    await waitFor(() => {
      expect(mockSetAgree).toHaveBeenCalledExactlyOnceWith();
    });
  });

  it('sends the auth token and configured terms version when accepting terms', async () => {
    expect.hasAssertions();
    vi.mocked(useAccountState).mockReturnValue(
      createAccountState({
        givenName: 'Bob',
        familyName: 'Jones',
      }),
    );

    render(<TermsAndConditionModal />);
    fireEvent.click(
      screen.getByRole('button', { name: /agree and continue/i }),
    );

    await waitFor(() => {
      expect(mockSetAuthToken).toHaveBeenCalledWith('mock-token');
      expect(mockAcceptTermsAndCondition).toHaveBeenCalledWith({
        termsVersion: 2,
      });
    });
  });

  it('uses the family name only when the given name is not available', () => {
    expect.hasAssertions();
    vi.mocked(useAccountState).mockReturnValue(
      createAccountState({ familyName: 'Solo' }),
    );

    render(<TermsAndConditionModal />);

    expect(
      screen.getByRole('heading', { name: /welcome, solo/i }),
    ).toBeInTheDocument();
  });

  it('renders the exit portal link', () => {
    expect.hasAssertions();
    vi.mocked(useAccountState).mockReturnValue(
      createAccountState({
        givenName: 'Alice',
        familyName: 'Smith',
      }),
    );

    render(<TermsAndConditionModal />);

    expect(
      screen.getByRole('button', { name: /exit portal/i }),
    ).toHaveAttribute('href', '/sign-out');
  });

  it('does not call the API while MSAL is in progress', async () => {
    expect.hasAssertions();
    mockMsal.inProgress = 'login';
    vi.mocked(useAccountState).mockReturnValue(
      createAccountState({
        givenName: 'Alice',
        familyName: 'Smith',
      }),
    );

    render(<TermsAndConditionModal />);
    fireEvent.click(
      screen.getByRole('button', { name: /agree and continue/i }),
    );

    await waitFor(() => {
      expect(mockAcceptTermsAndCondition).not.toHaveBeenCalled();
    });
  });

  it('does not call the API when there is no MSAL account', async () => {
    expect.hasAssertions();
    mockMsal.accounts = [];
    vi.mocked(useAccountState).mockReturnValue(
      createAccountState({
        givenName: 'Alice',
        familyName: 'Smith',
      }),
    );

    render(<TermsAndConditionModal />);
    fireEvent.click(
      screen.getByRole('button', { name: /agree and continue/i }),
    );

    await waitFor(() => {
      expect(mockAcceptTermsAndCondition).not.toHaveBeenCalled();
    });
  });

  it('accepts terms without dispatching when account dispatch is unavailable', async () => {
    expect.hasAssertions();
    vi.mocked(useAccountDispatch).mockReturnValue(null);
    vi.mocked(useAccountState).mockReturnValue(
      createAccountState({
        givenName: 'Bob',
        familyName: 'Jones',
      }),
    );

    render(<TermsAndConditionModal />);
    fireEvent.click(
      screen.getByRole('button', { name: /agree and continue/i }),
    );

    await waitFor(() => {
      expect(mockAcceptTermsAndCondition).toHaveBeenCalledWith({
        termsVersion: 2,
      });
    });

    expect(mockSetAgree).not.toHaveBeenCalled();
  });

  it('shows the error alert when acceptTermsAndCondition API call fails', async () => {
    expect.hasAssertions();
    mockAcceptTermsAndCondition.mockRejectedValueOnce(
      new Error('Network error'),
    );

    vi.mocked(useAccountState).mockReturnValue(
      createAccountState({
        givenName: 'Eve',
        familyName: 'Error',
      }),
    );

    render(<TermsAndConditionModal />);
    fireEvent.click(
      screen.getByRole('button', { name: /agree and continue/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByText(/error found trying to save/i),
      ).toBeInTheDocument();
    });
  });
});
