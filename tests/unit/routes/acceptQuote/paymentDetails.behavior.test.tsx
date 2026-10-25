import { render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { useEffect } from 'react';

import { Form, Formik } from 'formik';

import { FormProvider, useForm, type FieldPath } from 'react-hook-form';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  InvoiceSentToValues,
  Title,
  type PaymentDetailsStep,
} from '@/api/web-api-client';

import type * as WebApiClientModule from '@/api/web-api-client';

import PaymentDetails from '@/routes/acceptQuote/paymentDetails';

import PaymentDetailsFormFields, {
  type PaymentDetailsFormValues,
} from '@/routes/acceptQuote/paymentDetailsFormFields';

import { paymentDetailsSubmitValidation } from '@/routes/acceptQuote/validation';

import { removeHidden } from '@/components/forms/utils';

import { defined } from '../../helpers/defined';

const { acquireTokenSilentMock, msalContext } = vi.hoisted(() => ({
  acquireTokenSilentMock: vi.fn(),
  msalContext: {
    accounts: [{ homeAccountId: 'test-account' }],
    instance: { acquireTokenSilent: vi.fn() },
  },
}));

const mockGetPaymentDetails = vi.hoisted(() => vi.fn());

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
          helpers,
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

interface DirectFieldsHarnessProps {
  errors?: Array<{
    message: string;
    name: FieldPath<PaymentDetailsFormValues>;
  }>;
}

function DirectFieldsHarness({ errors = [] }: DirectFieldsHarnessProps) {
  const methods = useForm<PaymentDetailsFormValues>({
    defaultValues: {
      invoiceSentTo: InvoiceSentToValues.DifferentPerson,
      contact: {
        title: Title.Mr,
      },
    },
  });

  useEffect(() => {
    errors.forEach(({ message, name }) => {
      methods.setValue(name, methods.getValues(name), { shouldTouch: true });
      methods.setError(name, { message, type: 'manual' });
    });
  }, [errors, methods]);

  return (
    <FormProvider {...methods}>
      <PaymentDetailsFormFields quotationId='RFQ-DIRECT' />
    </FormProvider>
  );
}

describe('paymentDetails form behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    acquireTokenSilentMock.mockResolvedValue({ accessToken: 'test-token' });
    msalContext.instance.acquireTokenSilent = acquireTokenSilentMock;
    mockGetPaymentDetails.mockResolvedValue({
      acceptQuotePreInfo: {
        paymentTerms: 'Standard',
        quotationIdNum: 'Q-TEST-001',
      },
    });
  });
  it('writes edited RHF field values into the outer wizard payload', async () => {
    expect.assertions(2);
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    await user.type(
      screen.getByLabelText('Purchase Order (PO) number (optional)'),
      'PO-123',
    );
    await user.click(
      screen.getByLabelText('A different invoice contact person'),
    );
    await user.type(
      screen.getByLabelText('Email address'),
      'billing@nmi.gov.au',
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        purchaseOrderNo: 'PO-123',
        invoiceSentTo: InvoiceSentToValues.DifferentPerson,
        contact: expect.objectContaining({ email: 'billing@nmi.gov.au' }),
      }),
      expect.anything(),
    );
  });
});
