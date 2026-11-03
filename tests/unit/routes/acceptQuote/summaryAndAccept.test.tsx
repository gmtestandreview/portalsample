import { Form, Formik } from 'formik';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type * as ReactRouterModule from 'react-router';
import type * as HelperFunctionsModule from '../../../../ClientApp/src/routes/common/helperFunctions';
import type * as NotificationModule from '../../../../ClientApp/src/storage/notification';
import SummaryAndAccept from '../../../../ClientApp/src/routes/acceptQuote/summaryAndAccept';

const mocks = vi.hoisted(() => {
  const acquireTokenSilent = vi
    .fn<(...args: unknown[]) => unknown>()
    .mockResolvedValue({ accessToken: 'mock-token' });
  const getSummaryAndAccept = vi.fn<(...args: unknown[]) => unknown>();
  const route = { id: 'quote-1' };

  return {
    acquireTokenSilent,
    getSummaryAndAccept,
    route,
    accounts: [{ homeAccountId: 'mock-account' }],
    instance: { acquireTokenSilent },
  };
});

// eslint-disable-next-line vitest/prefer-import-in-mock
vi.mock(
  '@azure/msal-react',
  () =>
    ({
      useMsal: () => ({
        accounts: mocks.accounts,
        instance: mocks.instance,
      }),
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

// eslint-disable-next-line vitest/prefer-import-in-mock
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouterModule>();

  return {
    ...actual,
    useParams: () => ({ id: mocks.route.id }),
    Link: ({
      children,
      to,
      ...props
    }: React.ComponentProps<'a'> & { to: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  } satisfies __ExactMockModule<__TestMockModule11>;
});

// eslint-disable-next-line vitest/prefer-import-in-mock
vi.mock(
  '../../../../ClientApp/src/authentication/hooks',
  () =>
    ({
      useAccountState: () => ({
        details: {
          givenName: 'Taylor',
          familyName: 'Nguyen',
        },
      }),
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

// eslint-disable-next-line vitest/prefer-import-in-mock
vi.mock(
  '../../../../ClientApp/src/api/web-api-client',
  () =>
    ({
      AcceptQuoteClient: class {
        setAuthToken = vi.fn<(...args: unknown[]) => unknown>();

        getSummaryAndAccept = mocks.getSummaryAndAccept;
      },
      DashboardClient: class {
        setAuthToken = vi.fn<(...args: unknown[]) => unknown>();
      },
    }) satisfies __ExactMockModule<__TestMockModule4>,
);

// eslint-disable-next-line vitest/prefer-import-in-mock
vi.mock(
  '../../../../ClientApp/src/instrumentation/AppLogger',
  () =>
    ({
      default: {
        verbose: vi.fn<(...args: unknown[]) => unknown>(),
        error: vi.fn<(...args: unknown[]) => unknown>(),
      },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

vi.mock(
  import('../../../../ClientApp/src/storage/notification'),
  () =>
    ({
      getDashboardNotification: vi.fn<
        typeof NotificationModule.getDashboardNotification
      >(() => undefined),
      clearDashboardNotification:
        vi.fn<typeof NotificationModule.clearDashboardNotification>(),
      setDashboardNotification:
        vi.fn<typeof NotificationModule.setDashboardNotification>(),
      clearDashboardInfoNotification:
        vi.fn<typeof NotificationModule.clearDashboardInfoNotification>(),
    }) satisfies __ExactMockModule<__TestMockModule46>,
);

// eslint-disable-next-line vitest/prefer-import-in-mock
vi.mock(
  '../../../../ClientApp/src/components/Accordion',
  () =>
    ({
      CustomAccordion: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      CustomAccordionBody: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule74>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Buttons/EditButton'),
  () =>
    ({
      default: () => <button type='button'>Edit</button>,
    }) satisfies __ExactMockModule<__TestMockModule75>,
);

vi.mock(
  import('../../../../ClientApp/src/components/HeaderIntroText'),
  () =>
    ({
      default: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule76>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Utilities/useBodyClass'),
  () =>
    ({
      default: vi.fn<() => void>(),
    }) satisfies __ExactMockModule<__TestMockModule59>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/acceptQuote/reportRecipient'),
  () =>
    ({
      default: () => <div>Report recipient</div>,
    }) satisfies __ExactMockModule<__TestMockModule61>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/acceptQuote/deliveryAndReturn'),
  () =>
    ({
      default: () => <div>Delivery and return</div>,
    }) satisfies __ExactMockModule<__TestMockModule62>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/acceptQuote/paymentDetails'),
  () =>
    ({
      default: () => <div>Payment details</div>,
    }) satisfies __ExactMockModule<__TestMockModule63>,
);

// eslint-disable-next-line vitest/prefer-import-in-mock
vi.mock(
  '../../../../ClientApp/src/components/InTextLink',
  () =>
    ({
      default: ({
        children,
        onClick,
      }: {
        children: React.ReactNode;
        onClick?: () => void;
      }) => (
        <button type='button' onClick={onClick}>
          {children}
        </button>
      ),
    }) satisfies __ExactMockModule<__TestMockModule77>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/acceptQuote/quotationSummary'),
  () =>
    ({
      default: () => <div>Quotation summary</div>,
    }) satisfies __ExactMockModule<__TestMockModule73>,
);

vi.mock(
  import('../../../../ClientApp/src/components/BlockUISpinner'),
  () =>
    ({
      default: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule14>,
);

// eslint-disable-next-line vitest/prefer-import-in-mock
vi.mock(
  '../../../../ClientApp/src/components/Alert/NotificationMessage',
  () =>
    ({
      default: () => null,
    }) satisfies __ExactMockModule<__TestMockModule48>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Icons/ExternalLinkIcon'),
  () =>
    ({
      default: () => <span aria-hidden='true'>icon</span>,
    }) satisfies __ExactMockModule<__TestMockModule78>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/common/helperFunctions'),
  () =>
    ({
      getFileUrlFromBase64:
        vi.fn<typeof HelperFunctionsModule.getFileUrlFromBase64>(),
      openPdfPageInNewTab:
        vi.fn<typeof HelperFunctionsModule.openPdfPageInNewTab>(),
    }) satisfies __ExactMockModule<__TestMockModule9>,
);

function renderComponent() {
  return render(
    <Formik initialValues={{}} onSubmit={vi.fn<() => void>()}>
      <Form>
        <SummaryAndAccept />
      </Form>
    </Formik>,
  );
}

const resetSummaryAndAcceptMocks = () => {
  vi.clearAllMocks();
  mocks.route.id = 'quote-1';
  mocks.accounts = [{ homeAccountId: 'mock-account' }];
  mocks.getSummaryAndAccept.mockResolvedValue({
    acceptQuotePreInfo: {},
    requestForQuote: {},
    rfqOrganisation: {},
  });
};

// eslint-disable-next-line vitest/valid-title -- function suite titles are required by vitest/prefer-describe-function-title.
describe(SummaryAndAccept, () => {
  it('skips the API call when no MSAL accounts are available', async () => {
    expect.hasAssertions();

    resetSummaryAndAcceptMocks();

    mocks.accounts = [];
    renderComponent();

    await new Promise((r) => {
      setTimeout(r, 50);
    });

    expect(mocks.getSummaryAndAccept).not.toHaveBeenCalled();

    mocks.accounts = [{ homeAccountId: 'mock-account' }];
  });

  it('re-fetches summary data when the route id changes', async () => {
    expect.hasAssertions();

    resetSummaryAndAcceptMocks();

    const { rerender } = renderComponent();

    await waitFor(() => {
      expect(mocks.getSummaryAndAccept).toHaveBeenCalledWith('quote-1');
    });

    mocks.route.id = 'quote-2';
    rerender(
      <Formik initialValues={{}} onSubmit={vi.fn<() => void>()}>
        <Form>
          <SummaryAndAccept />
        </Form>
      </Formik>,
    );

    await waitFor(() => {
      expect(mocks.getSummaryAndAccept).toHaveBeenCalledWith('quote-2');
    });
  });
});
