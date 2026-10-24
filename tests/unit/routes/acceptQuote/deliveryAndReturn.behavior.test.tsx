import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, Formik } from 'formik';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as WebApiClientModule from '@/api/web-api-client';
import {
  ReturnAddressTypeValues,
  ReturnContactTypeValues,
  ReturnMethodValues,
  type DeliveryAndReturnStep,
} from '@/api/web-api-client';
import DeliveryAndReturn from '@/routes/acceptQuote/deliveryAndReturn';
import {
  deliveryAndReturnSaveValidation,
  deliveryAndReturnSubmitValidation,
} from '@/routes/acceptQuote/validation';
import { deliveryAndReturnHidingFields } from '@/routes/acceptQuote/deliveryAndReturnProps';
import { removeHidden, validateForm } from '@/components/forms/utils';
import SaveAndExitButton from '@/components/forms/SaveAndExitButton';
import { defined } from '../../helpers/defined';

const mocks = vi.hoisted(() => {
  const acquireTokenSilent = vi
    .fn()
    .mockResolvedValue({ accessToken: 'mock-token' });
  return {
    acquireTokenSilent,
    getDeliveryAndReturn: vi.fn(),
    error: vi.fn(),
    accounts: [{ homeAccountId: 'mock-id' }],
    instance: { acquireTokenSilent },
  };
});

vi.mock(
  import('@azure/msal-react'),
  () =>
    ({
      useMsal: () => ({
        instance: mocks.instance,
        accounts: mocks.accounts,
        inProgress: 'none',
      }),
      useAccount: () => ({ homeAccountId: 'mock-id' }),
    }) satisfies __ExactMockModule<__TestMockModule2>
);

vi.mock(
  import('@/authentication/hooks'),
  () =>
    ({
      useAccountState: () => ({
        isLoading: false,
        details: { homeAccountId: 'mock-id' },
      }),
    }) satisfies __ExactMockModule<__TestMockModule26>
);

vi.mock(import('@/api/web-api-client'), async (importOriginal) => {
  const actual = await importOriginal<typeof WebApiClientModule>();
  return {
    ...actual,
    AcceptQuoteClient: class {
      setAuthToken = vi.fn();
      getDeliveryAndReturn = mocks.getDeliveryAndReturn;
    },
    AccountsClient: class {
      setAuthToken = vi.fn();
    },
  } satisfies __ExactMockModule<__TestMockModule4>;
});

vi.mock(
  import('@/instrumentation/AppLogger'),
  () =>
    ({
      default: { verbose: vi.fn(), error: mocks.error },
    }) satisfies __ExactMockModule<__TestMockModule5>
);

