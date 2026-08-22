import type { Decorator, StoryContext } from '@storybook/react-vite';
import { Logger, InteractionStatus } from '@azure/msal-browser';
import { MsalContext, type IMsalContext } from '@azure/msal-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { Formik, Form as FormikForm } from 'formik';
import type { AccountDetails, AccountDispatchContext, AccountStateContext } from '../authentication/accountContext';
import { AccountDispatchCtx, AccountStateCtx } from '../authentication/accountContext';
import type { ModalDispatch, ModalState } from '../components/modals/ModalContext';
import { ModalDispatchCtx, ModalStateCtx } from '../components/modals/ModalContext';
import type { UserProfile } from '../components/SearchFilter/types';

const noop = () => {};
const noopAsync = async () => undefined;

export const defaultUserProfile: UserProfile = {
    filterYearType: '',
    filterStatusType: '',
    filterSortOrder: 'descending',
    filtersChanged: false,
    filterCurrentPage: 1,
    filterActiveTab: undefined,
    filterSearchText: '',
};

export const defaultAccountDetails: AccountDetails = {
    organisation: 'Storybook Organisation',
    trading: 'Precision Testing',
    branch: 'Sydney Laboratory',
    homeAccountId: 'mock-home-account-id',
    givenName: 'Taylor',
    familyName: 'Nguyen',
    email: 'taylor.nguyen@example.com',
    abn: '00000000000',
    userAcceptedTermsOfUse: true,
    accountCreationCompleted: true,
    accountContactCompleted: true,
    currentTermsVersion: '1',
    defaultOrganisationId: 1,
    organisationCRMGuid: 'org-crm-guid-001',
    organisationIsCompleted: true,
    isDefaultOrganisation: true,
    showBranchSelector: false,
    contactId: 1,
    targetOrganisation: {
        targetOrganisationAbn: '00000000000',
        targetOrganisationName: 'Storybook Organisation',
    },
    userProfile: { testingCalibrationDashboard: defaultUserProfile },
};

export const defaultAccountState: AccountStateContext = {
    isLoading: false,
    details: defaultAccountDetails,
};

export const defaultAccountDispatch: AccountDispatchContext = {
    setAgree: noop,
    setCompleted: noop,
    setContactCompleted: noop,
    setDefaultOrganisationId: noop,
    setTargetOrganisation: noop,
    setOrganisationAndBranch: noop,
    setUserProfile: () => Promise.resolve(true),
    setShowBranchSelector: noop,
    setShowRFQSelectModal: noop,
};

export const defaultModalState: ModalState = {
    showBranchSelector: false,
    showRFQDeleteModal: false,
};

export const defaultModalDispatch: ModalDispatch = {
    setShowBranchSelector: noop,
    setShowRFQDeleteModal: noop,
    setShowRFQSelectModal: noop,
};

export const mockMsalAccount = {
    homeAccountId: 'mock-home-account-id',
    environment: 'login.microsoftonline.com',
    tenantId: 'mock-tenant-id',
    username: 'taylor.nguyen@example.com',
    localAccountId: 'mock-local-id',
    name: 'Taylor Nguyen',
};

const mockLogger = new Logger({
    loggerCallback: noop,
    piiLoggingEnabled: false,
});

const baseMsalInstance = {
    initialize: noopAsync,
    acquireTokenPopup: noopAsync,
    acquireTokenRedirect: noopAsync,
    acquireTokenSilent: async () => ({ accessToken: 'mock-access-token' }),
    addEventCallback: () => null,
    addPerformanceCallback: () => null,
    clearCache: noopAsync,
    getAllAccounts: () => [mockMsalAccount],
    getAccount: () => mockMsalAccount,
    getActiveAccount: () => mockMsalAccount,
    handleRedirectPromise: async () => null,
    loginPopup: noopAsync,
    loginRedirect: noopAsync,
    logout: noopAsync,
    logoutPopup: noopAsync,
    logoutRedirect: noopAsync,
    removeEventCallback: noop,
    removePerformanceCallback: noop,
    setActiveAccount: noop,
    ssoSilent: noopAsync,
} as unknown as IMsalContext['instance'];

export interface PortalFormikConfig {
    initialValues: Record<string, unknown>;
    validationSchema?: unknown;
    initialErrors?: Record<string, unknown>;
    initialTouched?: Record<string, unknown>;
    initialStatus?: Record<string, unknown>;
}

