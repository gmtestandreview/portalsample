import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, Formik } from 'formik';
import { describe, expect, it, vi } from 'vitest';
import type * as WebApiClientModule from '@/api/web-api-client';
import { ReportAddressTypeValues, State } from '@/api/web-api-client';
import type {
  AddressDetailsDto,
  ReportRecipientStep,
} from '@/api/web-api-client';
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
    .fn<(...args: unknown[]) => unknown>()
    .mockResolvedValue({ accessToken: 'mock-token' });
  return {
    acquireTokenSilent,
    getReportRecipient: vi.fn<(...args: unknown[]) => unknown>(),
    error: vi.fn<(...args: unknown[]) => unknown>(),
    accounts: [{ homeAccountId: 'mock-id' }],
    instance: { acquireTokenSilent },
  };
});

vi.mock(
  '@azure/msal-react',
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
  '@/authentication/hooks',
  () =>
    ({
      useAccountState: () => ({
        isLoading: false,
        details: { homeAccountId: 'mock-id' },
      }),
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

vi.mock('@/api/web-api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof WebApiClientModule>();
  return {
    ...actual,
    AcceptQuoteClient: class {
      setAuthToken = vi.fn<(...args: unknown[]) => unknown>();
      getReportRecipient = mocks.getReportRecipient;
    },
  } satisfies __ExactMockModule<__TestMockModule4>;
});

vi.mock(
  '@/instrumentation/AppLogger',
  () =>
    ({
      default: {
        verbose: vi.fn<(...args: unknown[]) => unknown>(),
        error: mocks.error,
      },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

// The lookup talks to the address service; this suite only cares whether
// ReportRecipient renders it, so stand in a marker element.
// The edit form renders the RHF twin; the summary branch keeps the Formik one.
vi.mock(
  '@/components/Inputs/AddressLookup',
  () =>
    ({
      default: ({ label }: { label: string }) => (
        <div data-testid='address-lookup'>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule31>,
);
vi.mock(
  '@/components/Inputs/RhfAddressLookup',
  () =>
    ({
      default: ({ label }: { label: string }) => (
        <div data-testid='address-lookup'>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule69>,
);

const hidingFields = {
  businessStreetAddress: (x: ReportRecipientStep) =>
    x.reportAddressType !== ReportAddressTypeValues.Other,
};

const streetAddress: AddressDetailsDto = {
  line1: '1 Street Road',
  suburb: 'Lindfield',
  state: State.NSW,
  postcode: '2070',
};
const postalAddress: AddressDetailsDto = {
  line1: 'PO Box 9',
  suburb: 'Sydney',
  state: State.NSW,
  postcode: '2000',
};

function deferred<T>() {
  let resolve: (value: T | PromiseLike<T>) => void = () => undefined;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

interface StepHarnessProps {
  id?: string;
  values?: ReportRecipientStep;
  isSummary?: boolean;
  onSubmit?: (values: ReportRecipientStep) => void;
}

// Like FormikForm, the schema follows saveAndExit: soft for a save, else hard.
function StepHarness({
  id = 'RFQ-1',
  values = {},
  isSummary,
  onSubmit = vi.fn<(...args: unknown[]) => unknown>(),
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
      onSubmit={(submitted) => {
        onSubmit(removeHidden(submitted, submitted, hidingFields));
      }}
    >
      <Form noValidate>
        <ReportRecipient id={id} isSummary={isSummary} />
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
  const resetReportRecipientMocks = () => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'mock-token' });
    mocks.getReportRecipient.mockResolvedValue({
      rfqOrganisation: {
        streetAddress,
        postalAddress,
        postalAddressSameAsStreetAddress: false,
      },
    });
  };

  it('describes the street and postal address options from the loaded organisation', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetReportRecipientMocks();

    renderStep({});

    await expect(
      screen.findByText(/1 Street Road/),
    ).resolves.toBeInTheDocument();
    expect(screen.getByText(/PO Box 9/)).toBeInTheDocument();
    expect(mocks.getReportRecipient).toHaveBeenCalledWith('RFQ-1');
  });

  it('describes the postal option with the street address when they are the same', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetReportRecipientMocks();

    mocks.getReportRecipient.mockResolvedValue({
      rfqOrganisation: {
        streetAddress,
        postalAddress,
        postalAddressSameAsStreetAddress: true,
      },
    });
    renderStep({});

    await waitFor(() => {
      expect(screen.getAllByText(/1 Street Road/)).toHaveLength(2);
    });

    expect(screen.queryByText(/PO Box 9/)).not.toBeInTheDocument();
  });

  it('shows the address lookup only when Other is selected', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetReportRecipientMocks();

    const user = userEvent.setup();
    renderStep({});
    await screen.findByText(/1 Street Road/);

    expect(screen.queryByTestId('address-lookup')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /Other/ }));

    expect(screen.getByTestId('address-lookup')).toBeInTheDocument();

    await user.click(
      screen.getByRole('radio', { name: /Business street address/ }),
    );

    expect(screen.queryByTestId('address-lookup')).not.toBeInTheDocument();
  });

  it('submits the organisation name and strips the hidden address', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetReportRecipientMocks();

    const user = userEvent.setup();
    const onSubmit = vi.fn<(...args: unknown[]) => unknown>();
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
      'Acme Metrology',
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const submitted = defined(onSubmit.mock.calls[0], 'submit call')[0];

    expect(submitted).toStrictEqual({
      reportAddressType: ReportAddressTypeValues.BusinessAddress,
      organisationName: 'Acme Metrology',
    });
  });

  it('rejects an organisation name longer than 400 characters', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetReportRecipientMocks();

    const user = userEvent.setup();
    const onSubmit = vi.fn<(...args: unknown[]) => unknown>();
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
    expect.hasAssertions();
    expect.hasAssertions();

    resetReportRecipientMocks();

    const user = userEvent.setup();
    renderStep({ values: { organisationName: 'x'.repeat(401) } });
    await screen.findByText(/1 Street Road/);

    expect(screen.queryByText(/400/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await expect(screen.findByText(/400/)).resolves.toBeInTheDocument();
    expect(screen.getByLabelText('Organisation name for report')).toBeInvalid();
    expect(
      screen.getByLabelText('Organisation name for report'),
    ).toHaveAccessibleDescription(/400/);
  });

  it('hides the address lookup again for the postal address option', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetReportRecipientMocks();

    const user = userEvent.setup();
    renderStep({
      values: { reportAddressType: ReportAddressTypeValues.Other },
    });
    await screen.findByText(/1 Street Road/);

    expect(screen.getByTestId('address-lookup')).toBeInTheDocument();

    await user.click(
      screen.getByRole('radio', { name: /Business postal address/ }),
    );

    expect(screen.queryByTestId('address-lookup')).not.toBeInTheDocument();
  });

  it('submits the chosen address type to the outer form', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetReportRecipientMocks();

    const user = userEvent.setup();
    const onSubmit = vi.fn<(...args: unknown[]) => unknown>();
    renderStep({ onSubmit });
    await screen.findByText(/1 Street Road/);

    await user.click(
      screen.getByRole('radio', { name: /Business postal address/ }),
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(defined(onSubmit.mock.calls[0], 'submit call')[0]).toStrictEqual({
      reportAddressType: ReportAddressTypeValues.PostalAddress,
    });
  });

  it('applies the soft schema to save and exit', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetReportRecipientMocks();

    const user = userEvent.setup();
    const onSubmit = vi.fn<(...args: unknown[]) => unknown>();
    renderStep({
      values: { organisationName: 'x'.repeat(401) },
      onSubmit,
    });
    await screen.findByText(/1 Street Road/);

    await user.click(screen.getByRole('button', { name: 'Save and exit' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByText(/400/)).not.toBeInTheDocument();
  });

  it('reinitializes the fields when the wizard loads new step data', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetReportRecipientMocks();

    const { rerender } = renderStep({ values: { organisationName: 'Old' } });
    await screen.findByText(/1 Street Road/);

    rerender(<StepHarness values={{ organisationName: 'Loaded' }} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Organisation name for report')).toHaveValue(
        'Loaded',
      );
    });
  });

  it('shows validation again after reinitializing following an invalid submit', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetReportRecipientMocks();

    const user = userEvent.setup();
    const { rerender } = renderStep({
      values: { organisationName: 'x'.repeat(401) },
    });
    await screen.findByText(/1 Street Road/);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await expect(screen.findByText(/400/)).resolves.toBeInTheDocument();

    rerender(<StepHarness values={{ organisationName: 'y'.repeat(402) }} />);
    await waitFor(() => {
      expect(screen.queryByText(/400/)).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await expect(screen.findByText(/400/)).resolves.toBeInTheDocument();
  });

  it('keeps rendering the form and logs when the recipient fails to load', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetReportRecipientMocks();

    mocks.getReportRecipient.mockRejectedValue(new Error('boom'));
    renderStep({});

    await waitFor(() => {
      expect(mocks.error).toHaveBeenCalledWith(
        'Failed to load AcceptQuotePreInfo',
        expect.any(Error),
        { Id: 'RFQ-1' },
      );
    });

    expect(
      screen.getByLabelText('Organisation name for report'),
    ).toBeInTheDocument();
  });

  it('shows the formatted postal address read-only in summary mode', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetReportRecipientMocks();

    mocks.getReportRecipient.mockResolvedValue({
      reportAddressType: ReportAddressTypeValues.PostalAddress,
      rfqOrganisation: { streetAddress, postalAddress },
    });
    renderStep({ isSummary: true });

    await expect(screen.findByText(/PO Box 9/)).resolves.toBeInTheDocument();
  });

  it('shows the entered address in summary mode for the Other address type', async () => {
    expect.hasAssertions();

    mocks.getReportRecipient.mockResolvedValue({
      reportAddressType: ReportAddressTypeValues.Other,
      rfqOrganisation: { streetAddress, postalAddress },
    });
    renderStep({ isSummary: true });

    await expect(
      screen.findByTestId('address-lookup'),
    ).resolves.toBeInTheDocument();
  });

  it('reloads the recipient when the quotation id changes', async () => {
    expect.hasAssertions();

    resetReportRecipientMocks();

    const view = renderStep({});

    await waitFor(() => {
      expect(mocks.getReportRecipient).toHaveBeenCalledWith('RFQ-1');
    });

    mocks.getReportRecipient.mockResolvedValue({
      reportAddressType: ReportAddressTypeValues.Other,
      rfqOrganisation: {
        streetAddress: { ...streetAddress, line1: '2 New Street' },
        postalAddress,
        postalAddressSameAsStreetAddress: false,
      },
    });
    view.rerender(<StepHarness id='RFQ-2' />);

    await waitFor(() => {
      expect(screen.getByText(/2 New Street/)).toBeInTheDocument();
    });

    expect(mocks.getReportRecipient.mock.calls).toStrictEqual([
      ['RFQ-1'],
      ['RFQ-2'],
    ]);
    expect(screen.queryByText(/1 Street Road/)).not.toBeInTheDocument();
  });

  it('keeps the latest recipient request authoritative when responses resolve out of order', async () => {
    expect.hasAssertions();

    resetReportRecipientMocks();

    const firstResponse = deferred<ReportRecipientStep>();
    const secondResponse = deferred<ReportRecipientStep>();
    mocks.getReportRecipient.mockImplementation((requestedId: unknown) =>
      requestedId === 'RFQ-1' ? firstResponse.promise : secondResponse.promise,
    );

    const view = renderStep({});

    view.rerender(<StepHarness id='RFQ-2' />);

    await waitFor(() => {
      expect(mocks.getReportRecipient.mock.calls).toStrictEqual([
        ['RFQ-1'],
        ['RFQ-2'],
      ]);
    });

    await act(async () => {
      firstResponse.resolve({
        reportAddressType: ReportAddressTypeValues.Other,
        rfqOrganisation: {
          streetAddress,
          postalAddress,
          postalAddressSameAsStreetAddress: false,
        },
      });
      await firstResponse.promise;
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText(/1 Street Road/)).not.toBeInTheDocument();

    await act(async () => {
      secondResponse.resolve({
        reportAddressType: ReportAddressTypeValues.Other,
        rfqOrganisation: {
          streetAddress: { ...streetAddress, line1: '2 New Street' },
          postalAddress: { ...postalAddress, line1: 'PO Box 20' },
          postalAddressSameAsStreetAddress: false,
        },
      });
      await secondResponse.promise;
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText(/2 New Street/)).toBeInTheDocument();
    });
  });

  it('shows the formatted business address read-only in summary mode', async () => {
    expect.hasAssertions();

    mocks.getReportRecipient.mockResolvedValue({
      reportAddressType: ReportAddressTypeValues.BusinessAddress,
      rfqOrganisation: { streetAddress, postalAddress },
    });
    renderStep({ isSummary: true });

    await expect(
      screen.findByText(/1 Street Road/),
    ).resolves.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });
});
