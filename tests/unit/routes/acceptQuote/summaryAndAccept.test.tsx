import { Form, Formik } from 'formik';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ReactRouterModule from 'react-router';
import SummaryAndAccept from '../../../../ClientApp/src/routes/acceptQuote/summaryAndAccept';

const mocks = vi.hoisted(() => {
  const acquireTokenSilent = vi
    .fn()
    .mockResolvedValue({ accessToken: 'mock-token' });
  const getSummaryAndAccept = vi.fn();
  const route = { id: 'quote-1' };

  return {
    acquireTokenSilent,
    getSummaryAndAccept,
    route,
    accounts: [{ homeAccountId: 'mock-account' }],
    instance: { acquireTokenSilent },
  };
});

vi.mock(
  '@azure/msal-react',
  () =>
    ({
      useMsal: () => ({
        accounts: mocks.accounts,
        instance: mocks.instance,
      }),
    }) satisfies __ExactMockModule<__TestMockModule2>
);

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
    }) satisfies __ExactMockModule<__TestMockModule26>
);

vi.mock(
  '../../../../ClientApp/src/api/web-api-client',
  () =>
    ({
      AcceptQuoteClient: class {
        setAuthToken = vi.fn();

        getSummaryAndAccept = mocks.getSummaryAndAccept;
      },
      DashboardClient: class {
        setAuthToken = vi.fn();
      },
    }) satisfies __ExactMockModule<__TestMockModule4>
);

vi.mock(
  '../../../../ClientApp/src/instrumentation/AppLogger',
  () =>
    ({
      default: { verbose: vi.fn(), error: vi.fn() },
    }) satisfies __ExactMockModule<__TestMockModule5>
);

vi.mock(
  '../../../../ClientApp/src/storage/notification',
  () =>
    ({
      getDashboardNotification: vi.fn(() => undefined),
      clearDashboardNotification: vi.fn(),
      setDashboardNotification: vi.fn(),
      clearDashboardInfoNotification: vi.fn(),
    }) satisfies __ExactMockModule<__TestMockModule46>
);

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
    }) satisfies __ExactMockModule<__TestMockModule74>
);

vi.mock(
  '../../../../ClientApp/src/components/Buttons/EditButton',
  () =>
    ({
      default: () => <button type='button'>Edit</button>,
    }) satisfies __ExactMockModule<__TestMockModule75>
);

vi.mock(
  '../../../../ClientApp/src/components/HeaderIntroText',
  () =>
    ({
      default: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule76>
);

vi.mock(
  '../../../../ClientApp/src/components/Utilities/useBodyClass',
  () =>
    ({
      default: () => {},
    }) satisfies __ExactMockModule<__TestMockModule59>
);

vi.mock(
  '../../../../ClientApp/src/routes/acceptQuote/reportRecipient',
  () =>
    ({
      default: () => <div>Report recipient</div>,
    }) satisfies __ExactMockModule<__TestMockModule61>
);

vi.mock(
  '../../../../ClientApp/src/routes/acceptQuote/deliveryAndReturn',
  () =>
    ({
      default: () => <div>Delivery and return</div>,
    }) satisfies __ExactMockModule<__TestMockModule62>
);

vi.mock(
  '../../../../ClientApp/src/routes/acceptQuote/paymentDetails',
  () =>
    ({
      default: () => <div>Payment details</div>,
    }) satisfies __ExactMockModule<__TestMockModule63>
);

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
    }) satisfies __ExactMockModule<__TestMockModule77>
);

vi.mock(
  '../../../../ClientApp/src/routes/acceptQuote/quotationSummary',
  () =>
    ({
      default: () => <div>Quotation summary</div>,
    }) satisfies __ExactMockModule<__TestMockModule73>
);

vi.mock(
  '../../../../ClientApp/src/components/BlockUISpinner',
  () =>
    ({
      default: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule14>
);

vi.mock(
  '../../../../ClientApp/src/components/Alert/NotificationMessage',
  () =>
    ({
      default: () => null,
    }) satisfies __ExactMockModule<__TestMockModule48>
);

vi.mock(
  '../../../../ClientApp/src/components/Icons/ExternalLinkIcon',
  () =>
    ({
      default: () => <span aria-hidden='true'>icon</span>,
    }) satisfies __ExactMockModule<__TestMockModule78>
);

vi.mock(
  '../../../../ClientApp/src/routes/common/helperFunctions',
  () =>
    ({
      getFileUrlFromBase64: vi.fn(),
      openPdfPageInNewTab: vi.fn(),
    }) satisfies __ExactMockModule<__TestMockModule9>
);

function renderComponent() {
  return render(
    <Formik initialValues={{}} onSubmit={() => {}}>
      <Form>
        <SummaryAndAccept />
      </Form>
    </Formik>
  );
}

describe(SummaryAndAccept, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.route.id = 'quote-1';
    mocks.getSummaryAndAccept.mockResolvedValue({
      acceptQuotePreInfo: {},
      requestForQuote: {},
      rfqOrganisation: {},
    });
  });

  it('skips the API call when no MSAL accounts are available', async () => {
    mocks.accounts = [];
    renderComponent();

    await new Promise((r) => {
      setTimeout(r, 50);
    });

    expect(mocks.getSummaryAndAccept).not.toHaveBeenCalled();

    mocks.accounts = [{ homeAccountId: 'mock-account' }];
  });

  it('re-fetches summary data when the route id changes', async () => {
    const { rerender } = renderComponent();

    await waitFor(() => {
      expect(mocks.getSummaryAndAccept).toHaveBeenCalledWith('quote-1');
    });

    mocks.route.id = 'quote-2';
    rerender(
      <Formik initialValues={{}} onSubmit={() => {}}>
        <Form>
          <SummaryAndAccept />
        </Form>
      </Formik>
    );

    await waitFor(() => {
      expect(mocks.getSummaryAndAccept).toHaveBeenCalledWith('quote-2');
    });
  });
});
