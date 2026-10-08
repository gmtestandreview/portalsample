import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, Formik } from 'formik';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as WebApiClientModule from '@/api/web-api-client';
import { ReportAddressTypeValues } from '@/api/web-api-client';
import type { ReportRecipientStep } from '@/api/web-api-client';
import ReportRecipient from '@/routes/acceptQuote/reportRecipient';
import { reportRecipientSubmitValidation } from '@/routes/acceptQuote/validation';
import { removeHidden } from '@/components/forms/utils';
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

vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({
    instance: mocks.instance,
    accounts: mocks.accounts,
    inProgress: 'none',
  }),
  useAccount: () => ({ homeAccountId: 'mock-id' }),
}));

vi.mock('@/authentication/hooks', () => ({
  useAccountState: () => ({
    isLoading: false,
    details: { homeAccountId: 'mock-id' },
  }),
}));

vi.mock('@/api/web-api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof WebApiClientModule>();
  return {
    ...actual,
    AcceptQuoteClient: class {
      setAuthToken = vi.fn();
      getReportRecipient = mocks.getReportRecipient;
    },
  };
});

vi.mock('@/instrumentation/AppLogger', () => ({
  default: { verbose: vi.fn(), error: mocks.error },
}));

// The lookup talks to the address service; this suite only cares whether
// ReportRecipient renders it, so stand in a marker element.
vi.mock('@/components/Inputs/AddressLookup', () => ({
  default: ({ label }: { label: string }) => (
    <div data-testid='address-lookup'>{label}</div>
  ),
}));

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

function renderStep(options: {
  values?: ReportRecipientStep;
  isSummary?: boolean;
  onSubmit?: (values: ReportRecipientStep) => void;
}) {
  const { values = {}, isSummary, onSubmit = vi.fn() } = options;
  return render(
    <Formik<ReportRecipientStep>
      initialValues={values}
      initialStatus={{ hidden: hidingFields }}
      validationSchema={reportRecipientSubmitValidation}
      onSubmit={(submitted) =>
        onSubmit(removeHidden(submitted, submitted, hidingFields))
      }
    >
      <Form noValidate>
        <ReportRecipient id='RFQ-1' isSummary={isSummary} />
        <button type='submit'>Continue</button>
      </Form>
    </Formik>
  );
}

describe('ReportRecipient behavior', () => {
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

    expect(await screen.findByText(/1 Street Road/)).toBeInTheDocument();
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

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
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

    expect(await screen.findByText(/400/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps rendering the form and logs when the recipient fails to load', async () => {
    mocks.getReportRecipient.mockRejectedValue(new Error('boom'));
    renderStep({});

    await waitFor(() => expect(mocks.error).toHaveBeenCalled());
    expect(
      screen.getByLabelText('Organisation name for report')
    ).toBeInTheDocument();
  });

  it('shows the formatted business address read-only in summary mode', async () => {
    mocks.getReportRecipient.mockResolvedValue({
      reportAddressType: ReportAddressTypeValues.BusinessAddress,
      rfqOrganisation: { streetAddress, postalAddress },
    });
    renderStep({ isSummary: true });

    expect(await screen.findByText(/1 Street Road/)).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });
});
