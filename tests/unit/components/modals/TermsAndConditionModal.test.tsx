import { describe, it, expect, vi, beforeEach } from 'vitest';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import TermsAndConditionModal from '../../../../ClientApp/src/components/modals/TermsAndCondition/index';

// ── Mock external dependencies ──────────────────────────────────────────────

const mockMsal = vi.hoisted(() => ({
  inProgress: 'none',
  accounts: [{ username: 'test@example.com' }],
  acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'mock-token' }),
}));

vi.mock(
  import('@azure/msal-react'),
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

const mockSetAgree = vi.fn();

const mockDispatch = { setAgree: mockSetAgree };

vi.mock(
  import('../../../../ClientApp/src/authentication/hooks'),
  () =>
    ({
      useAccountState: vi.fn(),
      useAccountDispatch: vi.fn(),
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

// UsersClient must be a constructor (class/function), not an arrow function,
// because the component uses `new UsersClient()`.
const mockAcceptTermsAndCondition = vi.fn().mockResolvedValue(undefined);

const mockSetAuthToken = vi.fn();

vi.mock(
  import('../../../../ClientApp/src/api/web-api-client'),
  () =>
    ({
      UsersClient: vi.fn(function (this: any) {
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

describe(TermsAndConditionModal, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMsal.inProgress = 'none';
    mockMsal.accounts = [{ username: 'test@example.com' }];
    mockMsal.acquireTokenSilent.mockResolvedValue({
      accessToken: 'mock-token',
    });
    vi.mocked(useAccountDispatch).mockReturnValue(mockDispatch as any);
    // Restore the default success implementation after clearAllMocks
    mockAcceptTermsAndCondition.mockResolvedValue(undefined);
  });
  it('renders the modal when userAcceptedTermsOfUse is false', () => {
    expect.assertions(2);
    vi.mocked(useAccountState).mockReturnValue({
      details: {
        userAcceptedTermsOfUse: false,
        givenName: 'Alice',
        familyName: 'Smith',
      },
    } as any);

    render(<TermsAndConditionModal />);

    expect(
      screen.getByTestId('prompt-termsandcondition-modal'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('termsofuse-heading')).toBeInTheDocument();
  });
});

describe(TermsAndConditionModal, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMsal.inProgress = 'none';
    mockMsal.accounts = [{ username: 'test@example.com' }];
    mockMsal.acquireTokenSilent.mockResolvedValue({
      accessToken: 'mock-token',
    });
    vi.mocked(useAccountDispatch).mockReturnValue(mockDispatch as any);
    // Restore the default success implementation after clearAllMocks
    mockAcceptTermsAndCondition.mockResolvedValue(undefined);
  });
  it('does not render the modal when userAcceptedTermsOfUse is true', () => {
    expect.assertions(1);
    vi.mocked(useAccountState).mockReturnValue({
      details: {
        userAcceptedTermsOfUse: true,
        givenName: 'Alice',
        familyName: 'Smith',
      },
    } as any);

    render(<TermsAndConditionModal />);

    expect(
      screen.queryByTestId('prompt-termsandcondition-modal'),
    ).not.toBeInTheDocument();
  });
});

describe(TermsAndConditionModal, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMsal.inProgress = 'none';
    mockMsal.accounts = [{ username: 'test@example.com' }];
    mockMsal.acquireTokenSilent.mockResolvedValue({
      accessToken: 'mock-token',
    });
    vi.mocked(useAccountDispatch).mockReturnValue(mockDispatch as any);
    // Restore the default success implementation after clearAllMocks
    mockAcceptTermsAndCondition.mockResolvedValue(undefined);
  });
  it('dispatches setAgree after successful ToU acceptance', async () => {
    expect.assertions(1);
    vi.mocked(useAccountState).mockReturnValue({
      details: {
        userAcceptedTermsOfUse: false,
        givenName: 'Bob',
        familyName: 'Jones',
      },
    } as any);

    render(<TermsAndConditionModal />);
    fireEvent.click(
      screen.getByRole('button', { name: /agree and continue/i }),
    );

    await waitFor(() => {
      expect(mockSetAgree).toHaveBeenCalledExactlyOnceWith();
    });
  });
});
