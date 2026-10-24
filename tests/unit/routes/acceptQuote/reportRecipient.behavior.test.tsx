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
      getReportRecipient = mocks.getReportRecipient;
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
          hidingFields
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
    renderStep({});

    await expect(
      screen.findByText(/1 Street Road/)
    ).resolves.toBeInTheDocument();
    expect(screen.getByText(/PO Box 9/)).toBeInTheDocument();
    expect(mocks.getReportRecipient).toHaveBeenCalledWith('RFQ-1');
  });

  it('describes the postal option with the street address when they are the same', async () => {
    mocks.getReportRecipient.mockResolvedValue({
      rfqOrganisation: {
        streetAddress,
        postalAddress,
        postalAddressSameAsStreetAddress: true,
      },
    });
    renderStep({});

    await waitFor(() =>
      expect(screen.getAllByText(/1 Street Road/)).toHaveLength(2)
    );

    expect(screen.queryByText(/PO Box 9/)).not.toBeInTheDocument();
  });

  it('shows the address lookup only when Other is selected', async () => {
    const user = userEvent.setup();
    renderStep({});
    await screen.findByText(/1 Street Road/);

    expect(screen.queryByTestId('address-lookup')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /Other/ }));

    expect(screen.getByTestId('address-lookup')).toBeInTheDocument();

    await user.click(
      screen.getByRole('radio', { name: /Business street address/ })
    );

    expect(screen.queryByTestId('address-lookup')).not.toBeInTheDocument();
  });

  it('submits the organisation name and strips the hidden address', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({
      values: {
        reportAddressType: ReportAddressTypeValues.BusinessAddress,
        businessStreetAddress: { line1: 'stale value' },
      },
      onSubmit,
    });
    await screen.findByText(/1 Street Road/);

    await user.type(
      screen.getByLabelText('Organisation name for report'),
      'Acme Metrology'
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledExactlyOnceWith());
    const submitted = defined(onSubmit.mock.calls[0], 'submit call')[0];

    expect(submitted).toEqual({
      reportAddressType: ReportAddressTypeValues.BusinessAddress,
      organisationName: 'Acme Metrology',
    });
  });

  it('rejects an organisation name longer than 400 characters', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({
      values: { organisationName: 'x'.repeat(401) },
      onSubmit,
    });
    await screen.findByText(/1 Street Road/);

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await expect(screen.findByText(/400/)).resolves.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('holds back the validation message until the form is submitted', async () => {
    const user = userEvent.setup();
    renderStep({ values: { organisationName: 'x'.repeat(401) } });
    await screen.findByText(/1 Street Road/);

    expect(screen.queryByText(/400/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await expect(screen.findByText(/400/)).resolves.toBeInTheDocument();
    expect(screen.getByLabelText('Organisation name for report')).toBeInvalid();
    expect(
      screen.getByLabelText('Organisation name for report')
    ).toHaveAccessibleDescription(/400/);
  });

  it('hides the address lookup again for the postal address option', async () => {
    const user = userEvent.setup();
    renderStep({
      values: { reportAddressType: ReportAddressTypeValues.Other },
    });
    await screen.findByText(/1 Street Road/);

    expect(screen.getByTestId('address-lookup')).toBeInTheDocument();

    await user.click(
      screen.getByRole('radio', { name: /Business postal address/ })
    );

    expect(screen.queryByTestId('address-lookup')).not.toBeInTheDocument();
  });

  it('submits the chosen address type to the outer form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({ onSubmit });
    await screen.findByText(/1 Street Road/);

    await user.click(
      screen.getByRole('radio', { name: /Business postal address/ })
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledExactlyOnceWith());

    expect(defined(onSubmit.mock.calls[0], 'submit call')[0]).toEqual({
      reportAddressType: ReportAddressTypeValues.PostalAddress,
    });
  });

  it('applies the soft schema to save and exit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({
      values: { organisationName: 'x'.repeat(401) },
      onSubmit,
    });
    await screen.findByText(/1 Street Road/);

    await user.click(screen.getByRole('button', { name: 'Save and exit' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledExactlyOnceWith());

    expect(screen.queryByText(/400/)).not.toBeInTheDocument();
  });

  it('reinitializes the fields when the wizard loads new step data', async () => {
    const { rerender } = renderStep({ values: { organisationName: 'Old' } });
    await screen.findByText(/1 Street Road/);

    rerender(<StepHarness values={{ organisationName: 'Loaded' }} />);

    await waitFor(() =>
      expect(screen.getByLabelText('Organisation name for report')).toHaveValue(
        'Loaded'
      )
    );
  });

  it('shows validation again after reinitializing following an invalid submit', async () => {
    const user = userEvent.setup();
    const { rerender } = renderStep({
      values: { organisationName: 'x'.repeat(401) },
    });
    await screen.findByText(/1 Street Road/);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await expect(screen.findByText(/400/)).resolves.toBeInTheDocument();

    rerender(<StepHarness values={{ organisationName: 'y'.repeat(402) }} />);
    await waitFor(() =>
      expect(screen.queryByText(/400/)).not.toBeInTheDocument()
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await expect(screen.findByText(/400/)).resolves.toBeInTheDocument();
  });

  it('keeps rendering the form and logs when the recipient fails to load', async () => {
    mocks.getReportRecipient.mockRejectedValue(new Error('boom'));
    renderStep({});

    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith());

    expect(
      screen.getByLabelText('Organisation name for report')
    ).toBeInTheDocument();
  });

  it('shows the formatted postal address read-only in summary mode', async () => {
    mocks.getReportRecipient.mockResolvedValue({
      reportAddressType: ReportAddressTypeValues.PostalAddress,
      rfqOrganisation: { streetAddress, postalAddress },
    });
    renderStep({ isSummary: true });

    await expect(screen.findByText(/PO Box 9/)).resolves.toBeInTheDocument();
  });

  it('shows the entered address in summary mode for the Other address type', async () => {
    mocks.getReportRecipient.mockResolvedValue({
      reportAddressType: ReportAddressTypeValues.Other,
      rfqOrganisation: { streetAddress, postalAddress },
    });
    renderStep({ isSummary: true });

    await expect(
      screen.findByTestId('address-lookup')
    ).resolves.toBeInTheDocument();
  });

  it('shows the formatted business address read-only in summary mode', async () => {
    mocks.getReportRecipient.mockResolvedValue({
      reportAddressType: ReportAddressTypeValues.BusinessAddress,
      rfqOrganisation: { streetAddress, postalAddress },
    });
    renderStep({ isSummary: true });

    await expect(
      screen.findByText(/1 Street Road/)
    ).resolves.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });
});
