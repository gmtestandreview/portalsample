import type React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

vi.mock('../../../../../ClientApp/src/instrumentation/AppLogger', () => ({
  default: { verbose: vi.fn(), error: vi.fn(), trace: vi.fn() },
}));

// The real WizardStep wraps an error boundary and analytics; render children.
vi.mock(
  '../../../../../ClientApp/src/components/forms/WizardForm/WizardStep',
  () => ({
    default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  })
);

vi.mock('../../../../../ClientApp/src/analytics/GoogleAnalytics', () => ({
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../../../../ClientApp/src/components/SteppedNavigation', () => ({
  default: () => <div data-testid='stepped-navigation' />,
}));

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

interface Saves {
  step1: ReturnType<typeof vi.fn>;
  step2: ReturnType<typeof vi.fn>;
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

const NEXT = 'save-and-next-button';
const MODAL = 'prompt-save-modal';

describe('Formik wizard characterisation: steps, Enter key and unsaved prompt', () => {
  let saves: Saves;

  beforeEach(() => {
    vi.clearAllMocks();
    saves = {
      step1: vi.fn().mockResolvedValue({}),
      step2: vi.fn().mockResolvedValue({}),
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

    expect(await screen.findByTestId(MODAL)).toBeTruthy();
    expect(screen.queryByLabelText('Name one')).toBeNull();
  });

  it('submits once on Enter when valid and shows errors on Enter when invalid', async () => {
    const user = userEvent.setup();
    renderWizard(saves);

    await user.click(await screen.findByLabelText('Name one'));
    await user.keyboard('{Enter}');
    expect(await screen.findByTestId('form-error-summary')).toBeTruthy();
    expect(saves.step1).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Name one'), 'abc{Enter}');
    expect(await screen.findByLabelText('Name two')).toBeTruthy();
    expect(saves.step1).toHaveBeenCalledTimes(1);
  });

  it('lets a clean form navigate away without a prompt', async () => {
    const router = renderWizard(saves);
    await screen.findByLabelText('Name one');

    await act(() => router.navigate('/elsewhere'));

    expect(await screen.findByText('Elsewhere Page')).toBeTruthy();
    expect(screen.queryByTestId(MODAL)).toBeNull();
  });

  it('blocks a dirty form, stays on Cancel and leaves on Discard', async () => {
    const user = userEvent.setup();
    const router = renderWizard(saves);
    await user.type(await screen.findByLabelText('Name one'), 'abc');

    await act(() => router.navigate('/elsewhere'));
    expect(await screen.findByTestId(MODAL)).toBeTruthy();

    await user.click(screen.getByTestId('prompt-cancel-button'));
    await waitFor(() => expect(screen.queryByTestId(MODAL)).toBeNull());
    expect(screen.getByLabelText('Name one')).toBeTruthy();

    await act(() => router.navigate('/elsewhere'));
    await user.click(await screen.findByTestId('prompt-leave-button'));
    expect(await screen.findByText('Elsewhere Page')).toBeTruthy();
  });
});
