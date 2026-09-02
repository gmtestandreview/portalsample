import { vi } from 'vitest';
import type { AccountInfo } from '@azure/msal-browser';

/**
 * One shared MSAL mock for the unit leaf.
 *
 * 29 test files mocked `@azure/msal-react` independently before this existed, each re-deriving the
 * same `{ accounts, inProgress, instance }` shape with slightly different fields. Every route under
 * `routes/ta/**` calls `useMsal()` and `acquireTokenSilent`, so without a shared module that shape
 * gets re-derived once per file and drifts.
 *
 * `vi.mock` is hoisted above imports, so a helper cannot register the mock on a test's behalf. The
 * working pattern is a singleton controller - this module - that the test's own `vi.mock` factory
 * pulls in asynchronously:
 *
 * ```ts
 * vi.mock('@azure/msal-react', async () => {
 *     const { msalReactModuleMock } = await import('../helpers/mockMsal');
 *     return msalReactModuleMock();
 * });
 * ```
 *
 * The test file then imports this module normally and drives it, because both sides resolve to the
 * same module instance. Call `resetMsalMock()` in `beforeEach` or state leaks between tests.
 */

export const DEFAULT_ACCESS_TOKEN = 'test-access-token';

export const testAccount = {
    homeAccountId: 'test-home-account-id',
    localAccountId: 'test-local-account-id',
    environment: 'login.windows.net',
    tenantId: 'test-tenant-id',
    username: 'tester@example.gov.au',
    name: 'Test Tester',
} as AccountInfo;

/** Mirrors the members of `InteractionStatus` the app actually reads. */
export const interactionStatus = {
    Startup: 'startup',
    Login: 'login',
    Logout: 'logout',
    AcquireToken: 'acquireToken',
    HandleRedirect: 'handleRedirect',
    None: 'none',
} as const;

export type InteractionStatusValue =
    (typeof interactionStatus)[keyof typeof interactionStatus];

/** Mutable state the mocked `useMsal()` reads on every render. */
export const msalState: {
    accounts: AccountInfo[];
    inProgress: InteractionStatusValue;
} = {
    accounts: [testAccount],
    inProgress: interactionStatus.None,
};

export const msalMocks = {
    acquireTokenSilent: vi.fn(),
    acquireTokenRedirect: vi.fn(),
    getActiveAccount: vi.fn(),
    setActiveAccount: vi.fn(),
    handleRedirectPromise: vi.fn(),
    loginRedirect: vi.fn(),
    logoutRedirect: vi.fn(),
    isInIframe: vi.fn(),
};

/**
 * Read through to `msalMocks` rather than exposing the mocks directly, so a test that swaps an
 * implementation mid-run is still seen by a component that captured `instance` on an earlier render.
 */
export const msalInstance = {
    acquireTokenSilent: (...args: unknown[]) => msalMocks.acquireTokenSilent(...args),
    acquireTokenRedirect: (...args: unknown[]) => msalMocks.acquireTokenRedirect(...args),
    getActiveAccount: (...args: unknown[]) => msalMocks.getActiveAccount(...args),
    setActiveAccount: (...args: unknown[]) => msalMocks.setActiveAccount(...args),
    handleRedirectPromise: (...args: unknown[]) => msalMocks.handleRedirectPromise(...args),
    loginRedirect: (...args: unknown[]) => msalMocks.loginRedirect(...args),
    logoutRedirect: (...args: unknown[]) => msalMocks.logoutRedirect(...args),
};

/*
 * These three are module replacements for real React hooks, so their names are dictated by
 * `@azure/msal-react` rather than chosen. `no-unnecessary-use-prefix` fires because the stubs hold
 * no hook calls of their own - renaming them would simply break the mock.
 */
/* eslint-disable @eslint-react/no-unnecessary-use-prefix */
export const msalReactModuleMock = () => ({
    useMsal: () => ({
        accounts: msalState.accounts,
        inProgress: msalState.inProgress,
        instance: msalInstance,
    }),
    useIsAuthenticated: () => msalState.accounts.length > 0,
    useAccount: () => msalState.accounts[0] ?? null,
});
/* eslint-enable @eslint-react/no-unnecessary-use-prefix */

export const msalBrowserModuleMock = () => ({
    InteractionStatus: interactionStatus,
    InteractionType: { Redirect: 'redirect', Popup: 'popup', Silent: 'silent' },
    BrowserUtils: { isInIframe: msalMocks.isInIframe },
    LogLevel: { Error: 0, Warning: 1, Info: 2, Verbose: 3, Trace: 4 },
    InteractionRequiredAuthError: class InteractionRequiredAuthError extends Error {},
});

/** Token acquisition succeeds. This is the default state after a reset. */
export const grantToken = (accessToken: string = DEFAULT_ACCESS_TOKEN) => {
    msalMocks.acquireTokenSilent.mockResolvedValue({
        accessToken,
        account: msalState.accounts[0] ?? testAccount,
    });

    return accessToken;
};

/** Token acquisition rejects - the state that exposed the request-for-quote wizard hang. */
export const rejectToken = (error: Error = new Error('interaction_required')) => {
    msalMocks.acquireTokenSilent.mockRejectedValue(error);

    return error;
};

/**
 * Token acquisition stays pending until the caller settles it. Use this to assert loading states,
 * and to unmount mid-flight so an unmount guard can be proven.
 */
export const pendingToken = () => {
    let settle: (accessToken?: string) => void = () => undefined;
    let fail: (error?: Error) => void = () => undefined;

    msalMocks.acquireTokenSilent.mockReturnValue(
        new Promise((resolve, reject) => {
            settle = (accessToken = DEFAULT_ACCESS_TOKEN) =>
                resolve({ accessToken, account: msalState.accounts[0] ?? testAccount });
            fail = (error = new Error('interaction_required')) => reject(error);
        }),
    );

    return {
        settle: (accessToken?: string) => settle(accessToken),
        fail: (error?: Error) => fail(error),
    };
};

/** No signed-in account, so token-guarded effects must not run at all. */
export const signOut = () => {
    msalState.accounts = [];
};

export const setInteractionStatus = (status: InteractionStatusValue) => {
    msalState.inProgress = status;
};

export const resetMsalMock = () => {
    for (const mock of Object.values(msalMocks)) {
        mock.mockReset();
    }

    msalState.accounts = [testAccount];
    msalState.inProgress = interactionStatus.None;

    msalMocks.getActiveAccount.mockReturnValue(testAccount);
    msalMocks.handleRedirectPromise.mockResolvedValue(null);
    msalMocks.logoutRedirect.mockResolvedValue(undefined);
    msalMocks.loginRedirect.mockResolvedValue(undefined);
    msalMocks.isInIframe.mockReturnValue(false);
    grantToken();
};
