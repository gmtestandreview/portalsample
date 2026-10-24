import type React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import * as Yup from 'yup';
import {
  FormStepStatus,
  type FormStepStatusDto,
} from '../../../../../ClientApp/src/api/web-api-client';
import {
  AccountStateCtx,
  AccountDispatchCtx,
} from '../../../../../ClientApp/src/authentication/accountContext';
import WizardForm from '../../../../../ClientApp/src/components/forms/WizardForm';
import WizardStep from '../../../../../ClientApp/src/components/forms/WizardForm/WizardStep';
import TextInput from '../../../../../ClientApp/src/components/Inputs/TextInput';

// Characterisation of the Formik wizard across steps and navigation, recorded
// before the React Hook Form shell exists. Pins what happens today; it does not
// say what should happen. See the design addendum, parity contract.

vi.mock(
  import('../../../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: { verbose: vi.fn(), error: vi.fn(), trace: vi.fn() },
    }) satisfies __ExactMockModule<__TestMockModule5>
);

// The real WizardStep wraps an error boundary and analytics; render children.
vi.mock(
  import('../../../../../ClientApp/src/components/forms/WizardForm/WizardStep'),
  () =>
    ({
      default: ({ children }: { children?: React.ReactNode }) => (
        <>{children}</>
      ),
    }) satisfies __ExactMockModule<__TestMockModule24>
);

vi.mock(
  import('../../../../../ClientApp/src/analytics/GoogleAnalytics'),
  () =>
    ({
      default: ({ children }: { children?: React.ReactNode }) => (
        <>{children}</>
      ),
    }) satisfies __ExactMockModule<__TestMockModule22>
);