// The lookup talks to the address service; stand in a marker element. The edit
// form renders the RHF twin once migrated; the summary keeps the Formik one.
vi.mock(
  import('@/components/Inputs/AddressLookup'),
  () =>
    ({
      default: ({ label }: { label: string }) => (
        <div data-testid='address-lookup'>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule31>
);
vi.mock(
  import('@/components/Inputs/RhfAddressLookup'),
  () =>
    ({
      default: ({ label }: { label: string }) => (
        <div data-testid='address-lookup'>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule69>
);

const hidingFields = deliveryAndReturnHidingFields;

const streetAddress = {
  line1: '1 Street Road',
  suburb: 'Lindfield',
  state: 'NSW',
  postcode: '2070',
};
const postalAddress = {
  line1: 'PO Box 9',
  suburb: 'Sydney',
  state: 'NSW',
  postcode: '2000',
};

interface StepHarnessProps {
  values?: DeliveryAndReturnStep;
  onSubmit?: (values: DeliveryAndReturnStep) => void;
}

// Like FormikForm, the schema follows saveAndExit: soft for a save, else hard.
function StepHarness({
  values = {},
  onSubmit = vi.fn(),
}: Readonly<StepHarnessProps>) {
  return (
    <MemoryRouter>
      <Formik<DeliveryAndReturnStep & { saveAndExit?: boolean }>
        initialValues={values}
        initialStatus={{ hidden: hidingFields }}
        enableReinitialize
        validate={(formValues) =>
          validateForm(
            formValues.saveAndExit
              ? deliveryAndReturnSaveValidation
              : deliveryAndReturnSubmitValidation,
            hidingFields
          )(formValues)
        }
        onSubmit={(submitted) =>
          onSubmit(removeHidden(submitted, submitted, hidingFields))
        }
      >
        <Form noValidate>
          <DeliveryAndReturn id='RFQ-1' />
          <button type='submit'>Continue</button>
          <SaveAndExitButton />
        </Form>
      </Formik>
    </MemoryRouter>
  );
}

const renderStep = (options: StepHarnessProps = {}) =>
  render(<StepHarness {...options} />);

const submittedValues = (onSubmit: ReturnType<typeof vi.fn>) =>
  defined(onSubmit.mock.calls[0], 'submit call')[0];

const waitForLoad = () => screen.findByText(/1 Street Road/);

describe('deliveryAndReturn behavior: visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'mock-token' });
    mocks.getDeliveryAndReturn.mockResolvedValue({
      acceptQuotePreInfo: { receiptAndDispatchNA: false },
      rfqOrganisation: {
        streetAddress,
        postalAddress,
        postalAddressSameAsStreetAddress: false,
      },
    });
  });

  it('shows no delivery or return fields when receipt and dispatch is not applicable', async () => {
    mocks.getDeliveryAndReturn.mockResolvedValue({
      acceptQuotePreInfo: { receiptAndDispatchNA: true },
    });
    renderStep();

    await expect(
      screen.findByText(/does not require the delivery or return/i)
    ).resolves.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Instrument\/artefact return/ })
    ).not.toBeInTheDocument();
  });

  it('shows the delivery and return sections otherwise', async () => {
    renderStep();
    await waitForLoad();

    expect(
      screen.getByRole('heading', { name: 'Instrument/artefact delivery' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Return method' })
    ).toBeInTheDocument();
    expect(screen.getByText(/PO Box 9/)).toBeInTheDocument();
  });

  it('shows the return contact details only for a different person', async () => {
    const user = userEvent.setup();
    renderStep({
      values: { returnContactType: ReturnContactTypeValues.SamePerson },
    });
    await waitForLoad();

    expect(screen.queryByLabelText('First name')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('radio', { name: /A different return contact person/ })
    );

    expect(screen.getByLabelText('First name')).toBeInTheDocument();

    await user.click(
      screen.getByRole('radio', { name: /The main contact person/ })
    );

    expect(screen.queryByLabelText('First name')).not.toBeInTheDocument();
  });

  it('shows the address lookup only when Other is selected', async () => {
    const user = userEvent.setup();
    renderStep();
    await waitForLoad();

    expect(screen.queryByTestId('address-lookup')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /Other/ }));

    expect(screen.getByTestId('address-lookup')).toBeInTheDocument();

    await user.click(
      screen.getByRole('radio', { name: /Business postal address/ })
    );

    expect(screen.queryByTestId('address-lookup')).not.toBeInTheDocument();
  });

  it('shows the carrier block only when the client will provide carrier details', async () => {
    const user = userEvent.setup();
    renderStep();
    await waitForLoad();

    expect(screen.queryByLabelText('Carrier name')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('radio', { name: /Client will provide carrier/ })
    );

    expect(screen.getByLabelText('Carrier name')).toBeInTheDocument();
    expect(screen.getByLabelText(/Packaging notes/)).toBeInTheDocument();

    await user.click(
      screen.getByRole('radio', { name: /Client to arrange when completed/ })
    );

    expect(screen.queryByLabelText('Carrier name')).not.toBeInTheDocument();
  });

  it('keeps rendering and logs when the step fails to load', async () => {
    mocks.getDeliveryAndReturn.mockRejectedValue(new Error('boom'));
    renderStep();

    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith());

    expect(screen.getByTestId('info-summary')).toBeInTheDocument();
  });
});

