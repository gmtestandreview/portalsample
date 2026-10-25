import { render, screen, waitFor } from '@testing-library/react';

import { MemoryRouter } from 'react-router';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InteractionStatus } from '@azure/msal-browser';

import { useIsAuthenticated, useMsal } from '@azure/msal-react';

import FAQs from '../../../ClientApp/src/routes/help-guide/faqs';

import HelpGuide from '../../../ClientApp/src/routes/help-guide';

import HelpHowToSetupAccess from '../../../ClientApp/src/routes/help-guide/how-to-setup-access';

import ServicesWeOffer from '../../../ClientApp/src/routes/services-we-offer';

import SignIn from '../../../ClientApp/src/routes/sign-in';

import Signout from '../../../ClientApp/src/routes/sign-out';

import SignoutHelper from '../../../ClientApp/src/routes/sign-out-helper';

import { clearTargetOrganisation } from '../../../ClientApp/src/storage/targetOrganisation';

const mocks = vi.hoisted(() => ({
  useIsAuthenticated: vi.fn(),
  useMsal: vi.fn(),
  handleRedirectPromise: vi.fn(),
  logoutRedirect: vi.fn(),
  getActiveAccount: vi.fn(),
  clearTargetOrganisation: vi.fn(),
  useAccountContext: vi.fn(),
  useAccountDispatch: vi.fn(),
}));

vi.mock(
  import('@azure/msal-react'),
  () =>
    ({
      useIsAuthenticated: mocks.useIsAuthenticated,
      useMsal: mocks.useMsal,
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(
  import('../../../ClientApp/src/storage/targetOrganisation'),
  () =>
    ({
      clearTargetOrganisation: mocks.clearTargetOrganisation,
    }) satisfies __ExactMockModule<__TestMockModule6>,
);

vi.mock(
  import('../../../ClientApp/src/authentication/hooks'),
  () =>
    ({
      default: mocks.useAccountContext,
      useAccountDispatch: mocks.useAccountDispatch,
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

const renderRoute = (ui: React.ReactNode) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('static route pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.className = '';
    document.title = '';
    mocks.useIsAuthenticated.mockReturnValue(false);
    mocks.useMsal.mockReturnValue({
      instance: {
        handleRedirectPromise:
          mocks.handleRedirectPromise.mockResolvedValue(undefined),
        logoutRedirect: mocks.logoutRedirect.mockResolvedValue(undefined),
        getActiveAccount: mocks.getActiveAccount.mockReturnValue({
          homeAccountId: 'account-1',
        }),
      },
      accounts: [],
      inProgress: InteractionStatus.None,
    });
    mocks.useAccountContext.mockReturnValue({
      details: {
        userProfile: {
          services: [],
        },
      },
    });
    mocks.useAccountDispatch.mockReturnValue({
      setUserProfile: vi.fn(),
    });
  });
  it('renders HelpGuide for unauthenticated users with home navigation', () => {
    expect.assertions(1);
    renderRoute(<HelpGuide />);
    expect(
      screen.getByRole('heading', { name: 'Help guide', level: 1 }),
    ).toBeInTheDocument();
  });
});

describe('static route pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.className = '';
    document.title = '';
    mocks.useIsAuthenticated.mockReturnValue(false);
    mocks.useMsal.mockReturnValue({
      instance: {
        handleRedirectPromise:
          mocks.handleRedirectPromise.mockResolvedValue(undefined),
        logoutRedirect: mocks.logoutRedirect.mockResolvedValue(undefined),
        getActiveAccount: mocks.getActiveAccount.mockReturnValue({
          homeAccountId: 'account-1',
        }),
      },
      accounts: [],
      inProgress: InteractionStatus.None,
    });
    mocks.useAccountContext.mockReturnValue({
      details: {
        userProfile: {
          services: [],
        },
      },
    });
    mocks.useAccountDispatch.mockReturnValue({
      setUserProfile: vi.fn(),
    });
  });
  it('renders HelpGuide for unauthenticated users with home navigation', () => {
    expect.assertions(1);
    renderRoute(<HelpGuide />);
    expect(
      screen.getByRole('link', { name: /How to set up access/i }),
    ).toHaveAttribute('href', '/help-guide/how-to-setup-access');
  });
});

describe('static route pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.className = '';
    document.title = '';
    mocks.useIsAuthenticated.mockReturnValue(false);
    mocks.useMsal.mockReturnValue({
      instance: {
        handleRedirectPromise:
          mocks.handleRedirectPromise.mockResolvedValue(undefined),
        logoutRedirect: mocks.logoutRedirect.mockResolvedValue(undefined),
        getActiveAccount: mocks.getActiveAccount.mockReturnValue({
          homeAccountId: 'account-1',
        }),
      },
      accounts: [],
      inProgress: InteractionStatus.None,
    });
    mocks.useAccountContext.mockReturnValue({
      details: {
        userProfile: {
          services: [],
        },
      },
    });
    mocks.useAccountDispatch.mockReturnValue({
      setUserProfile: vi.fn(),
    });
  });
  it('renders HelpGuide for unauthenticated users with home navigation', () => {
    expect.assertions(1);
    renderRoute(<HelpGuide />);
    expect(
      screen.getByRole('link', { name: /Frequently Asked Questions/i }),
    ).toHaveAttribute('href', '/help-guide/faqs');
  });
});

describe('static route pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.className = '';
    document.title = '';
    mocks.useIsAuthenticated.mockReturnValue(false);
    mocks.useMsal.mockReturnValue({
      instance: {
        handleRedirectPromise:
          mocks.handleRedirectPromise.mockResolvedValue(undefined),
        logoutRedirect: mocks.logoutRedirect.mockResolvedValue(undefined),
        getActiveAccount: mocks.getActiveAccount.mockReturnValue({
          homeAccountId: 'account-1',
        }),
      },
      accounts: [],
      inProgress: InteractionStatus.None,
    });
    mocks.useAccountContext.mockReturnValue({
      details: {
        userProfile: {
          services: [],
        },
      },
    });
    mocks.useAccountDispatch.mockReturnValue({
      setUserProfile: vi.fn(),
    });
  });
  it('renders HelpGuide for unauthenticated users with home navigation', () => {
    expect.assertions(1);
    renderRoute(<HelpGuide />);
    expect(
      screen.getByRole('link', { name: /Give us your feedback/i }),
    ).toHaveAttribute('target', '_blank');
  });
});

describe('static route pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.className = '';
    document.title = '';
    mocks.useIsAuthenticated.mockReturnValue(false);
    mocks.useMsal.mockReturnValue({
      instance: {
        handleRedirectPromise:
          mocks.handleRedirectPromise.mockResolvedValue(undefined),
        logoutRedirect: mocks.logoutRedirect.mockResolvedValue(undefined),
        getActiveAccount: mocks.getActiveAccount.mockReturnValue({
          homeAccountId: 'account-1',
        }),
      },
      accounts: [],
      inProgress: InteractionStatus.None,
    });
    mocks.useAccountContext.mockReturnValue({
      details: {
        userProfile: {
          services: [],
        },
      },
    });
    mocks.useAccountDispatch.mockReturnValue({
      setUserProfile: vi.fn(),
    });
  });
  it('renders HelpGuide for unauthenticated users with home navigation', () => {
    expect.assertions(1);
    renderRoute(<HelpGuide />);
    expect(screen.getByRole('link', { name: /Back to home/i })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