export interface PortalStoryParameters {
    authenticated?: boolean;
    initialEntries?: string[];
    accountDetails?: Partial<AccountDetails>;
    accountState?: Partial<AccountStateContext>;
    accountDispatch?: Partial<AccountDispatchContext>;
    modalState?: Partial<ModalState>;
    modalDispatch?: Partial<ModalDispatch>;
    formik?: PortalFormikConfig;
    msalContext?: Partial<IMsalContext>;
    fetch?: typeof globalThis.fetch;
}

const getPortalParameters = (context: StoryContext): PortalStoryParameters => (
    (context.parameters.portal ?? {}) as PortalStoryParameters
);

const createMsalContext = (authenticated: boolean, overrides?: Partial<IMsalContext>): IMsalContext => {
    const defaultAccounts = authenticated ? [mockMsalAccount] : [];
    return {
        instance: {
            ...baseMsalInstance,
            getAllAccounts: () => defaultAccounts,
            getActiveAccount: () => (authenticated ? mockMsalAccount : null),
            ...overrides?.instance,
        },
        inProgress: overrides?.inProgress ?? InteractionStatus.None,
        accounts: overrides?.accounts ?? defaultAccounts,
        logger: overrides?.logger ?? mockLogger,
    };
};

const withOptionalFormik = (children: ReactNode, formik?: PortalFormikConfig) => {
    if (!formik) {
        return children;
    }

    return (
        <Formik
            initialValues={formik.initialValues}
            initialErrors={formik.initialErrors as any}
            initialTouched={formik.initialTouched as any}
            initialStatus={{ hidden: {}, ...formik.initialStatus }}
            validationSchema={formik.validationSchema}
            onSubmit={noop}
        >
            <FormikForm noValidate>{children}</FormikForm>
        </Formik>
    );
};

const PatchedFetch = ({ children, fetchImpl }: { children: ReactNode; fetchImpl: typeof globalThis.fetch }) => {
    const restoreRef = useRef<(() => void) | null>(null);

    if (!restoreRef.current) {
        const originalFetch = globalThis.fetch;
        const originalWindowFetch = globalThis.window.fetch;

        globalThis.fetch = fetchImpl;
        globalThis.window.fetch = fetchImpl;

        restoreRef.current = () => {
            globalThis.fetch = originalFetch;
            globalThis.window.fetch = originalWindowFetch;
        };
    }

    useEffect(() => () => {
        restoreRef.current?.();
    }, []);

    return children;
};

const withOptionalFetch = (children: ReactNode, fetchImpl?: typeof globalThis.fetch) => {
    if (!fetchImpl) {
        return children;
    }

    return (
        <PatchedFetch fetchImpl={fetchImpl}>
            {children}
        </PatchedFetch>
    );
};

export const withPortalProviders: Decorator = (Story, context) => {
    const portal = getPortalParameters(context);
    const authenticated = portal.authenticated ?? true;
    const accountDetails: AccountDetails = {
        ...defaultAccountDetails,
        ...portal.accountDetails,
    };
    const accountState: AccountStateContext = {
        ...defaultAccountState,
        ...portal.accountState,
        details: accountDetails,
    };
    const accountDispatch: AccountDispatchContext = {
        ...defaultAccountDispatch,
        ...portal.accountDispatch,
    };
    const modalState: ModalState = {
        ...defaultModalState,
        ...portal.modalState,
    };
    const modalDispatch: ModalDispatch = {
        ...defaultModalDispatch,
        ...portal.modalDispatch,
    };
    const msalContext = createMsalContext(authenticated, portal.msalContext);
    const storyContent = withOptionalFetch(
        withOptionalFormik(<Story />, portal.formik),
        portal.fetch,
    );

    return (
        <MsalContext.Provider value={msalContext}>
            <AccountStateCtx.Provider value={accountState}>
                <AccountDispatchCtx.Provider value={accountDispatch}>
                    <ModalStateCtx.Provider value={modalState}>
                        <ModalDispatchCtx.Provider value={modalDispatch}>
                            {storyContent}
                        </ModalDispatchCtx.Provider>
                    </ModalStateCtx.Provider>
                </AccountDispatchCtx.Provider>
            </AccountStateCtx.Provider>
        </MsalContext.Provider>
    );
};
