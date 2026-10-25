import { render, screen, waitFor } from '@testing-library/react';

import '@testing-library/jest-dom/vitest';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MemoryRouter, Route, Routes } from 'react-router';

import type * as ReactRouterModule from 'react-router';

import type * as WebApiClientModule from '../../../../ClientApp/src/api/web-api-client';

import type { AccountDetails } from '../../../../ClientApp/src/authentication/accountContext';

const mocks = vi.hoisted(() => {
  const acquireTokenSilent = vi.fn();
  const instance = { acquireTokenSilent };
  return {
    acquireTokenSilent,
    instance,
    msalAccounts: [{ homeAccountId: 'account-1' }] as {
      homeAccountId: string;
    }[],
    setAuthToken: vi.fn(),
    getStepStatuses: vi.fn(),
    getQuoteRequestDetails: vi.fn(),
    appLoggerError: vi.fn(),
    appLoggerVerbose: vi.fn(),
    useAccountState: vi.fn(),
    navigate: vi.fn(),
  };
});

vi.mock(
  import('@azure/msal-react'),
  () =>
    ({
      useMsal: () => ({
        accounts: mocks.msalAccounts,
        instance: mocks.instance,
      }),
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(import('react-router'), async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouterModule>();
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  } satisfies __ExactMockModule<__TestMockModule11>;
});

vi.mock(
  import('../../../../ClientApp/src/authentication/hooks'),
  () =>
    ({
      useAccountState: mocks.useAccountState,
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

vi.mock(
  import('../../../../ClientApp/src/authentication/authConfig'),
  () =>
    ({
      tokenRequest: { scopes: ['scope'] },
    }) satisfies __ExactMockModule<__TestMockModule8>,
);

vi.mock(
  import('../../../../ClientApp/src/api/web-api-client'),
  async (importOriginal) => {
    const actual = await importOriginal<typeof WebApiClientModule>();
    return {
      ...actual,
      AcceptQuoteClient: vi.fn(function AcceptQuoteClientMock() {
        return {
          setAuthToken: mocks.setAuthToken,
          getStepStatuses: mocks.getStepStatuses,
        };
      }),
      QuoteClient: vi.fn(function QuoteClientMock() {
        return {
          setAuthToken: mocks.setAuthToken,
          getQuoteRequestDetails: mocks.getQuoteRequestDetails,
        };
      }),
    } satisfies __ExactMockModule<__TestMockModule4>;
  },
);

vi.mock(
  import('../../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: {
        error: mocks.appLoggerError,
        verbose: mocks.appLoggerVerbose,
      },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

vi.mock(
  import('../../../../ClientApp/src/components/BlockUISpinner'),
  () =>
    ({
      default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid='block-spinner'>{children}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule14>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Utilities/useBodyClass'),
  () =>
    ({
      default: () => {},
    }) satisfies __ExactMockModule<__TestMockModule59>,
);

vi.mock(
  import('../../../../ClientApp/src/components/forms/WizardForm'),
  () =>
    ({
      default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid='wizard-form'>{children}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule60>,
);

vi.mock(
  import('../../../../ClientApp/src/components/forms/WizardForm/WizardStep'),
  () =>
    ({
      default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid='wizard-step'>{children}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule24>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/acceptQuote/reportRecipient'),
  () =>
    ({
      default: () => <div data-testid='step-report-recipient' />,
    }) satisfies __ExactMockModule<__TestMockModule61>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/acceptQuote/deliveryAndReturn'),
  () =>
    ({
      default: () => <div data-testid='step-delivery-and-return' />,
    }) satisfies __ExactMockModule<__TestMockModule62>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/acceptQuote/paymentDetails'),
  () =>
    ({
      default: () => <div data-testid='step-payment-details' />,
    }) satisfies __ExactMockModule<__TestMockModule63>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/acceptQuote/summaryAndAccept'),
  () =>
    ({
      default: () => <div data-testid='step-summary-and-accept' />,
    }) satisfies __ExactMockModule<__TestMockModule64>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/acceptQuote/reportRecipientProps'),
  () =>
    ({
      default: () => ({}),
    }) satisfies __ExactMockModule<__TestMockModule65>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/acceptQuote/deliveryAndReturnProps'),
  () =>
    ({
      default: () => ({}),
    }) satisfies __ExactMockModule<__TestMockModule66>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/acceptQuote/paymentDetailsProps'),
  () =>
    ({
      default: () => ({}),
    }) satisfies __ExactMockModule<__TestMockModule67>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/acceptQuote/summaryAndAcceptProps'),
  () =>
    ({
      default: () => ({}),
    }) satisfies __ExactMockModule<__TestMockModule68>,
);

const accountDetails = {
  homeAccountId: 'account-1',
  givenName: 'Alex',
  familyName: 'Tester',
} as AccountDetails;

const stepStatus = [{ crmQuoteRequestId: 'CRM-Q-42', status: 'Saved' }];

describe('acceptQuote container', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.msalAccounts.splice(0, mocks.msalAccounts.length, {
      homeAccountId: 'account-1',
    });
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.useAccountState.mockReturnValue({ details: accountDetails });
    mocks.getStepStatuses.mockResolvedValue(stepStatus);
    mocks.getQuoteRequestDetails.mockResolvedValue({
      quoteRequestIdNum: 'RFQ-NUM-42',
    });
  });
  const renderAcceptQuote = async () => {
    const AcceptQuote = (
      await import('../../../../ClientApp/src/routes/acceptQuote/index')
    ).default;
    return render(
      <MemoryRouter initialEntries={['/accept-quote/Q-42']}>
        <Routes>
          <Route path='/accept-quote/:id' element={<AcceptQuote />} />
          <Route path='/not-found' element={<div data-testid='not-found' />} />
        </Routes>
      </MemoryRouter>,
    );
  };
  it('shows the loading spinner while step statuses are being fetched', async () => {
    expect.assertions(3);
    mocks.getStepStatuses.mockReturnValue(new Promise(() => {})); // never resolves
    await renderAcceptQuote();

    expect(screen.getByTestId('block-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('wizard-form')).not.toBeInTheDocument();
  });
});

describe('acceptQuote container', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.msalAccounts.splice(0, mocks.msalAccounts.length, {
      homeAccountId: 'account-1',
    });
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.useAccountState.mockReturnValue({ details: accountDetails });
    mocks.getStepStatuses.mockResolvedValue(stepStatus);
    mocks.getQuoteRequestDetails.mockResolvedValue({
      quoteRequestIdNum: 'RFQ-NUM-42',
    });
  });
  const renderAcceptQuote = async () => {
    const AcceptQuote = (
      await import('../../../../ClientApp/src/routes/acceptQuote/index')
    ).default;
    return render(
      <MemoryRouter initialEntries={['/accept-quote/Q-42']}>
        <Routes>
          <Route path='/accept-quote/:id' element={<AcceptQuote />} />
          <Route path='/not-found' element={<div data-testid='not-found' />} />
        </Routes>
      </MemoryRouter>,
    );
  };
  it('renders the four-step WizardForm once step statuses resolve', async () => {
    expect.assertions(1);
    await renderAcceptQuote();
    await waitFor(() =>
      expect(screen.getByTestId('wizard-form')).toBeInTheDocument(),
    );
  });
});

describe('acceptQuote container', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.msalAccounts.splice(0, mocks.msalAccounts.length, {
      homeAccountId: 'account-1',
    });
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.useAccountState.mockReturnValue({ details: accountDetails });
    mocks.getStepStatuses.mockResolvedValue(stepStatus);
    mocks.getQuoteRequestDetails.mockResolvedValue({
      quoteRequestIdNum: 'RFQ-NUM-42',
    });
  });
  const renderAcceptQuote = async () => {
    const AcceptQuote = (
      await import('../../../../ClientApp/src/routes/acceptQuote/index')
    ).default;
    return render(
      <MemoryRouter initialEntries={['/accept-quote/Q-42']}>
        <Routes>
          <Route path='/accept-quote/:id' element={<AcceptQuote />} />
          <Route path='/not-found' element={<div data-testid='not-found' />} />
        </Routes>
      </MemoryRouter>,
    );
  };
  it('renders the four-step WizardForm once step statuses resolve', async () => {
    expect.assertions(1);
    await renderAcceptQuote();
    expect(screen.queryByTestId('block-spinner')).not.toBeInTheDocument();
  });
});
