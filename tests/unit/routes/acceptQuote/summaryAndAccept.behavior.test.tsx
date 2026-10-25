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
        details: { givenName: 'Taylor', familyName: 'Nguyen' },
      }),
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

vi.mock(import('@/api/web-api-client'), async (importOriginal) => {
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
  import('@/instrumentation/AppLogger'),
  () =>
    ({
      default: { verbose: vi.fn(), error: mocks.error },
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
    expect.assertions(1);
    renderStep();
    await waitForLoad();
    expect(screen.getByText('Quotation summary marker')).toBeInTheDocument();
  });
});

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
    expect.assertions(1);
    renderStep();
    await waitForLoad();
    expect(screen.getByText('Report recipient summary')).toBeInTheDocument();
  });
});

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
    expect.assertions(1);
    renderStep();
    await waitForLoad();
    expect(screen.getByText('Delivery and return summary')).toBeInTheDocument();
  });
});

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
    expect.assertions(1);
    renderStep();
    await waitForLoad();
    expect(screen.getByText('Payment details summary')).toBeInTheDocument();
  });
});

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
    expect.assertions(1);
    renderStep();
    await waitForLoad();
    expect(screen.getByText(/Taylor Nguyen/)).toBeInTheDocument();
  });
});
