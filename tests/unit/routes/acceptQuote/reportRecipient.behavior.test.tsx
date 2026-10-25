import { render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { Form, Formik } from 'formik';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as WebApiClientModule from '@/api/web-api-client';

import { ReportAddressTypeValues } from '@/api/web-api-client';

import type { ReportRecipientStep } from '@/api/web-api-client';

import ReportRecipient from '@/routes/acceptQuote/reportRecipient';

import {
  reportRecipientSaveValidation,
  reportRecipientSubmitValidation,
} from '@/routes/acceptQuote/validation';

import { removeHidden, validateForm } from '@/components/forms/utils';

import SaveAndExitButton from '@/components/forms/SaveAndExitButton';

import { defined } from '../../helpers/defined';

const mocks = vi.hoisted(() => {
  const acquireTokenSilent = vi
    .fn()
    .mockResolvedValue({ accessToken: 'mock-token' });
  return {
    acquireTokenSilent,
    getReportRecipient: vi.fn(),
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
      getReportRecipient = mocks.getReportRecipient;
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

// The lookup talks to the address service; this suite only cares whether
// ReportRecipient renders it, so stand in a marker element.
// The edit form renders the RHF twin; the summary branch keeps the Formik one.
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

const hidingFields = {
  businessStreetAddress: (x: ReportRecipientStep) =>
    x.reportAddressType !== 'Other',
};

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
  values?: ReportRecipientStep;
  isSummary?: boolean;
  onSubmit?: (values: ReportRecipientStep) => void;
}

// Like FormikForm, the schema follows saveAndExit: soft for a save, else hard.
function StepHarness({
  values = {},
  isSummary,
  onSubmit = vi.fn(),
}: Readonly<StepHarnessProps>) {
  return (
    <Formik<ReportRecipientStep & { saveAndExit?: boolean }>
      initialValues={values}
      initialStatus={{ hidden: hidingFields }}
      enableReinitialize
      validate={(formValues) =>
        validateForm(
          formValues.saveAndExit
            ? reportRecipientSaveValidation
            : reportRecipientSubmitValidation,
          hidingFields,
        )(formValues)
      }
      onSubmit={(submitted) =>
        onSubmit(removeHidden(submitted, submitted, hidingFields))
      }
    >
      <Form noValidate>
        <ReportRecipient id='RFQ-1' isSummary={isSummary} />
        <button type='submit'>Continue</button>
        <SaveAndExitButton />
      </Form>
    </Formik>
  );
}

function renderStep(options: StepHarnessProps) {
  return render(<StepHarness {...options} />);
}

describe('reportRecipient behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'mock-token' });
    mocks.getReportRecipient.mockResolvedValue({
      rfqOrganisation: {
        streetAddress,
        postalAddress,
        postalAddressSameAsStreetAddress: false,
      },
    });
  });
  it('describes the street and postal address options from the loaded organisation', async () => {
    expect.assertions(3);
    renderStep({});

    await expect(
      screen.findByText(/1 Street Road/),
    ).resolves.toBeInTheDocument();
    expect(screen.getByText(/PO Box 9/)).toBeInTheDocument();
    expect(mocks.getReportRecipient).toHaveBeenCalledWith('RFQ-1');
  });
});

describe('reportRecipient behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'mock-token' });
    mocks.getReportRecipient.mockResolvedValue({
      rfqOrganisation: {
        streetAddress,
        postalAddress,
        postalAddressSameAsStreetAddress: false,
      },
    });
  });
  it('describes the postal option with the street address when they are the same', async () => {
    expect.assertions(2);
    mocks.getReportRecipient.mockResolvedValue({
      rfqOrganisation: {
        streetAddress,
        postalAddress,
        postalAddressSameAsStreetAddress: true,
      },
    });
    renderStep({});

    await waitFor(() =>
      expect(screen.getAllByText(/1 Street Road/)).toHaveLength(2),
    );

    expect(screen.queryByText(/PO Box 9/)).not.toBeInTheDocument();
  });
});
