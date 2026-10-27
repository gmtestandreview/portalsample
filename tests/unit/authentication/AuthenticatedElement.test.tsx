import { render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import type { IPublicClientApplication } from '@azure/msal-browser';
import type * as MsalBrowserModule from '@azure/msal-browser';
import type {
  IMsalContext,
  MsalAuthenticationProps,
  MsalAuthenticationResult,
} from '@azure/msal-react';
import type * as MsalReactModule from '@azure/msal-react';
import type { ErrorResponse, NavigateProps } from 'react-router';
import type * as ReactRouterModule from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { ErrorBoundaryProps } from '../../../ClientApp/src/components/ErrorBoundary';
import type { PreConditionsProps } from '../../../ClientApp/src/routes/preConditions/PreConditions';
import type * as AppInsightsModule from '../../../ClientApp/src/instrumentation/AppInsightsService';

type MsalErrorComponent = NonNullable<
  MsalAuthenticationProps['errorComponent']
>;
type MsalLoadingComponent = NonNullable<
  MsalAuthenticationProps['loadingComponent']
>;

const authElementMocks = vi.hoisted(() => ({
  isRouteErrorResponse: false,
  msalTemplateMode: 'children' satisfies 'children' | 'loading' | 'error',
  msalTemplateProps: undefined as
    | {
        authenticationRequest: unknown;
        errorComponent: MsalErrorComponent;
        interactionType: unknown;
        loadingComponent: MsalLoadingComponent;
      }
    | undefined,
  routeError: undefined as unknown,
  setActiveAccount: vi.fn<IPublicClientApplication['setActiveAccount']>(),
}));

const EmptyAuthComponent: ComponentType = () => null;

vi.mock(import('@azure/msal-react'), async (importOriginal) => {
  const actual = await importOriginal<typeof MsalReactModule>();
  const { InteractionStatus, Logger, stubbedPublicClientApplication } =
    await import('@azure/msal-browser');
  const msalContext: IMsalContext = {
    accounts: [],
    inProgress: InteractionStatus.None,
    instance: stubbedPublicClientApplication,
    logger: new Logger({ loggerCallback: () => undefined }),
  };
  vi.spyOn(msalContext.instance, 'setActiveAccount').mockImplementation(
    authElementMocks.setActiveAccount,
  );

  return {
    ...actual,
    MsalAuthenticationTemplate: ({
      authenticationRequest,
      children,
      errorComponent,
      interactionType,
      loadingComponent,
    }: MsalAuthenticationProps) => {
      const ErrorComponent = errorComponent ?? EmptyAuthComponent;
      const LoadingComponent = loadingComponent ?? EmptyAuthComponent;
      const authenticationResult: MsalAuthenticationResult = {
        login: async () => null,
        acquireToken: async () => null,
        result: null,
        error: null,
      };
      authElementMocks.msalTemplateProps = {
        authenticationRequest,
        errorComponent: ErrorComponent,
        interactionType,
        loadingComponent: LoadingComponent,
      };

      if (authElementMocks.msalTemplateMode === 'loading') {
        return <LoadingComponent {...msalContext} />;
      }

      if (authElementMocks.msalTemplateMode === 'error') {
        return <ErrorComponent {...authenticationResult} />;
      }

      return <div data-testid='msal-template'>{children}</div>;
    },
    useMsal: () => msalContext,
  } satisfies Partial<__TestMockModule2>;
});

vi.mock(import('@azure/msal-browser'), async (importOriginal) => {
  const actual = await importOriginal<typeof MsalBrowserModule>();
  return {
    ...actual,
    InteractionType: actual.InteractionType,
  } satisfies Partial<__TestMockModule3>;
});

vi.mock(import('react-router'), async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouterModule>();
  // React Router's declaration returns null, while this test double renders a
  // marker so the error-route destination remains observable in assertions.
  const MockNavigate = (({ to }: NavigateProps) => (
    <span data-testid='navigate'>{String(to)}</span>
  )) as unknown as typeof actual.Navigate;
  return {
    ...actual,
    isRouteErrorResponse: (_error: unknown): _error is ErrorResponse =>
      authElementMocks.isRouteErrorResponse,
    Navigate: MockNavigate,
    useRouteError: () => authElementMocks.routeError,
  } satisfies Partial<__TestMockModule11>;
});

vi.mock(
  import('../../../ClientApp/src/routes/preConditions/PreConditions'),
  () =>
    ({
      default: ({
        children,
        displayHeaderAndFooter,
      }: Readonly<PreConditionsProps>) => (
        <section
          data-header-and-footer={String(displayHeaderAndFooter)}
          data-testid='preconditions'
        >
          {children}
        </section>
      ),
    }) satisfies Partial<__TestMockModule12>,
);

vi.mock(
  import('../../../ClientApp/src/components/ErrorBoundary'),
  () =>
    ({
      default: ({ appInsights, children }: Readonly<ErrorBoundaryProps>) => (
        <div
          data-has-app-insights={String(Boolean(appInsights))}
          data-testid='error-boundary'
        >
          {children}
        </div>
      ),
    }) satisfies Partial<__TestMockModule13>,
);

