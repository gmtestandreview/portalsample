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

vi.mock('@azure/msal-react', async () => {
    const { msalReactModuleMock } = await import('./mockMsal');

    return msalReactModuleMock();
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
        if (accounts.length === 0) {
            return undefined;
        }

        let isMounted = true;

        instance
            .acquireTokenSilent({ scopes: ['scope'], account: accounts[0] })
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
            <span data-testid="accounts">{accounts.length}</span>
            <span data-testid="in-progress">{inProgress}</span>
            <span data-testid="token">{token ?? ''}</span>
            <span data-testid="error">{error ?? ''}</span>
        </div>
    );
};

describe('shared MSAL harness', () => {
    beforeEach(() => {
        resetMsalMock();
    });

    it('resolves a token by default and reports the signed-in account', async () => {
        render(<TokenProbe />);

        await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent(DEFAULT_ACCESS_TOKEN));

        expect(screen.getByTestId('accounts')).toHaveTextContent('1');
        expect(screen.getByTestId('in-progress')).toHaveTextContent(interactionStatus.None);
        expect(msalMocks.acquireTokenSilent).toHaveBeenCalledWith({
            scopes: ['scope'],
            account: testAccount,
        });
    });

    it('grants a caller-supplied token', async () => {
        grantToken('another-token');

        render(<TokenProbe />);

        await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent('another-token'));
    });

    it('rejects the token so error paths can be exercised', async () => {
        rejectToken(new Error('interaction_required'));

        render(<TokenProbe />);

        await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('interaction_required'));
        expect(screen.getByTestId('token')).toHaveTextContent('');
    });

    it('holds the token pending until the test settles it', async () => {
        const token = pendingToken();

        render(<TokenProbe />);

        await waitFor(() => expect(msalMocks.acquireTokenSilent).toHaveBeenCalled());
        expect(screen.getByTestId('token')).toHaveTextContent('');

        token.settle('late-token');

        await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent('late-token'));
    });

    it('fails a pending token so mid-flight rejection can be exercised', async () => {
        const token = pendingToken();

        render(<TokenProbe />);

        await waitFor(() => expect(msalMocks.acquireTokenSilent).toHaveBeenCalled());

        token.fail(new Error('token expired'));

        await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('token expired'));
    });

    it('signs out so token-guarded effects never run', async () => {
        signOut();

        render(<TokenProbe />);

        expect(screen.getByTestId('accounts')).toHaveTextContent('0');
        expect(msalMocks.acquireTokenSilent).not.toHaveBeenCalled();
    });

    it('reports a non-idle interaction status', async () => {
        setInteractionStatus(interactionStatus.Login);

        render(<TokenProbe />);

        // Await the settled token even though this test is about `inProgress`. The probe's effect
        // still resolves one, and asserting before it lands leaves a state update outside the test
        // body - which is what an act(...) warning is telling you. Awaiting the user-visible end
        // state is the fix; silencing the warning would just hide the unowned update.
        await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent(DEFAULT_ACCESS_TOKEN));
        expect(screen.getByTestId('in-progress')).toHaveTextContent(interactionStatus.Login);
    });

    it('restores default state between tests', async () => {
        // Guards the reset itself. signOut() above mutates shared module state, so if resetMsalMock
        // stopped restoring `accounts` every later test in the file would silently run signed out.
        render(<TokenProbe />);

        await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent(DEFAULT_ACCESS_TOKEN));
        expect(screen.getByTestId('accounts')).toHaveTextContent('1');
        expect(screen.getByTestId('in-progress')).toHaveTextContent(interactionStatus.None);
    });
});
