const mockMsalAccount = {
    homeAccountId:  'mock-home-account-id',
    environment:    'login.microsoftonline.com',
    tenantId:       'mock-tenant-id',
    username:       'taylor.nguyen@example.com',
    localAccountId: 'mock-local-id',
    name:           'Taylor Nguyen',
};

export const mockMsalContext = {
    instance: {
        acquireTokenSilent: async () => ({ accessToken: 'mock-access-token' }),
        setActiveAccount:   () => {},
        getAllAccounts:      () => [mockMsalAccount],
        getActiveAccount:   () => mockMsalAccount,
    },
    accounts:   [mockMsalAccount],
    inProgress: 'none',
};

const noop = () => {};

// ErrorBoundary and WizardStep cast ai.reactPlugin to ReactPlugin.
// Stubbing the singleton here prevents the cast from throwing in Storybook.
export const mockAppInsights = {
    appInsights: {
        trackException: noop,
        trackTrace:     noop,
        trackEvent:     noop,
        trackPageView:  noop,
    },
    reactPlugin: {
        getAppInsights: () => ({
            trackException: noop,
        }),
    },
};