describe('deliveryAndReturn behavior: submit, validation and reload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'mock-token' });
    mocks.getDeliveryAndReturn.mockResolvedValue({
      acceptQuotePreInfo: { receiptAndDispatchNA: false },
      rfqOrganisation: {
        streetAddress,
        postalAddress,
        postalAddressSameAsStreetAddress: false,
      },
    });
  });

  it('submits typed carrier values and the customs value as displayed text', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({
      values: {
        returnContactType: ReturnContactTypeValues.SamePerson,
        returnAddressType: ReturnAddressTypeValues.BusinessAddress,
        returnMethod: ReturnMethodValues.ClientWillProvide,
      },
      onSubmit,
    });
    await waitForLoad();

    await user.type(screen.getByLabelText('Carrier name'), 'Acme Freight');
    await user.type(
      screen.getByLabelText(/Carrier account number/),
      'ACC-12345'
    );
    await user.type(screen.getByLabelText(/Carrier contact person/), 'Pat Doe');
    await user.type(
      screen.getByLabelText(/Carrier contact phone/),
      '0412345678'
    );
    await user.type(screen.getByLabelText(/Packaging notes/), 'Bubble wrap');
    await user.type(screen.getByLabelText(/Insurance notes/), 'Insured');
    await user.type(screen.getByLabelText(/Special instructions/), 'Fragile');
    await user.type(
      screen.getByLabelText(/Value for Australian Customs/),
      '1234'
    );
    await user.click(screen.getByRole('radio', { name: 'Air' }));
    await user.click(screen.getByRole('radio', { name: 'Express' }));
    await user.type(
      screen.getByLabelText(/Return organisation name/),
      'Acme Pty Ltd'
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledExactlyOnceWith());

    expect(submittedValues(onSubmit)).toEqual({
      returnContactType: 'SamePerson',
      returnAddressType: 'BusinessAddress',
      returnMethod: 'ClientWillProvide',
      carrierName: 'Acme Freight',
      carrierAccountNumber: 'ACC-12345',
      carrierContactPerson: 'Pat Doe',
      carrierContactPhone: '0412 345 678',
      packagingNotes: 'Bubble wrap',
      insuranceNotes: 'Insured',
      specialInstructions: 'Fragile',
      // Pins legacy behavior: NumberInput stores the displayed text, although
      // the DTO types customsValue as a number. Not an endorsement.
      customsValue: '1,234.00',
      shipmentMode: 'Air',
      shipmentPriority: 'Express',
      returnOrganisationName: 'Acme Pty Ltd',
    });
  });

  it('strips only the hidden return address (the carrier and contact wrappers do not strip)', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({
      values: {
        returnContactType: ReturnContactTypeValues.SamePerson,
        returnAddressType: ReturnAddressTypeValues.BusinessAddress,
        returnMethod: ReturnMethodValues.ClientToArrange,
        carrierName: 'stale',
        packagingNotes: 'stale',
        contact: { firstName: 'stale' },
        returnAddress: { line1: 'stale' },
      },
      onSubmit,
    });
    await waitForLoad();

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledExactlyOnceWith());

    expect(submittedValues(onSubmit)).toEqual({
      returnContactType: 'SamePerson',
      returnAddressType: 'BusinessAddress',
      returnMethod: 'ClientToArrange',
      carrierName: 'stale',
      packagingNotes: 'stale',
      contact: { firstName: 'stale' },
    });
  });

  it('submits the typed return contact for a different person', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({
      values: {
        returnContactType: ReturnContactTypeValues.DifferentPerson,
        returnMethod: ReturnMethodValues.ClientToArrange,
      },
      onSubmit,
    });
    await waitForLoad();

    await user.type(screen.getByLabelText('First name'), 'Jane');
    await user.type(screen.getByLabelText('Last name'), 'Citizen');
    await user.type(screen.getByLabelText('Business phone'), '0298765432');
    await user.type(screen.getByLabelText('Email address'), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledExactlyOnceWith());

    expect(submittedValues(onSubmit)).toMatchObject({
      contact: {
        firstName: 'Jane',
        lastName: 'Citizen',
        email: 'jane@example.com',
      },
    });
  });

  it('shows required messages for the carrier and contact after a failed submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({
      values: {
        returnContactType: ReturnContactTypeValues.DifferentPerson,
        returnMethod: ReturnMethodValues.ClientWillProvide,
        carrierName: '',
        carrierAccountNumber: '',
        contact: { firstName: '' },
      },
      onSubmit,
    });
    await waitForLoad();

    expect(screen.queryByText(/is required/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await expect(
      screen.findByText('Carrier name is required')
    ).resolves.toBeInTheDocument();
    expect(screen.getByText('First name is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Carrier name')).toHaveClass('is-invalid');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each([
    ['packagingNotes'],
    ['insuranceNotes'],
    ['specialInstructions'],
  ] as const)('rejects %s longer than 300 characters', async (field) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({
      values: {
        returnMethod: ReturnMethodValues.ClientWillProvide,
        carrierName: 'Acme',
        carrierAccountNumber: 'ACC-1',
        [field]: 'x'.repeat(301),
      },
      onSubmit,
    });
    await waitForLoad();

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await expect(
      screen.findByText(/300/, { selector: '.invalid-feedback' })
    ).resolves.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects an invalid carrier phone number', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({
      values: {
        returnMethod: ReturnMethodValues.ClientWillProvide,
        carrierName: 'Acme',
        carrierAccountNumber: 'ACC-1',
        carrierContactPhone: '12345',
      },
      onSubmit,
    });
    await waitForLoad();

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await expect(
      screen.findByText(/phone/i, { selector: '.invalid-feedback' })
    ).resolves.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('applies the soft schema to save and exit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({
      values: {
        returnMethod: ReturnMethodValues.ClientWillProvide,
        returnContactType: ReturnContactTypeValues.DifferentPerson,
        insuranceNotes: 'x'.repeat(301),
      },
      onSubmit,
    });
    await waitForLoad();

    await user.click(screen.getByRole('button', { name: 'Save and exit' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledExactlyOnceWith());

    expect(screen.queryByText(/is required/)).not.toBeInTheDocument();
  });

  it('still enforces the packaging notes limit on save and exit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({
      values: {
        returnMethod: ReturnMethodValues.ClientWillProvide,
        packagingNotes: 'x'.repeat(301),
      },
      onSubmit,
    });
    await waitForLoad();

    await user.click(screen.getByRole('button', { name: 'Save and exit' }));

    await expect(
      screen.findByText(/300/, { selector: '.invalid-feedback' })
    ).resolves.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('reinitializes the fields when the wizard loads new step data', async () => {
    const { rerender } = renderStep({
      values: { returnOrganisationName: 'Old' },
    });
    await waitForLoad();

    rerender(<StepHarness values={{ returnOrganisationName: 'Loaded' }} />);

    await waitFor(() =>
      expect(screen.getByLabelText(/Return organisation name/)).toHaveValue(
        'Loaded'
      )
    );
  });
});
