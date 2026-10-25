import { render, screen, waitFor } from '@testing-library/react';

import { useEffect, useState } from 'react';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMsal } from '@azure/msal-react';

import {
  DEFAULT_ACCESS_TOKEN,
  grantToken,
  interactionStatus,
  msalMocks,
  pendingToken,
  rejectToken,
  resetMsalMock,
  setInteractionStatus,
  signOut,
  testAccount,
} from './mockMsal';

vi.mock(import('@azure/msal-react'), async () => {
  const { msalReactModuleMock } = await import('./mockMsal');

  return msalReactModuleMock() satisfies __ExactMockModule<__TestMockModule2>;
});

/**
 * Stands in for the token-acquiring effect every `routes/ta/**` module runs. If the harness can
 * drive this probe through granted, rejected and pending token states, it can drive those routes.
 */
const TokenProbe = () => {
  const { accounts, inProgress, instance } = useMsal();
  const [token, setToken] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const [account] = accounts;
    if (!account) {
      return undefined;
    }

    let isMounted = true;

    instance
      .acquireTokenSilent({ scopes: ['scope'], account })
      .then((result) => {
        if (isMounted) {
          setToken(result.accessToken);
        }
      })
      .catch((reason: Error) => {
        if (isMounted) {
          setError(reason.message);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accounts, instance]);

  return (
    <div>
      <span data-testid='accounts'>{accounts.length}</span>
      <span data-testid='in-progress'>{inProgress}</span>
      <span data-testid='token'>{token ?? ''}</span>
      <span data-testid='error'>{error ?? ''}</span>
    </div>
  );
};

describe('shared MSAL harness', () => {
  beforeEach(() => {
    resetMsalMock();
  });
  it('resolves a token by default and reports the signed-in account', async () => {
    expect.assertions(4);
    render(<TokenProbe />);

    await waitFor(() =>
      expect(screen.getByTestId('token')).toHaveTextContent(
        DEFAULT_ACCESS_TOKEN,
      ),
    );

    expect(screen.getByTestId('accounts')).toHaveTextContent('1');
    expect(screen.getByTestId('in-progress')).toHaveTextContent(
      interactionStatus.None,
    );
    expect(msalMocks.acquireTokenSilent).toHaveBeenCalledWith({
      scopes: ['scope'],
      account: testAccount,
    });
  });
});

describe('shared MSAL harness', () => {
  beforeEach(() => {
    resetMsalMock();
  });
  it('grants a caller-supplied token', async () => {
    expect.assertions(1);
    grantToken('another-token');

    render(<TokenProbe />);

    await waitFor(() =>
      expect(screen.getByTestId('token')).toHaveTextContent('another-token'),
    );
  });
});
