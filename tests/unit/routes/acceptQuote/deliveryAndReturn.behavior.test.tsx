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
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(
  import('@/authentication/hooks'),
  () =>
    ({
      useAccountState: () => ({
        isLoading: false,
        details: { homeAccountId: 'mock-id' },
      }),
    }) satisfies __ExactMockModule<__TestMockModule26>,
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
    }) satisfies __ExactMockModule<__TestMockModule5>,
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
    }) satisfies __ExactMockModule<__TestMockModule31>,
);

vi.mock(
  import('@/components/Inputs/RhfAddressLookup'),
  () =>
    ({
      default: ({ label }: { label: string }) => (
        <div data-testid='address-lookup'>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule69>,
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
            hidingFields,
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
    expect.assertions(3);
    mocks.getDeliveryAndReturn.mockResolvedValue({
      acceptQuotePreInfo: { receiptAndDispatchNA: true },
    });
    renderStep();

    await expect(
      screen.findByText(/does not require the delivery or return/i),
    ).resolves.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Instrument\/artefact return/ }),
    ).not.toBeInTheDocument();
  });
});
