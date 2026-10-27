import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { InteractionStatus } from '@azure/msal-browser';
import type { IPublicClientApplication } from '@azure/msal-browser';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import type {
  default as UseAccountContext,
  useAccountDispatch as UseAccountDispatch,
} from '../../../ClientApp/src/authentication/hooks';
import FAQs from '../../../ClientApp/src/routes/help-guide/faqs';
import HelpGuide from '../../../ClientApp/src/routes/help-guide';
import HelpHowToSetupAccess from '../../../ClientApp/src/routes/help-guide/how-to-setup-access';
import ServicesWeOffer from '../../../ClientApp/src/routes/services-we-offer';
import SignIn from '../../../ClientApp/src/routes/sign-in';
import Signout from '../../../ClientApp/src/routes/sign-out';
import SignoutHelper from '../../../ClientApp/src/routes/sign-out-helper';
import { clearTargetOrganisation } from '../../../ClientApp/src/storage/targetOrganisation';

const mocks = vi.hoisted(() => ({
  useIsAuthenticated: vi.fn<(...args: unknown[]) => unknown>(),
  useMsal: vi.fn<(...args: unknown[]) => unknown>(),
  handleRedirectPromise: vi.fn<(...args: unknown[]) => unknown>(),
  logoutRedirect: vi.fn<(...args: unknown[]) => unknown>(),
  getActiveAccount: vi.fn<(...args: unknown[]) => unknown>(),
  clearTargetOrganisation: vi.fn<(...args: unknown[]) => unknown>(),
  useAccountContext: vi.fn<(...args: unknown[]) => unknown>(),
  useAccountDispatch: vi.fn<(...args: unknown[]) => unknown>(),
}));

vi.mock(
  import('@azure/msal-react'),
  (() =>
    ({
      useIsAuthenticated:
        mocks.useIsAuthenticated as unknown as typeof useIsAuthenticated,
      useMsal: mocks.useMsal as unknown as typeof useMsal,
    }) satisfies __ExactMockModule<__TestMockModule2>) as unknown as __DynamicPartialMockFactory<__TestMockModule2>,
);

vi.mock(
  import('../../../ClientApp/src/storage/targetOrganisation'),
  (() =>
    ({
      clearTargetOrganisation: mocks.clearTargetOrganisation,
    }) satisfies __ExactMockModule<__TestMockModule6>) as unknown as __DynamicPartialMockFactory<__TestMockModule6>,
);

vi.mock(
  import('../../../ClientApp/src/authentication/hooks'),
  (() =>
    ({
      default: mocks.useAccountContext as unknown as typeof UseAccountContext,
      useAccountDispatch:
        mocks.useAccountDispatch as unknown as typeof UseAccountDispatch,
    }) satisfies __ExactMockModule<__TestMockModule26>) as unknown as __DynamicPartialMockFactory<__TestMockModule26>,
);

const renderRoute = (ui: React.ReactNode) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

