import type React from 'react';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { createMemoryRouter, RouterProvider } from 'react-router';

import * as Yup from 'yup';

import { FormStepStatus } from '../../../../../ClientApp/src/api/web-api-client';

import {
  AccountStateCtx,
  AccountDispatchCtx,
} from '../../../../../ClientApp/src/authentication/accountContext';

import WizardRoutedStep from '../../../../../ClientApp/src/components/forms/WizardForm/WizardRoutedStep';

import type { WizardRoutedStepProps } from '../../../../../ClientApp/src/components/forms/WizardForm/types';

import TextInput from '../../../../../ClientApp/src/components/Inputs/TextInput';

import type { FormikValues } from 'formik';

// Characterisation of the Formik wizard shell, recorded before the React Hook
// Form shell exists. These assertions pin what the shell does today; they are
// not a statement of what it should do. The same suite is meant to run against
// the RHF shell (see the design addendum, parity contract).

vi.mock(
  import('../../../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: { verbose: vi.fn(), error: vi.fn(), trace: vi.fn() },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

// The real WizardStep wraps an error boundary and analytics that are not under
// test; render its children directly.
vi.mock(
  import('../../../../../ClientApp/src/components/forms/WizardForm/WizardStep'),
  () =>
    ({
      default: ({ children }: { children?: React.ReactNode }) => (
        <>{children}</>
      ),
    }) satisfies __ExactMockModule<__TestMockModule24>,
);

vi.mock(
  import('../../../../../ClientApp/src/analytics/GoogleAnalytics'),
  () =>
    ({
      default: ({ children }: { children?: React.ReactNode }) => (
        <>{children}</>
      ),
    }) satisfies __ExactMockModule<__TestMockModule22>,
);

const accountState = {
  isLoading: false,
  details: {
    homeAccountId: 'id',
    organisation: 'Org',
    trading: '',
    branch: '',
    abn: '12345678901',
    email: 'a@b.c',
    givenName: 'A',
    familyName: 'B',
    userAcceptedTermsOfUse: true,
    accountCreationCompleted: true,
    accountContactCompleted: true,
    currentTermsVersion: '1',
    isDefaultOrganisation: true,
    showBranchSelector: false,
    organisationIsCompleted: true,
    defaultOrganisationId: 1,
    targetOrganisation: {
      targetOrganisationAbn: '',
      targetOrganisationName: '',
    },
  },
};

const accountDispatch = {
  setAgree: vi.fn(),
  setCompleted: vi.fn(),
  setContactCompleted: vi.fn(),
  setDefaultOrganisationId: vi.fn(),
  setTargetOrganisation: vi.fn(),
  setOrganisationAndBranch: vi.fn(),
  setUserProfile: vi.fn(),
  setShowBranchSelector: vi.fn(),
  setShowRFQSelectModal: vi.fn(),
};

const schema = Yup.object({ name: Yup.string().required('Name is required') });

const stepElement = (
  <div data-step-marker>
    <TextInput name='name' label='Name' />
  </div>
);

const renderStep = (
  overrides: Partial<WizardRoutedStepProps<FormikValues>>,
) => {
  const props: WizardRoutedStepProps<FormikValues> = {
    title: 'Step',
    location: '/step-1',
    url: '',
    initialValues: { name: '' },
    stepStatuses: [{ status: FormStepStatus.NotStarted }],
    loadStepValues: async () => ({ stepValues: { name: '' } }),
    allSteps: [stepElement as never],
    currentStepIndex: 0,
    locationOnCompletion: '/done',
    bannerTitle: 'Test Wizard',
    validateHard: schema,
    ...overrides,
  };
  const router = createMemoryRouter(
    [
      {
        path: '/step-1',
        element: (
          <AccountStateCtx.Provider value={accountState}>
            <AccountDispatchCtx.Provider value={accountDispatch}>
              <WizardRoutedStep {...props} />
            </AccountDispatchCtx.Provider>
          </AccountStateCtx.Provider>
        ),
      },
      { path: '/done', element: <div>Done Page</div> },
    ],
    { initialEntries: ['/step-1'] },
  );
  render(<RouterProvider router={router} />);
};

const NEXT = 'save-and-next-button';

describe('formik wizard shell characterisation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('moves focus to the error summary and scrolls it into view after an invalid submit', async () => {
    expect.assertions(2);
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    renderStep({ onSaveAndNext: vi.fn() });
    await screen.findByLabelText('Name');

    await user.click(await screen.findByTestId(NEXT));

    const summary = await screen.findByTestId('form-error-summary');
    // Decision D-2: the summary takes focus (Formik left it on the button).
    await waitFor(() => expect(document.activeElement).toBe(summary));

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });
});

describe('formik wizard shell characterisation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('focuses the summary again on each further failed submit', async () => {
    expect.assertions(3);
    const user = userEvent.setup();
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(
      () => {},
    );
    renderStep({ onSaveAndNext: vi.fn() });
    await screen.findByLabelText('Name');

    await user.click(await screen.findByTestId(NEXT));
    const summary = await screen.findByTestId('form-error-summary');
    await waitFor(() => expect(document.activeElement).toBe(summary));

    await user.click(screen.getByTestId(NEXT));
    await waitFor(() =>
      expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(2),
    );

    expect(document.activeElement).toBe(
      screen.getByTestId('form-error-summary'),
    );
  });
});