vi.mock(
  import('../../../../../ClientApp/src/components/SteppedNavigation'),
  () =>
    ({
      default: () => <div data-testid='stepped-navigation' />,
    }) satisfies __ExactMockModule<__TestMockModule25>
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

const requiredName = Yup.object({
  name: Yup.string().required('Name is required'),
});
const requiredOther = Yup.object({
  other: Yup.string().required('Other is required'),
});

type SaveStep = Mock<(values: unknown, isDirty: boolean) => Promise<object>>;

interface Saves {
  step1: SaveStep;
  step2: SaveStep;
}

const renderWizard = (saves: Saves, step1Validation = requiredName) => {
  const statuses: FormStepStatusDto[] = [
    { status: FormStepStatus.NotStarted },
    { status: FormStepStatus.NotStarted },
  ];
  const router = createMemoryRouter(
    [
      {
        path: '/wizard',
        children: [
          {
            path: '*',
            element: (
              <AccountStateCtx.Provider value={accountState}>
                <AccountDispatchCtx.Provider value={accountDispatch}>
                  <WizardForm locationOnCompletion='/done' canSaveDraft={false}>
                    <WizardStep
                      title='Step 1'
                      location='/step-1'
                      initialValues={{ name: '' }}
                      stepStatuses={statuses}
                      loadStepValues={async () => ({
                        stepValues: { name: '' },
                      })}
                      onSaveAndNext={saves.step1}
                      validateHard={step1Validation}
                      bannerTitle='Test Wizard'
                    >
                      <TextInput name='name' label='Name one' />
                    </WizardStep>
                    <WizardStep
                      title='Step 2'
                      location='/step-2'
                      initialValues={{ other: '' }}
                      stepStatuses={statuses}
                      loadStepValues={async () => ({
                        stepValues: { other: '' },
                      })}
                      onSaveAndNext={saves.step2}
                      validateHard={requiredOther}
                      bannerTitle='Test Wizard'
                    >
                      <TextInput name='other' label='Name two' />
                    </WizardStep>
                  </WizardForm>
                </AccountDispatchCtx.Provider>
              </AccountStateCtx.Provider>
            ),
          },
        ],
      },
      { path: '/done', element: <div>Done Page</div> },
      { path: '/elsewhere', element: <div>Elsewhere Page</div> },
    ],
    { initialEntries: ['/wizard/step-1'] }
  );
  render(<RouterProvider router={router} />);
  return router;
};

// Formik validates on every change; let the trailing async validation land
// inside act before the test moves on.
const settleValidation = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

// Navigates and lets the blocked-navigation modal, its focus shift and the
// resulting input blur and revalidation all settle inside one act scope.
const navigateAndSettle = (router: { navigate: (to: string) => unknown }) =>
  act(async () => {
    void router.navigate('/elsewhere');
    await new Promise((resolve) => setTimeout(resolve, 300));
  });

const NEXT = 'save-and-next-button';
const MODAL = 'prompt-save-modal';

describe('formik wizard characterisation: steps, Enter key and unsaved prompt', () => {
  let saves: Saves;

  beforeEach(() => {
    vi.clearAllMocks();
    saves = {
      step1: vi.fn(async () => ({})),
      step2: vi.fn(async () => ({})),
    };
  });

  it('starts the next step clean and without errors after a valid submit', async () => {
    const user = userEvent.setup();
    renderWizard(saves);

    await user.type(await screen.findByLabelText('Name one'), 'abc');
    await user.click(screen.getByTestId(NEXT));

    const second = await screen.findByLabelText('Name two');

    expect((second as HTMLInputElement).value).toBe('');
    expect(screen.queryByTestId('form-error-summary')).toBeNull();
    expect(saves.step1).toHaveBeenCalledTimes(1);
    expect(saves.step1.mock.calls[0]?.[0]).toEqual({ name: 'abc' });
  });

  it('shows the unsaved prompt on Back after an invalid submit on the next step', async () => {
    const user = userEvent.setup();
    renderWizard(saves);

    await user.type(await screen.findByLabelText('Name one'), 'abc');
    await user.click(screen.getByTestId(NEXT));
    await screen.findByLabelText('Name two');
    await user.click(screen.getByTestId(NEXT));
    await screen.findByTestId('form-error-summary');

    await user.click(screen.getByTestId('back-button'));

    await expect(screen.findByTestId(MODAL)).resolves.toBeInTheDocument();
    expect(screen.queryByLabelText('Name one')).toBeNull();
  });

  it('submits once on Enter when valid and shows errors on Enter when invalid', async () => {
    const user = userEvent.setup();
    renderWizard(saves);

    await user.click(await screen.findByLabelText('Name one'));
    await user.keyboard('{Enter}');

    await expect(
      screen.findByTestId('form-error-summary')
    ).resolves.toBeInTheDocument();
    expect(saves.step1).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Name one'), 'abc{Enter}');

    await expect(
      screen.findByLabelText('Name two')
    ).resolves.toBeInTheDocument();
    expect(saves.step1).toHaveBeenCalledTimes(1);
  });

  it('lets a clean form navigate away without a prompt', async () => {
    const router = renderWizard(saves);
    await screen.findByLabelText('Name one');

    await act(() => router.navigate('/elsewhere'));

    await expect(
      screen.findByText('Elsewhere Page')
    ).resolves.toBeInTheDocument();
    expect(screen.queryByTestId(MODAL)).toBeNull();
  });

  it('blocks a dirty form and stays on the step when Cancel is chosen', async () => {
    const user = userEvent.setup();
    const router = renderWizard(saves);
    await user.type(await screen.findByLabelText('Name one'), 'abc');
    // Blur the input first: otherwise the modal's focus shift blurs it later,
    // outside any act scope, and Formik revalidates there.
    await user.tab();
    await settleValidation();

    await navigateAndSettle(router);

    expect(screen.getByTestId(MODAL)).toBeInTheDocument();

    await user.click(screen.getByTestId('prompt-cancel-button'));
    await waitFor(() => expect(screen.queryByTestId(MODAL)).toBeNull());

    expect(screen.getByLabelText('Name one')).toBeInTheDocument();
  });

  it('blocks a dirty form and leaves when Discard is chosen', async () => {
    const user = userEvent.setup();
    const router = renderWizard(saves);
    await user.type(await screen.findByLabelText('Name one'), 'abc');
    // Blur the input first: otherwise the modal's focus shift blurs it later,
    // outside any act scope, and Formik revalidates there.
    await user.tab();
    await settleValidation();

    await navigateAndSettle(router);
    await user.click(screen.getByTestId('prompt-leave-button'));

    await expect(
      screen.findByText('Elsewhere Page')
    ).resolves.toBeInTheDocument();
  });
});
