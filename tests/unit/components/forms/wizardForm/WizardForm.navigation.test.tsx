import type React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { FormikValues } from 'formik';
import {
  FormStepStatus,
  type FormStepStatusDto,
} from '../../../../../ClientApp/src/api/web-api-client';
import {
  AccountStateCtx,
  AccountDispatchCtx,
  type AccountDispatchContext,
} from '../../../../../ClientApp/src/authentication/accountContext';
import WizardForm from '../../../../../ClientApp/src/components/forms/WizardForm';
import WizardStep from '../../../../../ClientApp/src/components/forms/WizardForm/WizardStep';
import type { WizardStepProps } from '../../../../../ClientApp/src/components/forms/WizardForm/types';
import type AppLoggerModule from '../../../../../ClientApp/src/instrumentation/AppLogger';

type AppLogger = typeof AppLoggerModule;
type SaveStepFn = NonNullable<WizardStepProps<FormikValues>['onSaveAndNext']>;

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock(
  import('../../../../../ClientApp/src/instrumentation/AppLogger'),
  (() =>
    ({
      default: {
        verbose: vi.fn<AppLogger['verbose']>(),
        error: vi.fn<AppLogger['error']>(),
        trace: vi.fn<AppLogger['trace']>(),
      },
    }) satisfies __ExactMockModule<__TestMockModule5>) as unknown as __DynamicPartialMockFactory<__TestMockModule5>,
);

vi.mock(
  import('../../../../../ClientApp/src/components/forms/WizardForm/WizardStep'),
  (() =>
    ({
      default: ({ children }: { children?: React.ReactNode }) => (
        <>{children}</>
      ),
    }) satisfies __ExactMockModule<__TestMockModule24>) as unknown as __DynamicPartialMockFactory<__TestMockModule24>,
);

vi.mock(
  import('../../../../../ClientApp/src/analytics/GoogleAnalytics'),
  (() =>
    ({
      default: ({ children }: { children?: React.ReactNode }) => (
        <>{children}</>
      ),
    }) satisfies __ExactMockModule<__TestMockModule22>) as unknown as __DynamicPartialMockFactory<__TestMockModule22>,
);

vi.mock(
  import('../../../../../ClientApp/src/components/SteppedNavigation'),
  (() =>
    ({
      default: () => <div data-testid='stepped-navigation' />,
    }) satisfies __ExactMockModule<__TestMockModule25>) as unknown as __DynamicPartialMockFactory<__TestMockModule25>,
);

// ── Shared mock context values ────────────────────────────────────────────────

