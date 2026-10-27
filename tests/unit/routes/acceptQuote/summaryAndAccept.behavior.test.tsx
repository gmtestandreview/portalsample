import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, Formik } from 'formik';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
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
    .fn<(...args: unknown[]) => unknown>()
    .mockResolvedValue({ accessToken: 'mock-token' });
  return {
    acquireTokenSilent,
    getSummaryAndAccept: vi.fn<(...args: unknown[]) => unknown>(),
    error: vi.fn<(...args: unknown[]) => unknown>(),
    accounts: [{ homeAccountId: 'mock-id' }],
    instance: { acquireTokenSilent },
  };
});

// eslint-disable-next-line vitest/prefer-import-in-mock
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

// eslint-disable-next-line vitest/prefer-import-in-mock
vi.mock(
  '@/authentication/hooks',
  () =>
    ({
      useAccountState: () => ({
        isLoading: false,
        details: { givenName: 'Taylor', familyName: 'Nguyen' },
      }),
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

// eslint-disable-next-line vitest/prefer-import-in-mock
vi.mock('@/api/web-api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof WebApiClientModule>();
  return {
    ...actual,
    AcceptQuoteClient: class {
      setAuthToken = vi.fn<(...args: unknown[]) => unknown>();
      getSummaryAndAccept = mocks.getSummaryAndAccept;
    },
    DashboardClient: class {
      setAuthToken = vi.fn<(...args: unknown[]) => unknown>();
    },
  } satisfies __ExactMockModule<__TestMockModule4>;
});

// eslint-disable-next-line vitest/prefer-import-in-mock
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

// The read-only summaries of the other steps are separate components with
// their own suites; stand in markers so this suite pins only this step.
vi.mock(
  import('@/routes/acceptQuote/reportRecipient'),
  () =>
    ({
      default: () => <div>Report recipient summary</div>,
    }) satisfies __ExactMockModule<__TestMockModule61>,
);
vi.mock(
  import('@/routes/acceptQuote/deliveryAndReturn'),
  () =>
    ({
      default: () => <div>Delivery and return summary</div>,
    }) satisfies __ExactMockModule<__TestMockModule62>,
);
vi.mock(
  import('@/routes/acceptQuote/paymentDetails'),
  () =>
    ({
      default: () => <div>Payment details summary</div>,
    }) satisfies __ExactMockModule<__TestMockModule63>,
);
vi.mock(
  import('@/routes/acceptQuote/quotationSummary'),
  () =>
    ({
      default: () => <div>Quotation summary marker</div>,
    }) satisfies __ExactMockModule<__TestMockModule73>,
);

type Values = SummaryAndAcceptStep & { saveAndExit?: boolean };

interface StepHarnessProps {
  values?: Values;
  onSubmit?: (values: SummaryAndAcceptStep) => void;
}

// Like FormikForm, the schema follows saveAndExit: soft for a save, else hard.
function StepHarness({
  values = {},
  onSubmit = vi.fn<(...args: unknown[]) => unknown>(),
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
                  summaryAndAcceptOwnHidingFields,
                )(formValues)
              }
              onSubmit={(submitted) =>
                onSubmit(
                  removeHidden(
                    submitted,
                    submitted,
                    summaryAndAcceptOwnHidingFields,
                  ),
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
  const resetSummaryAndAcceptMocks = () => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'mock-token' });
    mocks.getSummaryAndAccept.mockResolvedValue({
      acceptQuotePreInfo: { nmiCheckedByName: 'Nina Checker' },
      requestForQuote: { contact: { firstName: 'Rae', lastName: 'Quote' } },
      rfqOrganisation: { name: 'Acme Pty Ltd' },
    });
  };

  it('renders the read-only summaries and the parties to the contract', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetSummaryAndAcceptMocks();

    renderStep();
    await waitForLoad();

    expect([
      screen.getByText('Quotation summary marker'),
      screen.getByText('Report recipient summary'),
      screen.getByText('Delivery and return summary'),
      screen.getByText('Payment details summary'),
      screen.getByText(/Taylor Nguyen/),
      screen.getByText('Nina Checker'),
      screen.getByText(/Rae/),
    ]).toStrictEqual([
      expect.any(HTMLElement),
      expect.any(HTMLElement),
      expect.any(HTMLElement),
      expect.any(HTMLElement),
      expect.any(HTMLElement),
      expect.any(HTMLElement),
      expect.any(HTMLElement),
    ]);
  });

  it('hides the dispute details only once No is selected', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetSummaryAndAcceptMocks();

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
    expect.hasAssertions();
    expect.hasAssertions();

    resetSummaryAndAcceptMocks();

    const user = userEvent.setup();
    const onSubmit = vi.fn<(...args: unknown[]) => unknown>();
    renderStep({ onSubmit });
    await waitForLoad();

    await user.click(screen.getByRole('radio', { name: 'Yes' }));
    await user.type(
      screen.getByLabelText(DISPUTE_LABEL),
      'Pricing disagreement',
    );
    await user.click(screen.getByLabelText(ACCEPT_LABEL));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    expect(submittedValues(onSubmit)).toStrictEqual({
      associatedDisputes: 'Yes',
      associatedDispute: 'Pricing disagreement',
      acceptanceOfQuote: true,
    });
  });

  it('strips the hidden dispute details when there is no dispute', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetSummaryAndAcceptMocks();

    const user = userEvent.setup();
    const onSubmit = vi.fn<(...args: unknown[]) => unknown>();
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

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    expect(submittedValues(onSubmit)).toStrictEqual({
      associatedDisputes: 'No',
      acceptanceOfQuote: true,
    });
  });

  it('links the error summary to the dispute and acceptance fields', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetSummaryAndAcceptMocks();

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
      screen.getByLabelText(DISPUTE_LABEL),
    );
    expect(document.getElementById(defined(acceptanceId, 'accept id'))).toBe(
      screen.getByLabelText(ACCEPT_LABEL),
    );
  });

  it('strips dispute details typed before switching to No', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetSummaryAndAcceptMocks();

    const user = userEvent.setup();
    const onSubmit = vi.fn<(...args: unknown[]) => unknown>();
    renderStep({ onSubmit });
    await waitForLoad();

    await user.type(screen.getByLabelText(DISPUTE_LABEL), 'Typed then dropped');
    await user.click(screen.getByRole('radio', { name: 'No' }));

    // Precondition: the textarea hides on No, so the typed text is now stale.
    expect(screen.queryByLabelText(DISPUTE_LABEL)).not.toBeInTheDocument();

    await user.click(screen.getByLabelText(ACCEPT_LABEL));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    expect(submittedValues(onSubmit)).toStrictEqual({
      associatedDisputes: 'No',
      acceptanceOfQuote: true,
    });
  });

  it('requires the acceptance and the dispute details after a failed submit', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetSummaryAndAcceptMocks();

    const user = userEvent.setup();
    const onSubmit = vi.fn<(...args: unknown[]) => unknown>();
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
      screen.findByText(ACCEPT_MESSAGE),
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByLabelText(DISPUTE_LABEL).closest('.form-field-container'),
    ).toHaveTextContent('Associated dispute is a required field');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the acceptance message after the checkbox is cleared', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetSummaryAndAcceptMocks();

    const user = userEvent.setup();
    const onSubmit = vi.fn<(...args: unknown[]) => unknown>();
    renderStep({ values: { associatedDisputes: YesNo.No }, onSubmit });
    await waitForLoad();

    await user.click(screen.getByLabelText(ACCEPT_LABEL));
    await user.click(screen.getByLabelText(ACCEPT_LABEL));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await expect(
      screen.findByText(ACCEPT_MESSAGE),
    ).resolves.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits an untouched acceptance (the schema only rejects an explicit false)', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetSummaryAndAcceptMocks();

    const user = userEvent.setup();
    const onSubmit = vi.fn<(...args: unknown[]) => unknown>();
    renderStep({ values: { associatedDisputes: YesNo.No }, onSubmit });
    await waitForLoad();

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    expect(screen.queryByText(ACCEPT_MESSAGE)).not.toBeInTheDocument();
  });

  it('rejects dispute details longer than 300 characters', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetSummaryAndAcceptMocks();

    const user = userEvent.setup();
    const onSubmit = vi.fn<(...args: unknown[]) => unknown>();
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
      screen.findByText(/300/, { selector: '.invalid-feedback' }),
    ).resolves.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not require the acceptance on save and exit', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetSummaryAndAcceptMocks();

    const user = userEvent.setup();
    const onSubmit = vi.fn<(...args: unknown[]) => unknown>();
    renderStep({ onSubmit });
    await waitForLoad();

    await user.click(screen.getByRole('button', { name: 'Save and exit' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    expect(screen.queryByText(ACCEPT_MESSAGE)).not.toBeInTheDocument();
  });

  it('still enforces the dispute length on save and exit', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetSummaryAndAcceptMocks();

    const user = userEvent.setup();
    const onSubmit = vi.fn<(...args: unknown[]) => unknown>();
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
      screen.findByText(/300/, { selector: '.invalid-feedback' }),
    ).resolves.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('reinitializes the fields when the wizard loads new step data', async () => {
    expect.hasAssertions();
    expect.hasAssertions();

    resetSummaryAndAcceptMocks();

    const { rerender } = renderStep({ values: {} });
    await waitForLoad();

    expect(screen.getByLabelText(ACCEPT_LABEL)).not.toBeChecked();

    rerender(<StepHarness values={{ acceptanceOfQuote: true }} />);

    await waitFor(() =>
      expect(screen.getByLabelText(ACCEPT_LABEL)).toBeChecked(),
    );
  });

  it('keeps rendering and logs when the summary fails to load', async () => {
    expect.hasAssertions();

    mocks.getSummaryAndAccept.mockRejectedValue(new Error('boom'));
    renderStep();

    await waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith(
        'Failed to retrieve getAcceptQuotePreInfo',
        expect.any(Error),
        { Id: 'quote-1' },
      ),
    );

    expect(screen.getByLabelText(ACCEPT_LABEL)).toBeInTheDocument();
  });
});
