import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TermsAndConditionModal from '../../../../ClientApp/src/components/modals/TermsAndCondition/index.tsx';

// ── Mock external dependencies ──────────────────────────────────────────────

const mockMsal = vi.hoisted(() => ({
  inProgress: 'none',
  accounts: [{ username: 'test@example.com' }],
  acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'mock-token' }),
}));

vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({
    inProgress: mockMsal.inProgress,
    accounts: mockMsal.accounts,
    instance: {
      acquireTokenSilent: mockMsal.acquireTokenSilent,
    },
  }),
}));

const mockSetAgree = vi.fn();
const mockDispatch = { setAgree: mockSetAgree };

vi.mock('../../../../ClientApp/src/authentication/hooks', () => ({
  useAccountState: vi.fn(),
  useAccountDispatch: vi.fn(),
}));

// UsersClient must be a constructor (class/function), not an arrow function,
// because the component uses `new UsersClient()`.
const mockAcceptTermsAndCondition = vi.fn().mockResolvedValue(undefined);
const mockSetAuthToken = vi.fn();

vi.mock('../../../../ClientApp/src/api/web-api-client', () => ({
  UsersClient: vi.fn(function (this: any) {
    this.setAuthToken = mockSetAuthToken;
    this.acceptTermsAndCondition = mockAcceptTermsAndCondition;
  }),
}));

vi.mock('../../../../ClientApp/src/authentication/authConfig', () => ({
  tokenRequest: { scopes: ['api://mock/.default'] },
}));

vi.mock('../../../../ClientApp/src/terms-config.json', () => ({
  default: { TermsVersion: '2' },
}));

import {
  useAccountDispatch,
  useAccountState,
} from '../../../../ClientApp/src/authentication/hooks.tsx';

// ── Tests ────────────────────────────────────────────────────────────────────

describe('TermsAndConditionModal', () => {
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
    vi.mocked(useAccountState).mockReturnValue({
      details: {
        userAcceptedTermsOfUse: false,
        givenName: 'Alice',
        familyName: 'Smith',
      },
    } as any);

    render(<TermsAndConditionModal />);

    expect(
      screen.getByTestId('prompt-termsandcondition-modal')
    ).toBeInTheDocument();
    expect(screen.getByTestId('termsofuse-heading')).toBeInTheDocument();
  });

  it('does not render the modal when userAcceptedTermsOfUse is true', () => {
    vi.mocked(useAccountState).mockReturnValue({
      details: {
        userAcceptedTermsOfUse: true,
        givenName: 'Alice',
        familyName: 'Smith',
      },
    } as any);

    render(<TermsAndConditionModal />);

    expect(
      screen.queryByTestId('prompt-termsandcondition-modal')
    ).not.toBeInTheDocument();
  });

  it('dispatches setAgree after successful ToU acceptance', async () => {
    vi.mocked(useAccountState).mockReturnValue({
      details: {
        userAcceptedTermsOfUse: false,
        givenName: 'Bob',
        familyName: 'Jones',
      },
    } as any);

    render(<TermsAndConditionModal />);
    fireEvent.click(
      screen.getByRole('button', { name: /agree and continue/iu })
    );

    await waitFor(() => {
      expect(mockSetAgree).toHaveBeenCalledOnce();
    });
  });

  it('sends the auth token and configured terms version when accepting terms', async () => {
    vi.mocked(useAccountState).mockReturnValue({
      details: {
        userAcceptedTermsOfUse: false,
        givenName: 'Bob',
        familyName: 'Jones',
      },
    } as any);

    render(<TermsAndConditionModal />);
    fireEvent.click(
      screen.getByRole('button', { name: /agree and continue/iu })
    );

    await waitFor(() => {
      expect(mockSetAuthToken).toHaveBeenCalledWith('mock-token');
      expect(mockAcceptTermsAndCondition).toHaveBeenCalledWith({
        termsVersion: 2,
      });
    });
  });

  it('uses the family name only when the given name is not available', () => {
    vi.mocked(useAccountState).mockReturnValue({
      details: { userAcceptedTermsOfUse: false, familyName: 'Solo' },
    } as any);

    render(<TermsAndConditionModal />);

    expect(
      screen.getByRole('heading', { name: /welcome, solo/iu })
    ).toBeInTheDocument();
  });

  it('renders the exit portal link', () => {
    vi.mocked(useAccountState).mockReturnValue({
      details: {
        userAcceptedTermsOfUse: false,
        givenName: 'Alice',
        familyName: 'Smith',
      },
    } as any);

    render(<TermsAndConditionModal />);

    expect(
      screen.getByRole('button', { name: /exit portal/iu })
    ).toHaveAttribute('href', '/sign-out');
  });

  it('does not call the API while MSAL is in progress', async () => {
    mockMsal.inProgress = 'login';
    vi.mocked(useAccountState).mockReturnValue({
      details: {
        userAcceptedTermsOfUse: false,
        givenName: 'Alice',
        familyName: 'Smith',
      },
    } as any);

    render(<TermsAndConditionModal />);
    fireEvent.click(
      screen.getByRole('button', { name: /agree and continue/iu })
    );

    await waitFor(() => {
      expect(mockAcceptTermsAndCondition).not.toHaveBeenCalled();
    });
  });

  it('does not call the API when there is no MSAL account', async () => {
    mockMsal.accounts = [];
    vi.mocked(useAccountState).mockReturnValue({
      details: {
        userAcceptedTermsOfUse: false,
        givenName: 'Alice',
        familyName: 'Smith',
      },
    } as any);

    render(<TermsAndConditionModal />);
    fireEvent.click(
      screen.getByRole('button', { name: /agree and continue/iu })
    );

    await waitFor(() => {
      expect(mockAcceptTermsAndCondition).not.toHaveBeenCalled();
    });
  });

  it('accepts terms without dispatching when account dispatch is unavailable', async () => {
    vi.mocked(useAccountDispatch).mockReturnValue(null);
    vi.mocked(useAccountState).mockReturnValue({
      details: {
        userAcceptedTermsOfUse: false,
        givenName: 'Bob',
        familyName: 'Jones',
      },
    } as any);

    render(<TermsAndConditionModal />);
    fireEvent.click(
      screen.getByRole('button', { name: /agree and continue/iu })
    );

    await waitFor(() => {
      expect(mockAcceptTermsAndCondition).toHaveBeenCalledWith({
        termsVersion: 2,
      });
    });
    expect(mockSetAgree).not.toHaveBeenCalled();
  });

  it('shows the error alert when acceptTermsAndCondition API call fails', async () => {
    mockAcceptTermsAndCondition.mockRejectedValueOnce(
      new Error('Network error')
    );

    vi.mocked(useAccountState).mockReturnValue({
      details: {
        userAcceptedTermsOfUse: false,
        givenName: 'Eve',
        familyName: 'Error',
      },
    } as any);

    render(<TermsAndConditionModal />);
    fireEvent.click(
      screen.getByRole('button', { name: /agree and continue/iu })
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByText(/error found trying to save/iu)
      ).toBeInTheDocument();
    });
  });
});
