import type { Decorator, StoryContext } from '@storybook/react-vite';
import { Logger, InteractionStatus } from '@azure/msal-browser';
import { MsalContext, type IMsalContext } from '@azure/msal-react';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  useLocation,
  useMatches,
} from 'react-router';
import type {
  AccountDetails,
  AccountDispatchContext,
  AccountStateContext,
} from '../authentication/accountContext';
import {
  AccountDispatchCtx,
  AccountStateCtx,
} from '../authentication/accountContext';
import type {
  ModalDispatch,
  ModalState,
} from '../components/modals/ModalContext';
import {
  ModalDispatchCtx,
  ModalStateCtx,
} from '../components/modals/ModalContext';
import type { UserProfile } from '../components/SearchFilter/types';
import { omitUndefined } from '../utils/omitUndefined';
import { fn } from 'storybook/test';
import { withOptionalFetch } from './storybookFetch';
import {
  AccountContextLifecycleSentinel,
  ProviderLifecycleSentinel,
  SessionStorageLifecycleSentinel,
} from './storybookSentinels';

const noop = fn();
const noopAsync = () => Promise.resolve();

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
  userProfile: {
    testingCalibrationDashboard: omitUndefined(defaultUserProfile),
  },
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
  acquireTokenSilent: () =>
    Promise.resolve({ accessToken: 'mock-access-token' }),
  addEventCallback: () => null,
  addPerformanceCallback: () => null,
  clearCache: noopAsync,
  getAllAccounts: () => [mockMsalAccount],
  getAccount: () => mockMsalAccount,
  getActiveAccount: () => mockMsalAccount,
  handleRedirectPromise: () => Promise.resolve(null),
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

export interface PortalRhfConfig {
  defaultValues: Record<string, unknown>;
}

export interface PortalDestinationRoute {
  path: string;
  element: ReactNode;
}

export interface PortalLocationObservation {
  pathname: string;
  params: Record<string, string | undefined>;
}

const defaultInitialEntries = ['/'];
const emptyDestinationRoutes: PortalDestinationRoute[] = [];

export interface PortalStoryParameters {
  authenticated?: boolean;
  initialEntries?: string[];
  /** Route pattern the story is mounted under. Defaults to the `*` catch-all; set it
   *  when the rendered route reads params through `useParams`. */
  routePath?: string;
  destinationRoutes?: PortalDestinationRoute[];
  observeLocation?: (location: PortalLocationObservation) => void;
  accountDetails?: Partial<AccountDetails>;
  accountState?: Partial<AccountStateContext>;
  accountDispatch?: Partial<AccountDispatchContext>;
  modalState?: Partial<ModalState>;
  modalDispatch?: Partial<ModalDispatch>;
  /** Wraps the story in a React Hook Form `FormProvider`. */
  rhf?: PortalRhfConfig;
  /** Emits an opt-in provider lifecycle sentinel for isolation tests. */
  providerLifecycleSentinel?: string;
  /** Mutates the real AccountContext state for isolation tests. */
  accountContextLifecycleSentinel?: string;
  /** Owns a per-story sessionStorage key for lifecycle isolation tests. */
  sessionStorageSentinel?: string;
  msalContext?: Partial<IMsalContext>;
  fetch?: typeof globalThis.fetch;
}

const getPortalParameters = (context: StoryContext): PortalStoryParameters =>
  (context.parameters['portal'] ?? {}) as PortalStoryParameters;

interface PortalRouterRuntime {
  Story: ComponentType;
  observeLocation: ((location: PortalLocationObservation) => void) | undefined;
}

const PortalRouterRuntimeContext = createContext<PortalRouterRuntime | null>(
  null,
);

const StoryRoute = () => {
  const runtime = useContext(PortalRouterRuntimeContext);
  if (!runtime) {
    throw new Error('StoryRoute must be rendered inside PortalStoryRouter.');
  }

  const Story = runtime.Story;
  return <Story />;
};

const LocationObserver = () => {
  const runtime = useContext(PortalRouterRuntimeContext);
  const location = useLocation();
  const matches = useMatches();
  const matchedParams = matches.at(-1)?.params ?? {};
  const paramsKey = JSON.stringify(matchedParams);
  const observeLocation = runtime?.observeLocation;

  useEffect(() => {
    observeLocation?.({
      pathname: location.pathname,
      params: JSON.parse(paramsKey) as Record<string, string | undefined>,
    });
  }, [location.pathname, observeLocation, paramsKey]);

  return <Outlet />;
};