const mockStateValue = {
  isLoading: false,
  details: {
    homeAccountId: 'test-account-id',
    organisation: 'Test Org',
    trading: '',
    branch: '',
    abn: '12345678901',
    email: 'test@test.com',
    givenName: 'Test',
    familyName: 'User',
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

const mockDispatch = {
  setAgree: vi.fn<AccountDispatchContext['setAgree']>(),
  setCompleted: vi.fn<AccountDispatchContext['setCompleted']>(),
  setContactCompleted: vi.fn<AccountDispatchContext['setContactCompleted']>(),
  setDefaultOrganisationId:
    vi.fn<AccountDispatchContext['setDefaultOrganisationId']>(),
  setTargetOrganisation:
    vi.fn<AccountDispatchContext['setTargetOrganisation']>(),
  setOrganisationAndBranch:
    vi.fn<AccountDispatchContext['setOrganisationAndBranch']>(),
  setUserProfile: vi.fn<AccountDispatchContext['setUserProfile']>(),
  setShowBranchSelector:
    vi.fn<AccountDispatchContext['setShowBranchSelector']>(),
  setShowRFQSelectModal:
    vi.fn<AccountDispatchContext['setShowRFQSelectModal']>(),
};

// ── Router factory ────────────────────────────────────────────────────────────

function makeTwoStepRouter(
  statuses: FormStepStatusDto[],
  step1Save = vi.fn<SaveStepFn>().mockResolvedValue({}),
  step2Save = vi.fn<SaveStepFn>().mockResolvedValue({}),
  initialPath = '/wizard/step-1',
) {
  return createMemoryRouter(
    [
      {
        path: '/wizard',
        children: [
          {
            path: '*',
            element: (
              <AccountStateCtx.Provider value={mockStateValue}>
                <AccountDispatchCtx.Provider value={mockDispatch}>
                  <WizardForm locationOnCompletion='/done' canSaveDraft={false}>
                    <WizardStep
                      title='Step 1'
                      location='/step-1'
                      initialValues={{}}
                      stepStatuses={statuses}
                      loadStepValues={() => ({ stepValues: {} })}
                      onSaveAndNext={step1Save}
                      bannerTitle='Test Wizard'
                    >
                      <div data-testid='step-1-content'>Step 1 Content</div>
                    </WizardStep>
                    <WizardStep
                      title='Step 2'
                      location='/step-2'
                      initialValues={{}}
                      stepStatuses={statuses}
                      loadStepValues={() => ({ stepValues: {} })}
                      onSaveAndNext={step2Save}
                      bannerTitle='Test Wizard'
                    >
                      <div data-testid='step-2-content'>Step 2 Content</div>
                    </WizardStep>
                  </WizardForm>
                </AccountDispatchCtx.Provider>
              </AccountStateCtx.Provider>
            ),
          },
        ],
      },
      { path: '/done', element: <div>Done Page</div> },
      { path: '/not-found', element: <div>Not Found Page</div> },
      { path: '/server-error', element: <div>Server Error Page</div> },
    ],
    { initialEntries: [initialPath] },
  );
}

function makeSplitSplatTwoStepRouter(
  statuses: FormStepStatusDto[],
  step1Save = vi.fn<SaveStepFn>().mockResolvedValue({}),
) {
  return createMemoryRouter(
    [
      {
        path: '/request-for-quote/:id',
        children: [
          {
            path: '*',
            element: (
              <AccountStateCtx.Provider value={mockStateValue}>
                <AccountDispatchCtx.Provider value={mockDispatch}>
                  <WizardForm locationOnCompletion='/done' canSaveDraft={false}>
                    <WizardStep
                      title='Step 1'
                      location='/step-1'
                      initialValues={{}}
                      stepStatuses={statuses}
                      loadStepValues={() => ({ stepValues: {} })}
                      onSaveAndNext={step1Save}
                      bannerTitle='Test Wizard'
                    >
                      <div data-testid='step-1-content'>Step 1 Content</div>
                    </WizardStep>
                    <WizardStep
                      title='Step 2'
                      location='/step-2'
                      initialValues={{}}
                      stepStatuses={statuses}
                      loadStepValues={() => ({ stepValues: {} })}
                      onSaveAndNext={vi.fn<SaveStepFn>().mockResolvedValue({})}
                      bannerTitle='Test Wizard'
                    >
                      <div data-testid='step-2-content'>Step 2 Content</div>
                    </WizardStep>
                  </WizardForm>
                </AccountDispatchCtx.Provider>
              </AccountStateCtx.Provider>
            ),
          },
        ],
      },
      { path: '/done', element: <div>Done Page</div> },
      { path: '/not-found', element: <div>Not Found Page</div> },
      { path: '/server-error', element: <div>Server Error Page</div> },
    ],
    {
      initialEntries: ['/request-for-quote/abc-123/step-1'],
      future: {
        v7_relativeSplatPath: true,
      },
    },
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('wizardForm — step navigation', () => {
  const resetWizardNavigation = () => {
    vi.clearAllMocks();
  };

  it('renders step 1 content on initial load', async () => {
    expect.hasAssertions();

    resetWizardNavigation();

    const statuses: FormStepStatusDto[] = [
      { status: FormStepStatus.NotStarted },
      { status: FormStepStatus.NotStarted },
    ];
    const router = makeTwoStepRouter(statuses);
    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId('step-1-content')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('step-2-content')).not.toBeInTheDocument();
  });

  it('navigates forward from step 1 to step 2 after successful submit', async () => {
    expect.hasAssertions();

    resetWizardNavigation();

    const statuses: FormStepStatusDto[] = [
      { status: FormStepStatus.NotStarted },
      { status: FormStepStatus.NotStarted },
    ];
    const step1Save = vi.fn<SaveStepFn>().mockResolvedValue({});
    const router = makeTwoStepRouter(statuses, step1Save);
    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId('form')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('save-and-next-button'));

    await waitFor(() => {
      expect(screen.getByTestId('step-2-content')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('step-1-content')).not.toBeInTheDocument();
    // Confirm form submission was triggered (navigation is driven by onSaveAndNext resolving)
    expect(step1Save).toHaveBeenCalledTimes(1);
  });

  it('still navigates when the current step has no status entry', async () => {
    expect.hasAssertions();

    resetWizardNavigation();

    const step1Save = vi.fn<SaveStepFn>().mockResolvedValue({});
    const router = makeTwoStepRouter([], step1Save);
    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId('form')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('save-and-next-button'));

    await waitFor(() => {
      expect(screen.getByTestId('step-2-content')).toBeInTheDocument();
    });

    expect(step1Save).toHaveBeenCalledTimes(1);
  });

  it('navigates back from step 2 to step 1 via the back button', async () => {
    expect.hasAssertions();

    resetWizardNavigation();

    const statuses: FormStepStatusDto[] = [
      { status: FormStepStatus.Completed },
      { status: FormStepStatus.NotStarted },
    ];
    const router = makeTwoStepRouter(
      statuses,
      undefined,
      undefined,
      '/wizard/step-2',
    );
    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId('step-2-content')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('back-button'));

    await waitFor(() => {
      expect(screen.getByTestId('step-1-content')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('step-2-content')).not.toBeInTheDocument();
  });

  it('linear guard: navigating directly to step 2 with step 1 incomplete redirects to step 1', async () => {
    expect.hasAssertions();

    resetWizardNavigation();

    const statuses: FormStepStatusDto[] = [
      { status: FormStepStatus.NotStarted },
      { status: FormStepStatus.NotStarted },
    ];
    const router = makeTwoStepRouter(
      statuses,
      undefined,
      undefined,
      '/wizard/step-2',
    );
    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId('step-1-content')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('step-2-content')).not.toBeInTheDocument();
  });

  it('navigates to locationOnCompletion after the final step submits successfully', async () => {
    expect.hasAssertions();

    resetWizardNavigation();

    const statuses: FormStepStatusDto[] = [
      { status: FormStepStatus.Completed },
      { status: FormStepStatus.NotStarted },
    ];
    const router = makeTwoStepRouter(
      statuses,
      undefined,
      undefined,
      '/wizard/step-2',
    );
    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId('form')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('save-and-next-button'));

    await waitFor(() => {
      expect(screen.getByText('Done Page')).toBeInTheDocument();
    });
  });

  it('smoke: preserves the resolved wizard base path for split splat route step navigation', async () => {
    expect.hasAssertions();

    resetWizardNavigation();

    const statuses: FormStepStatusDto[] = [
      { status: FormStepStatus.NotStarted },
      { status: FormStepStatus.NotStarted },
    ];
    const step1Save = vi
      .fn<SaveStepFn>()
      .mockResolvedValue({ baseUrl: '/request-for-quote/abc-123' });
    const router = makeSplitSplatTwoStepRouter(statuses, step1Save);
    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId('step-1-content')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('save-and-next-button'));

    await waitFor(() => {
      expect(screen.getByTestId('step-2-content')).toBeInTheDocument();
      expect(router.state.location.pathname).toBe(
        '/request-for-quote/abc-123/step-2',
      );
    });

    await userEvent.click(screen.getByTestId('back-button'));

    await waitFor(() => {
      expect(screen.getByTestId('step-1-content')).toBeInTheDocument();
      expect(router.state.location.pathname).toBe(
        '/request-for-quote/abc-123/step-1',
      );
    });
  });

  it('uses the root path when the resolved path is only the step location', async () => {
    expect.hasAssertions();

    resetWizardNavigation();

    const statuses: FormStepStatusDto[] = [
      { status: FormStepStatus.NotStarted },
    ];
    const router = createMemoryRouter(
      [
        {
          path: '*',
          element: (
            <AccountStateCtx.Provider value={mockStateValue}>
              <AccountDispatchCtx.Provider value={mockDispatch}>
                <WizardForm locationOnCompletion='/done' canSaveDraft={false}>
                  <WizardStep
                    title='Root step'
                    location='/step-1'
                    initialValues={{}}
                    stepStatuses={statuses}
                    loadStepValues={() => ({ stepValues: {} })}
                    onSaveAndNext={vi.fn<SaveStepFn>().mockResolvedValue({})}
                  >
                    <div data-testid='root-step-content'>Root step</div>
                  </WizardStep>
                </WizardForm>
              </AccountDispatchCtx.Provider>
            </AccountStateCtx.Provider>
          ),
        },
        { path: '/done', element: <div>Done Page</div> },
      ],
      { initialEntries: ['/step-1'] },
    );

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId('root-step-content')).toBeInTheDocument();
    });
  });

  it('keeps the current wizard path when the submitted base path is not a string', async () => {
    expect.hasAssertions();

    resetWizardNavigation();

    const statuses: FormStepStatusDto[] = [
      { status: FormStepStatus.NotStarted },
      { status: FormStepStatus.NotStarted },
    ];
    const step1Save = vi.fn<SaveStepFn>().mockResolvedValue({ baseUrl: 123 });
    const router = makeSplitSplatTwoStepRouter(statuses, step1Save);
    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId('step-1-content')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('save-and-next-button'));

    await waitFor(() => {
      expect(screen.getByTestId('step-2-content')).toBeInTheDocument();
      expect(router.state.location.pathname).toBe(
        '/request-for-quote/abc-123/step-2',
      );
    });
  });
});