vi.mock(
  import('../../../ClientApp/src/components/BlockUISpinner'),
  () =>
    ({
      default: ({ children }: { children: ReactNode }) => (
        <output>{children}</output>
      ),
    }) satisfies Partial<__TestMockModule14>,
);

vi.mock(
  import('../../../ClientApp/src/instrumentation/AppInsightsService'),
  async (importOriginal) => {
    const actual = await importOriginal<typeof AppInsightsModule>();
    const { ReactPlugin } =
      await import('@microsoft/applicationinsights-react-js');
    return {
      ...actual,
      ai: {
        reactPlugin: new ReactPlugin(),
        appInsights: null,
      },
    } satisfies Partial<__TestMockModule15>;
  },
);

vi.mock(
  import('../../../ClientApp/src/authentication/authConfig'),
  () =>
    ({
      authRequest: {
        redirectUri: '/redirect',
        scopes: ['read'],
      },
    }) satisfies Partial<__TestMockModule8>,
);

describe('authenticatedElement', () => {
  const resetAuthElementMocks = () => {
    vi.clearAllMocks();
    authElementMocks.isRouteErrorResponse = false;
    authElementMocks.msalTemplateMode = 'children';
    authElementMocks.msalTemplateProps = undefined;
    authElementMocks.routeError = undefined;
  };

  it('wraps children in preconditions, MSAL authentication, and an error boundary', async () => {
    expect.hasAssertions();

    resetAuthElementMocks();

    const { default: AuthenticatedElement } =
      await import('../../../ClientApp/src/authentication/AuthenticatedElement');

    render(
      <AuthenticatedElement displayHeaderAndFooter={false}>
        <span>Secure content</span>
      </AuthenticatedElement>,
    );

    expect(screen.getByTestId('preconditions')).toHaveAttribute(
      'data-header-and-footer',
      'false',
    );
    expect(screen.getByTestId('msal-template')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary')).toHaveAttribute(
      'data-has-app-insights',
      'true',
    );
    expect(screen.getByText('Secure content')).toBeInTheDocument();
    expect(authElementMocks.msalTemplateProps).toMatchObject({
      authenticationRequest: {
        redirectUri: '/redirect',
        scopes: ['read'],
      },
      interactionType: 'redirect',
    });
  });

  it('passes displayHeaderAndFooter as true by default', async () => {
    expect.hasAssertions();

    resetAuthElementMocks();

    const { default: AuthenticatedElement } =
      await import('../../../ClientApp/src/authentication/AuthenticatedElement');

    render(<AuthenticatedElement />);

    expect(screen.getByTestId('preconditions')).toHaveAttribute(
      'data-header-and-footer',
      'true',
    );
  });

  it('renders the logging in loading component for MSAL loading state', async () => {
    expect.hasAssertions();

    resetAuthElementMocks();

    authElementMocks.msalTemplateMode = 'loading';
    const { default: AuthenticatedElement } =
      await import('../../../ClientApp/src/authentication/AuthenticatedElement');

    render(<AuthenticatedElement />);

    expect(screen.getByRole('status')).toHaveTextContent('Logging in...');
  });

  it('redirects 404 route errors to the not found route', async () => {
    expect.hasAssertions();

    resetAuthElementMocks();

    authElementMocks.msalTemplateMode = 'error';
    authElementMocks.routeError = { status: 404 };
    authElementMocks.isRouteErrorResponse = true;
    const { default: AuthenticatedElement } =
      await import('../../../ClientApp/src/authentication/AuthenticatedElement');

    render(<AuthenticatedElement />);

    expect(authElementMocks.setActiveAccount).toHaveBeenCalledWith(null);
    expect(screen.getByTestId('navigate')).toHaveTextContent('/not-found');
  });

  it('redirects non-404 route errors to the server error route', async () => {
    expect.hasAssertions();

    resetAuthElementMocks();

    authElementMocks.msalTemplateMode = 'error';
    authElementMocks.routeError = { status: 500 };
    authElementMocks.isRouteErrorResponse = true;
    const { default: AuthenticatedElement } =
      await import('../../../ClientApp/src/authentication/AuthenticatedElement');

    render(<AuthenticatedElement />);

    expect(authElementMocks.setActiveAccount).toHaveBeenCalledWith(null);
    expect(screen.getByTestId('navigate')).toHaveTextContent('/server-error');
  });

  it('redirects non-route errors to the home route', async () => {
    expect.hasAssertions();

    resetAuthElementMocks();

    authElementMocks.msalTemplateMode = 'error';
    authElementMocks.routeError = new Error('Auth failed');
    authElementMocks.isRouteErrorResponse = false;
    const { default: AuthenticatedElement } =
      await import('../../../ClientApp/src/authentication/AuthenticatedElement');

    render(<AuthenticatedElement />);

    expect(authElementMocks.setActiveAccount).toHaveBeenCalledWith(null);
    expect(screen.getByTestId('navigate')).toHaveTextContent('/');
  });
});
