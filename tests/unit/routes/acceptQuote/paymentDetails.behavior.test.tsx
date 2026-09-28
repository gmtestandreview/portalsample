import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, Formik } from 'formik';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  InvoiceSentToValues,
  type PaymentDetailsStep,
} from '@/api/web-api-client';
import type * as WebApiClientModule from '@/api/web-api-client';
import PaymentDetails from '@/routes/acceptQuote/paymentDetails';
import { paymentDetailsSubmitValidation } from '@/routes/acceptQuote/validation';
import { removeHidden } from '@/components/forms/utils';

const { acquireTokenSilentMock, msalContext } = vi.hoisted(() => ({
  acquireTokenSilentMock: vi.fn(),
  msalContext: {
    accounts: [{ homeAccountId: 'test-account' }],
    instance: { acquireTokenSilent: vi.fn() },
  },
}));

const mockGetPaymentDetails = vi.hoisted(() => vi.fn());

vi.mock('@azure/msal-react', () => ({
  useMsal: () => msalContext,
}));

vi.mock('@/api/web-api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof WebApiClientModule>();
  return {
    ...actual,
    AcceptQuoteClient: vi.fn(function (this: Record<string, unknown>) {
      this.setAuthToken = vi.fn();
      this.getPaymentDetails = mockGetPaymentDetails;
    }),
  };
});

vi.mock('@/instrumentation/AppLogger', () => ({
  default: { verbose: vi.fn(), error: vi.fn() },
}));

const hidingFields = {
  contactHide: (values: PaymentDetailsStep) =>
    values.invoiceSentTo === InvoiceSentToValues.SamePerson,
  contact: {
    titleOther: (values: PaymentDetailsStep) =>
      values.contact?.title !== 'Other',
  },
};

const initialValues: PaymentDetailsStep = {
  purchaseOrderNo: '',
  invoiceSentTo: InvoiceSentToValues.SamePerson,
  contact: {
    title: undefined,
    titleOther: '',
    firstName: '',
    lastName: '',
    role: '',
    phone: '',
    mobile: '',
    email: '',
  },
};

interface HarnessProps {
  values?: PaymentDetailsStep;
  onSubmit?: (values: PaymentDetailsStep, helpers?: unknown) => void;
}

function Harness({ values = initialValues, onSubmit = vi.fn() }: HarnessProps) {
  return (
    <Formik<PaymentDetailsStep>
      initialValues={values}
      initialStatus={{ hidden: hidingFields }}
      validationSchema={paymentDetailsSubmitValidation}
      enableReinitialize
      onSubmit={(submittedValues, helpers) =>
        onSubmit(
          removeHidden(submittedValues, submittedValues, hidingFields),
          helpers
        )
      }
    >
      <Form>
        <PaymentDetails id='TEST-001' />
        <button type='submit'>Continue</button>
      </Form>
    </Formik>
  );
}

describe('PaymentDetails form behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    acquireTokenSilentMock.mockResolvedValue({ accessToken: 'test-token' });
    msalContext.instance.acquireTokenSilent = acquireTokenSilentMock;
    mockGetPaymentDetails.mockResolvedValue({
      acceptQuotePreInfo: { paymentTerms: 'Standard' },
    });
  });

  it('writes edited RHF field values into the outer wizard payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    await user.type(
      screen.getByLabelText('Purchase Order (PO) number (optional)'),
      'PO-123'
    );
    await user.click(
      screen.getByLabelText('A different invoice contact person')
    );
    await user.type(
      screen.getByLabelText('Email address'),
      'billing@nmi.gov.au'
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        purchaseOrderNo: 'PO-123',
        invoiceSentTo: InvoiceSentToValues.DifferentPerson,
        contact: expect.objectContaining({ email: 'billing@nmi.gov.au' }),
      }),
      expect.anything()
    );
  });

  it('shows and validates invoice contact fields only for a different person', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    expect(screen.queryByLabelText('Email address')).not.toBeInTheDocument();

    await user.click(
      screen.getByLabelText('A different invoice contact person')
    );
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      await screen.findByText('Email address is required')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('reinitializes displayed values when the wizard loads new step data', async () => {
    const { rerender } = render(<Harness />);

    rerender(
      <Harness
        values={{
          ...initialValues,
          purchaseOrderNo: 'PO-LOADED',
        }}
      />
    );

    await waitFor(() =>
      expect(
        screen.getByLabelText('Purchase Order (PO) number (optional)')
      ).toHaveValue('PO-LOADED')
    );
  });

  it('shows validation errors after reinitializing following an invalid submit', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Harness
        values={{
          ...initialValues,
          invoiceSentTo: InvoiceSentToValues.DifferentPerson,
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(
      await screen.findByText('Email address is required')
    ).toBeInTheDocument();

    rerender(
      <Harness
        values={{
          ...initialValues,
          purchaseOrderNo: 'PO-RELOADED',
          invoiceSentTo: InvoiceSentToValues.DifferentPerson,
        }}
      />
    );

    await waitFor(() =>
      expect(
        screen.queryByText('Email address is required')
      ).not.toBeInTheDocument()
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      await screen.findByText('Email address is required')
    ).toBeInTheDocument();
  });

  it('formats a loaded business phone without crashing the contact form', async () => {
    render(
      <Harness
        values={{
          ...initialValues,
          invoiceSentTo: InvoiceSentToValues.DifferentPerson,
          contact: {
            ...initialValues.contact,
            phone: '0212345678',
          },
        }}
      />
    );

    expect(
      await screen.findByLabelText('Business phone (optional)')
    ).toHaveValue('02 1234 5678');
  });

  it('preserves entered contact values after switching back to the main contact', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    await user.click(
      screen.getByLabelText('A different invoice contact person')
    );
    await user.type(
      screen.getByLabelText('Email address'),
      'private@example.com'
    );
    await user.click(
      screen.getByLabelText('The main contact person for this request')
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toHaveProperty(
      'contact.email',
      'private@example.com'
    );
  });

  it('shows and preserves loaded contact values when no invoice contact is selected', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Harness
        values={{
          ...initialValues,
          invoiceSentTo: undefined,
          contact: {
            ...initialValues.contact,
            email: 'private@example.com',
          },
        }}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByLabelText('Email address')).toHaveValue(
      'private@example.com'
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toHaveProperty(
      'contact.email',
      'private@example.com'
    );
  });
});
