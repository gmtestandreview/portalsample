import { act, render, screen, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it, vi } from 'vitest';
import {
  InvoiceSentToValues,
  type AcceptQuotePreInfoDto,
} from '@/api/web-api-client';
import type * as WebApiClientModule from '@/api/web-api-client';
import paymentDetails from '@/routes/acceptQuote/paymentDetails';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { acquireTokenSilentMock, msalContext } = vi.hoisted(() => {
  const acquireTokenSilentMock = vi.fn<(...args: unknown[]) => unknown>();
  // Stable object prevents useEffect re-firing due to new object identity on every useMsal() call
  const msalContext = {
    accounts: [{ homeAccountId: 'test-account' }],
    instance: { acquireTokenSilent: acquireTokenSilentMock },
  };
  return { acquireTokenSilentMock, msalContext };
});

const mockGetPaymentDetails = vi.hoisted(() =>
  vi.fn<(...args: unknown[]) => unknown>(),
);

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock(
  '@azure/msal-react',
  () =>
    ({
      useMsal: () => msalContext,
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock('@/api/web-api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof WebApiClientModule>();
  const MockAcceptQuoteClient = vi.fn<typeof actual.AcceptQuoteClient>(
    class extends actual.AcceptQuoteClient {
      constructor(
        ...args: ConstructorParameters<typeof actual.AcceptQuoteClient>
      ) {
        super(...args);
        Object.defineProperty(this, 'setAuthToken', {
          configurable: true,
          value: vi.fn<(token: string) => void>(),
          writable: true,
        });
        Object.defineProperty(this, 'getPaymentDetails', {
          configurable: true,
          value: mockGetPaymentDetails,
          writable: true,
        });
      }
    },
  );

  return {
    ...actual,
    AcceptQuoteClient: MockAcceptQuoteClient,
  } satisfies __ExactMockModule<__TestMockModule4>;
});

vi.mock(
  '@/instrumentation/AppLogger',
  () =>
    ({
      default: {
        verbose: vi.fn<(...args: unknown[]) => unknown>(),
        error: vi.fn<(...args: unknown[]) => unknown>(),
      },
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
  '@/components/forms/HidableField',
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
    },
  };
}

function deferred<T>() {
  let resolve: (value: T | PromiseLike<T>) => void = () => undefined;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

const defaultProps = { id: 'TEST-001' };
const PaymentDetails = paymentDetails;

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
      onSubmit={vi.fn<() => void>()}
    >
      <PaymentDetails {...props} />
    </Formik>,
  );

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('payment details', () => {
  const resetPaymentDetailsMocks = () => {
    vi.clearAllMocks();
    acquireTokenSilentMock.mockResolvedValue({ accessToken: 'test-token' });
    msalContext.instance.acquireTokenSilent = acquireTokenSilentMock;
    mockGetPaymentDetails.mockResolvedValue(makePreInfo('Standard'));
  };

  describe('info Alert visibility', () => {
    it('renders the info Alert in non-summary mode', () => {
      expect.hasAssertions();
      expect.hasAssertions();

      resetPaymentDetailsMocks();

      acquireTokenSilentMock.mockReturnValue(
        new Promise(() => {
          // Never resolves — simulates an in-flight request for loading-state assertions.
        }),
      );
      renderPaymentDetails();

      expect(screen.getByTestId('info-summary')).toBeInTheDocument();
    });

    it('does not render the info Alert in summary mode', () => {
      expect.hasAssertions();
      expect.hasAssertions();

      resetPaymentDetailsMocks();

      acquireTokenSilentMock.mockReturnValue(
        new Promise(() => {
          // Never resolves — simulates an in-flight request for loading-state assertions.
        }),
      );
      renderPaymentDetails({ ...defaultProps, isSummary: true });

      expect(screen.queryByTestId('info-summary')).not.toBeInTheDocument();
    });
  });

  describe('payment-terms conditional copy', () => {
    it('shows the 30-day invoice warning when paymentTerms is not Prepaid', async () => {
      expect.hasAssertions();
      expect.hasAssertions();

      resetPaymentDetailsMocks();

      mockGetPaymentDetails.mockResolvedValue(makePreInfo('Standard'));
      renderPaymentDetails();

      await waitFor(() => {
        expect(
          screen.getByText(/30 days of NMI invoice date/),
        ).toBeInTheDocument();
      });

      expect(screen.queryByText(/Prepayment required/)).not.toBeInTheDocument();
    });

    it('shows the prepayment required notice when paymentTerms is Prepaid', async () => {
      expect.hasAssertions();
      expect.hasAssertions();

      resetPaymentDetailsMocks();

      mockGetPaymentDetails.mockResolvedValue(makePreInfo('Prepaid'));
      renderPaymentDetails();

      await waitFor(() => {
        expect(screen.getByText(/Prepayment required/)).toBeInTheDocument();
      });

      expect(
        screen.queryByText(/30 days of NMI invoice date/),
      ).not.toBeInTheDocument();
    });
  });

  describe('loading spinner', () => {
    it('shows the spinner during the API fetch in non-summary mode', () => {
      expect.hasAssertions();
      expect.hasAssertions();

      resetPaymentDetailsMocks();

      acquireTokenSilentMock.mockReturnValue(
        new Promise(() => {
          // Never resolves — simulates an in-flight request for loading-state assertions.
        }),
      ); // never resolves

      renderPaymentDetails();

      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('does not show the spinner in summary mode even while loading', () => {
      expect.hasAssertions();
      expect.hasAssertions();

      resetPaymentDetailsMocks();

      acquireTokenSilentMock.mockReturnValue(
        new Promise(() => {
          // Never resolves — simulates an in-flight request for loading-state assertions.
        }),
      );

      renderPaymentDetails({ ...defaultProps, isSummary: true });

      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
    });
  });

  describe('field name prefixing (getNameForUse)', () => {
    it('passes raw key names to inputs in non-summary mode', async () => {
      expect.hasAssertions();
      expect.hasAssertions();

      resetPaymentDetailsMocks();

      renderPaymentDetails({ ...defaultProps, isSummary: false });

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
      });

      expect(
        screen.getByLabelText('Purchase Order (PO) number (optional)'),
      ).toHaveAttribute('name', 'purchaseOrderNo');
      expect(
        screen.getByLabelText('The main contact person for this request'),
      ).toHaveAttribute('name', 'invoiceSentTo');
    });

    it('prefixes key names with paymentDetails. in summary mode', async () => {
      expect.hasAssertions();
      expect.hasAssertions();

      resetPaymentDetailsMocks();

      mockGetPaymentDetails.mockResolvedValue(
        makePreInfo('Standard', 'Q-SUMMARY-001'),
      );
      renderPaymentDetails({ ...defaultProps, isSummary: true });

      expect(screen.getByTestId('text-input')).toHaveAttribute(
        'data-name',
        'paymentDetails.purchaseOrderNo',
      );
      await expect(
        screen.findByText(/Q-SUMMARY-001/),
      ).resolves.toBeInTheDocument();
      expect(screen.getByTestId('radio-group')).toHaveAttribute(
        'data-name',
        'paymentDetails.invoiceSentTo',
      );
    });

    it('includes the loaded quotation ID in summary help copy', async () => {
      expect.hasAssertions();
      expect.hasAssertions();

      resetPaymentDetailsMocks();

      mockGetPaymentDetails.mockResolvedValue(
        makePreInfo('Standard', 'RFQ-2026-042'),
      );

      renderPaymentDetails({ ...defaultProps, isSummary: true });

      await expect(
        screen.findByText('Your NMI Quotation ID RFQ-2026-042'),
      ).resolves.toBeInTheDocument();
    });
  });

  it('reloads payment details when the quotation id changes', async () => {
    expect.hasAssertions();

    resetPaymentDetailsMocks();

    const view = renderPaymentDetails({ ...defaultProps, isSummary: true });

    await waitFor(() => {
      expect(mockGetPaymentDetails).toHaveBeenCalledWith('TEST-001');
    });

    mockGetPaymentDetails.mockResolvedValueOnce(
      makePreInfo('Prepaid', 'Q-TEST-002'),
    );
    view.rerender(
      <Formik
        initialValues={{ paymentDetails: {} }}
        initialStatus={{ hidden: {} }}
        onSubmit={vi.fn<() => void>()}
      >
        <PaymentDetails id='TEST-002' isSummary />
      </Formik>,
    );

    await waitFor(() => {
      expect(mockGetPaymentDetails).toHaveBeenCalledWith('TEST-002');
    });

    expect(screen.getByText(/Q-TEST-002/)).toBeInTheDocument();
  });

  it('keeps the latest payment request authoritative when responses resolve out of order', async () => {
    expect.hasAssertions();

    resetPaymentDetailsMocks();

    const firstResponse = deferred<ReturnType<typeof makePreInfo>>();
    const secondResponse = deferred<ReturnType<typeof makePreInfo>>();
    mockGetPaymentDetails.mockImplementation((requestedId: unknown) =>
      requestedId === 'TEST-001'
        ? firstResponse.promise
        : secondResponse.promise,
    );

    const view = renderPaymentDetails();

    view.rerender(
      <Formik
        initialValues={{
          purchaseOrderNo: '',
          invoiceSentTo: InvoiceSentToValues.SamePerson,
          contact: {},
        }}
        initialStatus={{ hidden: {} }}
        onSubmit={vi.fn<() => void>()}
      >
        <PaymentDetails id='TEST-002' />
      </Formik>,
    );

    await waitFor(() => {
      expect(mockGetPaymentDetails.mock.calls).toStrictEqual([
        ['TEST-001'],
        ['TEST-002'],
      ]);
    });

    await act(async () => {
      firstResponse.resolve(makePreInfo('Prepaid', 'Q-STALE'));
      await firstResponse.promise;
    });

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByText(/Prepayment required/)).not.toBeInTheDocument();

    await act(async () => {
      secondResponse.resolve(makePreInfo('Standard', 'Q-LATEST'));
      await secondResponse.promise;
    });

    await waitFor(() => {
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
      expect(
        screen.getByText(/30 days of NMI invoice date/),
      ).toBeInTheDocument();
    });
  });

  describe('aPI error handling', () => {
    it('logs an error and remains rendered when the API call fails', async () => {
      expect.hasAssertions();
      expect.hasAssertions();

      resetPaymentDetailsMocks();

      const AppLogger = (await import('@/instrumentation/AppLogger')).default;
      acquireTokenSilentMock.mockRejectedValue(new Error('Token failed'));

      renderPaymentDetails();

      await waitFor(() => {
        expect(vi.mocked(AppLogger).error.mock.calls).toContainEqual([
          'Failed to load Payment details',
          expect.any(Error),
          { Id: 'TEST-001' },
        ]);
      });

      expect(screen.getByTestId('info-summary')).toBeInTheDocument();
    });
  });
});