const resetStaticPagesState = () => {
  vi.clearAllMocks();
  document.body.className = '';
  document.title = '';
  mocks.useIsAuthenticated.mockReturnValue(false);
  mocks.useMsal.mockReturnValue({
    instance: {
      handleRedirectPromise: mocks.handleRedirectPromise.mockResolvedValue(
        undefined,
      ) as unknown as IPublicClientApplication['handleRedirectPromise'],
      logoutRedirect: mocks.logoutRedirect.mockResolvedValue(
        undefined,
      ) as unknown as IPublicClientApplication['logoutRedirect'],
      getActiveAccount: mocks.getActiveAccount.mockReturnValue({
        homeAccountId: 'account-1',
      }) as unknown as IPublicClientApplication['getActiveAccount'],
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
    setUserProfile: vi.fn<(...args: unknown[]) => unknown>(),
  });
};

describe('static route pages', () => {
  it('renders HelpGuide for unauthenticated users with home navigation', () => {
    expect.hasAssertions();

    resetStaticPagesState();

    renderRoute(<HelpGuide />);

    expect({
      heading: screen.getByRole('heading', { name: 'Help guide', level: 1 })
        .textContent,
      setupHref: screen
        .getByRole('link', { name: /How to set up access/i })
        .getAttribute('href'),
      faqHref: screen
        .getByRole('link', { name: /Frequently Asked Questions/i })
        .getAttribute('href'),
      feedbackTarget: screen
        .getByRole('link', { name: /Give us your feedback/i })
        .getAttribute('target'),
      homeHref: screen
        .getByRole('link', { name: /Back to home/i })
        .getAttribute('href'),
      title: document.title,
      bodyClass: document.body.classList.contains('help-guide'),
    }).toStrictEqual({
      heading: 'Help guide',
      setupHref: '/help-guide/how-to-setup-access',
      faqHref: '/help-guide/faqs',
      feedbackTarget: '_blank',
      homeHref: '/',
      title: 'Help guide | NMI Services portal',
      bodyClass: true,
    });
  });

  it('renders HelpGuide dashboard navigation for authenticated users', () => {
    expect.hasAssertions();

    resetStaticPagesState();

    vi.mocked(useIsAuthenticated).mockReturnValue(true);

    renderRoute(<HelpGuide />);

    expect(
      screen.getByRole('link', { name: /Back to dashboard/i }),
    ).toHaveAttribute('href', '/dashboard');
  });

  it('renders FAQ and setup guide help pages with table-of-contents links', () => {
    expect.hasAssertions();

    resetStaticPagesState();

    const { unmount } = renderRoute(<FAQs />);

    expect({
      heading: screen.getByRole('heading', {
        name: 'Frequently Asked Questions (FAQs)',
        level: 1,
      }).textContent,
      navigation: screen.getByRole('navigation', { name: 'On this page' })
        .textContent,
      portalBenefitsHref: screen
        .getByRole('link', { name: 'Portal benefits' })
        .getAttribute('href'),
      backHref: screen
        .getByRole('link', { name: /Back to help guide/i })
        .getAttribute('href'),
    }).toStrictEqual({
      heading: 'Frequently Asked Questions (FAQs)',
      navigation: expect.any(String),
      portalBenefitsHref: '#faqs-01',
      backHref: '/help-guide',
    });

    unmount();

    renderRoute(<HelpHowToSetupAccess />);

    expect({
      heading: screen.getByRole('heading', {
        name: /How to set up access to the .*NMI Services portal/i,
        level: 1,
      }).textContent,
      navigation: screen.getByRole('navigation', { name: 'On this page' })
        .textContent,
      faqsHref: screen
        .getByRole('link', { name: /View FAQs/i })
        .getAttribute('href'),
    }).toStrictEqual({
      heading: expect.stringMatching(
        /How to set up access to the .*NMI Services portal/i,
      ),
      navigation: expect.any(String),
      faqsHref: '/help-guide/faqs/',
    });
  });

  it('renders services offered and the simple sign-in/helper pages', () => {
    expect.hasAssertions();

    resetStaticPagesState();

    const { unmount } = renderRoute(<ServicesWeOffer />);

    expect({
      heading: screen.getByRole('heading', {
        name: 'Services we offer',
        level: 1,
      }).textContent,
      group: screen.getByRole('group', {
        name: /Set your default view and\/or add more NMI services/i,
      }).textContent,
      title: document.title,
      bodyClass: document.body.classList.contains('services-we-offer'),
    }).toStrictEqual({
      heading: 'Services we offer',
      group: expect.any(String),
      title: 'Services we offer | NMI Services portal',
      bodyClass: true,
    });

    unmount();

    render(<SignIn />);

    expect(
      screen.getByRole('heading', { name: 'Logging in...' }).textContent,
    ).toBe('Logging in...');

    unmount();
    renderRoute(<SignoutHelper />);

    expect(
      screen.getByRole('heading', { name: /close your browser window/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exit portal' })).toHaveAttribute(
      'href',
      'https://measurement.gov.au',
    );
  });

  it('runs sign-out redirect when MSAL is idle', async () => {
    expect.hasAssertions();

    resetStaticPagesState();

    render(<Signout />);

    expect(screen.getByText('Logging out...')).toBeInTheDocument();

    await waitFor(() =>
      expect(mocks.handleRedirectPromise).toHaveBeenCalledWith(),
    );

    expect(clearTargetOrganisation).toHaveBeenCalledWith();
    expect(mocks.logoutRedirect).toHaveBeenCalledWith({
      account: { homeAccountId: 'account-1' },
    });
  });

  it('skips sign-out redirect while an interaction is already running', async () => {
    expect.hasAssertions();

    resetStaticPagesState();

    expect.hasAssertions();

    resetStaticPagesState();

    vi.mocked(useMsal).mockReturnValue({
      instance: {
        handleRedirectPromise:
          mocks.handleRedirectPromise.mockResolvedValue(undefined),
        logoutRedirect: mocks.logoutRedirect.mockResolvedValue(undefined),
        getActiveAccount: mocks.getActiveAccount,
      },
      inProgress: InteractionStatus.AcquireToken,
    } as unknown as ReturnType<typeof useMsal>);

    render(<Signout />);

    await waitFor(() =>
      expect(mocks.handleRedirectPromise).toHaveBeenCalledWith(),
    );

    expect(mocks.logoutRedirect).not.toHaveBeenCalled();
    expect(clearTargetOrganisation).toHaveBeenCalledWith();
  });

  it('does not restart sign-out after the effect has been cleaned up', async () => {
    expect.hasAssertions();

    resetStaticPagesState();

    const { rerender } = render(<Signout />);
    await waitFor(() =>
      expect(mocks.handleRedirectPromise).toHaveBeenCalledTimes(1),
    );

    vi.mocked(useMsal).mockReturnValue({
      instance: {
        handleRedirectPromise: mocks.handleRedirectPromise,
        logoutRedirect: mocks.logoutRedirect,
        getActiveAccount: mocks.getActiveAccount,
      },
      inProgress: InteractionStatus.AcquireToken,
    } as unknown as ReturnType<typeof useMsal>);
    rerender(<Signout />);

    await waitFor(() =>
      expect(mocks.handleRedirectPromise).toHaveBeenCalledTimes(1),
    );

    expect(clearTargetOrganisation).toHaveBeenCalledTimes(1);
  });
});
