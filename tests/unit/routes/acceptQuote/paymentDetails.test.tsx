import { render, screen, waitFor } from '@testing-library/react';

import { Formik } from 'formik';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  InvoiceSentToValues,
  type AcceptQuotePreInfoDto,
} from '@/api/web-api-client';

import type * as WebApiClientModule from '@/api/web-api-client';

import PaymentDetails from '@/routes/acceptQuote/paymentDetails';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { acquireTokenSilentMock, msalContext } = vi.hoisted(() => {
  const acquireTokenSilentMock = vi.fn();
  // Stable object prevents useEffect re-firing due to new object identity on every useMsal() call
  const msalContext = {
    accounts: [{ homeAccountId: 'test-account' }],
    instance: { acquireTokenSilent: acquireTokenSilentMock },
  };
  return { acquireTokenSilentMock, msalContext };
});

const mockGetPaymentDetails = vi.hoisted(() => vi.fn());

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock(
  import('@azure/msal-react'),
  () =>
    ({
      useMsal: () => msalContext,
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(import('@/api/web-api-client'), async (importOriginal) => {
  const actual = await importOriginal<typeof WebApiClientModule>();
  return {
    ...actual,
    AcceptQuoteClient: vi.fn(function (this: {
      setAuthToken: (token: string) => void;
      getPaymentDetails: typeof mockGetPaymentDetails;
    }) {
      vi.spyOn(this, 'setAuthToken').mockImplementation();
      this['getPaymentDetails'] = mockGetPaymentDetails;
    }),
  } satisfies __ExactMockModule<__TestMockModule4>;
});

vi.mock(
  import('@/instrumentation/AppLogger'),
  () =>
    ({
      default: { verbose: vi.fn(), error: vi.fn() },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

// Stub form-input children — they require Formik context which is outside this component's scope
vi.mock(
  import('@/components/Inputs/TextInput'),
  () =>
    ({
      default: ({
        inlineHelp,
        name,
      }: {
        inlineHelp?: React.ReactNode;
        name: string;
      }) => (
        <div data-testid={`text-input`} data-name={name}>
          {inlineHelp}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule29>,
);

vi.mock(
  import('@/components/Inputs/RadioButtonGroup'),
  () =>
    ({
      default: ({ name }: { name: string }) => (
        <div data-testid={`radio-group`} data-name={name} />
      ),
    }) satisfies __ExactMockModule<__TestMockModule52>,
);

vi.mock(
  import('@/components/forms/HidableField'),
  () =>
    ({
      default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }) satisfies __ExactMockModule<__TestMockModule70>,
);

vi.mock(
  import('@/components/forms/CommonForms/ContactDetails'),
  () =>
    ({
      default: () => <div data-testid='contact-details' />,
    }) satisfies __ExactMockModule<__TestMockModule71>,
);

vi.mock(
  import('@/components/BlockUISpinner'),
  () =>
    ({
      default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid='spinner'>{children}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule14>,
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePreInfo(
  paymentTerms: string,
  quotationIdNum?: string,
): {
  acceptQuotePreInfo: AcceptQuotePreInfoDto;
} {
  return {
    acceptQuotePreInfo: {
      paymentTerms,
      quotationIdNum,
    } as AcceptQuotePreInfoDto,
  };
}

const defaultProps = { id: 'TEST-001' };

const renderPaymentDetails = (
  props: React.ComponentProps<typeof PaymentDetails> = defaultProps,
) =>
  render(
    <Formik
      initialValues={
        props.isSummary
          ? { paymentDetails: {} }
          : {
              purchaseOrderNo: '',
              invoiceSentTo: InvoiceSentToValues.SamePerson,
              contact: {},
            }
      }
      initialStatus={{ hidden: {} }}
      onSubmit={() => {}}
    >
      <PaymentDetails {...props} />
    </Formik>,
  );

describe(PaymentDetails, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    acquireTokenSilentMock.mockResolvedValue({ accessToken: 'test-token' });
    msalContext.instance.acquireTokenSilent = acquireTokenSilentMock;
    mockGetPaymentDetails.mockResolvedValue(makePreInfo('Standard'));
  });
  describe('info Alert visibility', () => {
    it('renders the info Alert in non-summary mode', () => {
      expect.assertions(1);
      acquireTokenSilentMock.mockReturnValue(new Promise(() => {}));
      renderPaymentDetails();

      expect(screen.getByTestId('info-summary')).toBeInTheDocument();
    });
  });
});

describe(PaymentDetails, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    acquireTokenSilentMock.mockResolvedValue({ accessToken: 'test-token' });
    msalContext.instance.acquireTokenSilent = acquireTokenSilentMock;
    mockGetPaymentDetails.mockResolvedValue(makePreInfo('Standard'));
  });
  describe('info Alert visibility', () => {
    it('does not render the info Alert in summary mode', () => {
      expect.assertions(1);
      acquireTokenSilentMock.mockReturnValue(new Promise(() => {}));
      renderPaymentDetails({ ...defaultProps, isSummary: true });

      expect(screen.queryByTestId('info-summary')).not.toBeInTheDocument();
    });
  });
});

describe(PaymentDetails, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    acquireTokenSilentMock.mockResolvedValue({ accessToken: 'test-token' });
    msalContext.instance.acquireTokenSilent = acquireTokenSilentMock;
    mockGetPaymentDetails.mockResolvedValue(makePreInfo('Standard'));
  });
  describe('payment-terms conditional copy', () => {
    it('shows the 30-day invoice warning when paymentTerms is not Prepaid', async () => {
      expect.assertions(2);
      mockGetPaymentDetails.mockResolvedValue(makePreInfo('Standard'));
      renderPaymentDetails();

      await waitFor(() => {
        expect(
          screen.getByText(/30 days of NMI invoice date/),
        ).toBeInTheDocument();
      });

      expect(screen.queryByText(/Prepayment required/)).not.toBeInTheDocument();
    });
  });
});
