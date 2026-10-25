import type React from 'react';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { createMemoryRouter, RouterProvider } from 'react-router';

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

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock(
  import('../../../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: { verbose: vi.fn(), error: vi.fn(), trace: vi.fn() },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

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

vi.mock(
  import('../../../../../ClientApp/src/components/SteppedNavigation'),
  () =>
    ({
      default: () => <div data-testid='stepped-navigation' />,
    }) satisfies __ExactMockModule<__TestMockModule25>,
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

// ── Router factory ────────────────────────────────────────────────────────────

function makeTwoStepRouter(
  statuses: FormStepStatusDto[],
  step1Save = vi.fn().mockResolvedValue({}),
  step2Save = vi.fn().mockResolvedValue({}),
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
                      loadStepValues={async () => ({ stepValues: {} })}
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
                      loadStepValues={async () => ({ stepValues: {} })}
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
  step1Save = vi.fn().mockResolvedValue({}),
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
                      loadStepValues={async () => ({ stepValues: {} })}
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
                      loadStepValues={async () => ({ stepValues: {} })}
                      onSaveAndNext={vi.fn().mockResolvedValue({})}
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

describe('wizardForm — step navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders step 1 content on initial load', async () => {
    expect.assertions(2);
    const statuses: FormStepStatusDto[] = [
      { status: FormStepStatus.NotStarted },
      { status: FormStepStatus.NotStarted },
    ];
    const router = makeTwoStepRouter(statuses);
    render(<RouterProvider router={router} />);

    await waitFor(() =>
      expect(screen.getByTestId('step-1-content')).toBeInTheDocument(),
    );

    expect(screen.queryByTestId('step-2-content')).not.toBeInTheDocument();
  });
});