export interface PortalStoryRouterProps {
  Story: ComponentType;
  initialEntries?: string[];
  routePath?: string;
  destinationRoutes?: PortalDestinationRoute[] | undefined;
  observeLocation?: ((location: PortalLocationObservation) => void) | undefined;
}

export const PortalStoryRouter = ({
  Story,
  initialEntries = defaultInitialEntries,
  routePath = '*',
  destinationRoutes = emptyDestinationRoutes,
  observeLocation,
}: PortalStoryRouterProps) => {
  const [router] = useState(() =>
    createMemoryRouter(
      [
        {
          element: <LocationObserver />,
          children: [
            { path: routePath, element: <StoryRoute /> },
            ...destinationRoutes,
          ],
        },
      ],
      { initialEntries },
    ),
  );
  const runtime = useMemo(
    () => ({ Story, observeLocation }),
    [Story, observeLocation],
  );

  return (
    <PortalRouterRuntimeContext value={runtime}>
      <RouterProvider router={router} />
    </PortalRouterRuntimeContext>
  );
};

const createMsalContext = (
  authenticated: boolean,
  overrides?: Partial<IMsalContext>,
): IMsalContext => {
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

const RhfStoryForm = ({
  defaultValues,
  children,
}: {
  defaultValues: Record<string, unknown>;
  children: ReactNode;
}) => {
  const methods = useForm({ defaultValues });

  return (
    <FormProvider {...methods}>
      <form noValidate>{children}</form>
    </FormProvider>
  );
};

const withOptionalRhf = (children: ReactNode, rhf?: PortalRhfConfig) => {
  if (!rhf) {
    return <>{children}</>;
  }

  return (
    <RhfStoryForm defaultValues={rhf.defaultValues}>{children}</RhfStoryForm>
  );
};

const AccountContextLifecycleProvider = ({
  name,
  initialState,
  children,
}: {
  name: string;
  initialState: AccountStateContext;
  children: ReactNode;
}) => {
  const [details, setDetails] = useState(initialState.details);
  const accountDispatch = useMemo<AccountDispatchContext>(
    () => ({
      ...defaultAccountDispatch,
      setTargetOrganisation: (abn, targetOrganisationName) => {
        setDetails((currentDetails) =>
          currentDetails
            ? {
                ...currentDetails,
                targetOrganisation: {
                  targetOrganisationAbn: abn,
                  targetOrganisationName,
                },
              }
            : currentDetails,
        );
      },
    }),
    [],
  );
  const accountState = useMemo(
    () => ({ ...initialState, details }),
    [details, initialState],
  );

  return (
    <AccountStateCtx.Provider value={accountState}>
      <AccountDispatchCtx.Provider value={accountDispatch}>
        <AccountContextLifecycleSentinel name={name}>
          {children}
        </AccountContextLifecycleSentinel>
      </AccountDispatchCtx.Provider>
    </AccountStateCtx.Provider>
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
    withOptionalRhf(<Story />, portal.rhf),
    portal.fetch,
  );
  const providerContent = portal.providerLifecycleSentinel ? (
    <ProviderLifecycleSentinel name={portal.providerLifecycleSentinel}>
      {storyContent}
    </ProviderLifecycleSentinel>
  ) : (
    storyContent
  );
  const lifecycleContent = portal.sessionStorageSentinel ? (
    <SessionStorageLifecycleSentinel name={portal.sessionStorageSentinel}>
      {providerContent}
    </SessionStorageLifecycleSentinel>
  ) : (
    providerContent
  );
  const accountLifecycleContent = portal.accountContextLifecycleSentinel ? (
    <AccountContextLifecycleProvider
      name={portal.accountContextLifecycleSentinel}
      initialState={accountState}
    >
      {lifecycleContent}
    </AccountContextLifecycleProvider>
  ) : (
    lifecycleContent
  );

  return (
    <MsalContext value={msalContext}>
      <AccountStateCtx.Provider value={accountState}>
        <AccountDispatchCtx.Provider value={accountDispatch}>
          <ModalStateCtx.Provider value={modalState}>
            <ModalDispatchCtx.Provider value={modalDispatch}>
              {accountLifecycleContent}
            </ModalDispatchCtx.Provider>
          </ModalStateCtx.Provider>
        </AccountDispatchCtx.Provider>
      </AccountStateCtx.Provider>
    </MsalContext>
  );
};
