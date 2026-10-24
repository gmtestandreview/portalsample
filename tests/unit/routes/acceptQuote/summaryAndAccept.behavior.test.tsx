import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, Formik } from 'formik';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as WebApiClientModule from '@/api/web-api-client';
import { YesNo, type SummaryAndAcceptStep } from '@/api/web-api-client';
import SummaryAndAccept from '@/routes/acceptQuote/summaryAndAccept';
import {
  summaryAndAcceptSaveValidation,
  summaryAndAcceptSubmitValidation,
} from '@/routes/acceptQuote/validation';
import { summaryAndAcceptOwnHidingFields } from '@/routes/acceptQuote/summaryAndAcceptProps';
import { removeHidden, validateForm } from '@/components/forms/utils';
import SaveAndExitButton from '@/components/forms/SaveAndExitButton';
import ErrorSummary from '@/components/forms/ErrorSummary';
import { defined } from '../../helpers/defined';

const mocks = vi.hoisted(() => {
  const acquireTokenSilent = vi
    .fn()
    .mockResolvedValue({ accessToken: 'mock-token' });
  return {
    acquireTokenSilent,
    getSummaryAndAccept: vi.fn(),
    error: vi.fn(),
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
    }) satisfies __ExactMockModule<__TestMockModule2>
);

vi.mock(
  '@/authentication/hooks',
  () =>
    ({
      useAccountState: () => ({
        isLoading: false,
        details: { givenName: 'Taylor', familyName: 'Nguyen' },
      }),
    }) satisfies __ExactMockModule<__TestMockModule26>
);

vi.mock('@/api/web-api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof WebApiClientModule>();
  return {
    ...actual,
    AcceptQuoteClient: class {
      setAuthToken = vi.fn();
      getSummaryAndAccept = mocks.getSummaryAndAccept;
    },
    DashboardClient: class {
      setAuthToken = vi.fn();
    },
  } satisfies __ExactMockModule<__TestMockModule4>;
});

vi.mock(
  '@/instrumentation/AppLogger',
  () =>
    ({
      default: { verbose: vi.fn(), error: mocks.error },
    }) satisfies __ExactMockModule<__TestMockModule5>
);

// The read-only summaries of the other steps are separate components with
// their own suites; stand in markers so this suite pins only this step.
vi.mock(
  '@/routes/acceptQuote/reportRecipient',
  () =>
    ({
      default: () => <div>Report recipient summary</div>,
    }) satisfies __ExactMockModule<__TestMockModule61>
);
vi.mock(
  '@/routes/acceptQuote/deliveryAndReturn',
  () =>
    ({
      default: () => <div>Delivery and return summary</div>,
    }) satisfies __ExactMockModule<__TestMockModule62>
);
vi.mock(
  '@/routes/acceptQuote/paymentDetails',
  () =>
    ({
      default: () => <div>Payment details summary</div>,
    }) satisfies __ExactMockModule<__TestMockModule63>
);
vi.mock(
  '@/routes/acceptQuote/quotationSummary',
  () =>
    ({
      default: () => <div>Quotation summary marker</div>,
    }) satisfies __ExactMockModule<__TestMockModule73>
);

type Values = SummaryAndAcceptStep & { saveAndExit?: boolean };

interface StepHarnessProps {
  values?: Values;
  onSubmit?: (values: SummaryAndAcceptStep) => void;
}

// Like FormikForm, the schema follows saveAndExit: soft for a save, else hard.
function StepHarness({
  values = {},
  onSubmit = vi.fn(),
}: Readonly<StepHarnessProps>) {
  return (
    <MemoryRouter initialEntries={['/summary/quote-1']}>
      <Routes>
        <Route
          path='/summary/:id'
          element={
            <Formik<Values>
              initialValues={values}
              initialStatus={{ hidden: summaryAndAcceptOwnHidingFields }}
              enableReinitialize
              validate={(formValues) =>
                validateForm(
                  formValues.saveAndExit
                    ? summaryAndAcceptSaveValidation
                    : summaryAndAcceptSubmitValidation,
                  summaryAndAcceptOwnHidingFields
                )(formValues)
              }
              onSubmit={(submitted) =>
                onSubmit(
                  removeHidden(
                    submitted,
                    submitted,
                    summaryAndAcceptOwnHidingFields
                  )
                )
              }
            >
              <Form noValidate>
                <ErrorSummary />
                <SummaryAndAccept
                  cRMQuoteRequestId='CRM-1'
                  isSubmitted={false}
                />
                <button type='submit'>Continue</button>
                <SaveAndExitButton />
              </Form>
            </Formik>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

const renderStep = (options: StepHarnessProps = {}) =>
  render(<StepHarness {...options} />);

const submittedValues = (onSubmit: ReturnType<typeof vi.fn>) =>
  defined(onSubmit.mock.calls[0], 'submit call')[0];

const ACCEPT_LABEL =
  'Yes, on behalf of my organisation, I accept the quotation';
const ACCEPT_MESSAGE =
  'You must accept our terms before accepting this quotation';
const DISPUTE_LABEL = /Please provide details of the associated dispute/;
const waitForLoad = () => screen.findByText('Acme Pty Ltd');

describe('summaryAndAccept behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'mock-token' });
    mocks.getSummaryAndAccept.mockResolvedValue({
      acceptQuotePreInfo: { nmiCheckedByName: 'Nina Checker' },
      requestForQuote: { contact: { firstName: 'Rae', lastName: 'Quote' } },
      rfqOrganisation: { name: 'Acme Pty Ltd' },
    });
  });

  it('renders the read-only summaries and the parties to the contract', async () => {
    renderStep();
    await waitForLoad();

    expect(screen.getByText('Quotation summary marker')).toBeInTheDocument();
    expect(screen.getByText('Report recipient summary')).toBeInTheDocument();
    expect(screen.getByText('Delivery and return summary')).toBeInTheDocument();
    expect(screen.getByText('Payment details summary')).toBeInTheDocument();
    expect(screen.getByText(/Taylor Nguyen/)).toBeInTheDocument();
    expect(screen.getByText('Nina Checker')).toBeInTheDocument();
    expect(screen.getByText(/Rae/)).toBeInTheDocument();
  });

  it('hides the dispute details only once No is selected', async () => {
    const user = userEvent.setup();
    renderStep();
    await waitForLoad();

    // Pins legacy behavior: the rule hides on No, so an unanswered question
    // still shows the details field.
    expect(screen.getByLabelText(DISPUTE_LABEL)).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'No' }));

    expect(screen.queryByLabelText(DISPUTE_LABEL)).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Yes' }));

    expect(screen.getByLabelText(DISPUTE_LABEL)).toBeInTheDocument();
  });

  it('submits the typed dispute and the acceptance', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({ onSubmit });
    await waitForLoad();

    await user.click(screen.getByRole('radio', { name: 'Yes' }));
    await user.type(
      screen.getByLabelText(DISPUTE_LABEL),
      'Pricing disagreement'
    );
    await user.click(screen.getByLabelText(ACCEPT_LABEL));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());

    expect(submittedValues(onSubmit)).toEqual({
      associatedDisputes: 'Yes',
      associatedDispute: 'Pricing disagreement',
      acceptanceOfQuote: true,
    });
  });

  it('strips the hidden dispute details when there is no dispute', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({
      values: {
        associatedDisputes: YesNo.No,
        associatedDispute: 'stale',
      },
      onSubmit,
    });
    await waitForLoad();

    await user.click(screen.getByLabelText(ACCEPT_LABEL));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());

    expect(submittedValues(onSubmit)).toEqual({
      associatedDisputes: 'No',
      acceptanceOfQuote: true,
    });
  });

  it('links the error summary to the dispute and acceptance fields', async () => {
    const user = userEvent.setup();
    renderStep({
      values: {
        associatedDisputes: YesNo.Yes,
        associatedDispute: '',
        acceptanceOfQuote: false,
      },
    });
    await waitForLoad();

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    const summary = await screen.findByTestId('form-error-summary');
    const targetIdOf = (name: RegExp) =>
      within(summary)
        .getByRole('link', { name })
        .getAttribute('href')
        ?.replace(/^#/, '');
    const disputeId = targetIdOf(/Associated dispute/);
    const acceptanceId = targetIdOf(/Acceptance of quote/);

    expect(disputeId).toBe('associatedDispute');
    expect(acceptanceId).toBe('acceptanceOfQuote');
    expect(document.getElementById(defined(disputeId, 'dispute id'))).toBe(
      screen.getByLabelText(DISPUTE_LABEL)
    );
    expect(document.getElementById(defined(acceptanceId, 'accept id'))).toBe(
      screen.getByLabelText(ACCEPT_LABEL)
    );
  });

  it('strips dispute details typed before switching to No', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({ onSubmit });
    await waitForLoad();

    await user.type(screen.getByLabelText(DISPUTE_LABEL), 'Typed then dropped');
    await user.click(screen.getByRole('radio', { name: 'No' }));

    // Precondition: the textarea hides on No, so the typed text is now stale.
    expect(screen.queryByLabelText(DISPUTE_LABEL)).not.toBeInTheDocument();

    await user.click(screen.getByLabelText(ACCEPT_LABEL));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());

    expect(submittedValues(onSubmit)).toStrictEqual({
      associatedDisputes: 'No',
      acceptanceOfQuote: true,
    });
  });

  it('requires the acceptance and the dispute details after a failed submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({
      values: {
        associatedDisputes: YesNo.Yes,
        associatedDispute: '',
        acceptanceOfQuote: false,
      },
      onSubmit,
    });
    await waitForLoad();

    expect(screen.queryByText(ACCEPT_MESSAGE)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await expect(
      screen.findByText(ACCEPT_MESSAGE)
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByLabelText(DISPUTE_LABEL).closest('.form-field-container')
    ).toHaveTextContent('Associated dispute is a required field');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the acceptance message after the checkbox is cleared', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({ values: { associatedDisputes: YesNo.No }, onSubmit });
    await waitForLoad();

    await user.click(screen.getByLabelText(ACCEPT_LABEL));
    await user.click(screen.getByLabelText(ACCEPT_LABEL));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await expect(
      screen.findByText(ACCEPT_MESSAGE)
    ).resolves.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits an untouched acceptance (the schema only rejects an explicit false)', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({ values: { associatedDisputes: YesNo.No }, onSubmit });
    await waitForLoad();

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());

    expect(screen.queryByText(ACCEPT_MESSAGE)).not.toBeInTheDocument();
  });

  it('rejects dispute details longer than 300 characters', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({
      values: {
        associatedDisputes: YesNo.Yes,
        associatedDispute: 'x'.repeat(301),
        acceptanceOfQuote: true,
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

  it('does not require the acceptance on save and exit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({ onSubmit });
    await waitForLoad();

    await user.click(screen.getByRole('button', { name: 'Save and exit' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());

    expect(screen.queryByText(ACCEPT_MESSAGE)).not.toBeInTheDocument();
  });

  it('still enforces the dispute length on save and exit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStep({
      values: {
        associatedDisputes: YesNo.Yes,
        associatedDispute: 'x'.repeat(301),
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
    const { rerender } = renderStep({ values: {} });
    await waitForLoad();

    expect(screen.getByLabelText(ACCEPT_LABEL)).not.toBeChecked();

    rerender(<StepHarness values={{ acceptanceOfQuote: true }} />);

    await waitFor(() =>
      expect(screen.getByLabelText(ACCEPT_LABEL)).toBeChecked()
    );
  });

  it('keeps rendering and logs when the summary fails to load', async () => {
    mocks.getSummaryAndAccept.mockRejectedValue(new Error('boom'));
    renderStep();

    await waitFor(() => expect(mocks.error).toHaveBeenCalled());

    expect(screen.getByLabelText(ACCEPT_LABEL)).toBeInTheDocument();
  });
});
