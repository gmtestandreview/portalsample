import type React from 'react';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

import WizardRoutedStep from '../../../../../ClientApp/src/components/forms/WizardForm/WizardRoutedStep';

import WizardStep from '../../../../../ClientApp/src/components/forms/WizardForm/WizardStep';

import type { WizardRoutedStepProps } from '../../../../../ClientApp/src/components/forms/WizardForm/types';

import { type FormikValues } from 'formik';

import { defined } from '../../../helpers/defined';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock(
  import('../../../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: { verbose: vi.fn(), error: vi.fn(), trace: vi.fn() },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

// WizardStep wraps ErrorBoundary (needs AppInsights) + GoogleAnalytics.
// Both are irrelevant to these tests; stub them out.
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

// ── Test helpers ─────────────────────────────────────────────────────────────

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

function makeStepElement() {
  // A minimal React element whose .props satisfy WizardStepProps reads inside
  // WizardRoutedStep (title, location, stepStatuses used by render guards).
  return (
    <WizardStep
      title='Test Step'
      location='/step-1'
      stepStatuses={[{ status: FormStepStatus.NotStarted }]}
      loadStepValues={async () => ({ stepValues: {} })}
      bannerTitle='Test'
      initialValues={{}}
    />
  );
}

function makeStepElementAt(location: string, title: string) {
  return (
    <WizardStep
      title={title}
      location={location}
      stepStatuses={[{ status: FormStepStatus.NotStarted }]}
      loadStepValues={async () => ({ stepValues: {} })}
      bannerTitle='Test'
      initialValues={{}}
    />
  );
}

function makeRouter(
  propsOverride: Partial<WizardRoutedStepProps<FormikValues>>,
  extraRoutes: Array<{ path: string; element: React.ReactNode }> = [],
  accountState = mockStateValue,
  accountDispatch: typeof mockDispatch | null = mockDispatch,
) {
  const defaultStatuses: FormStepStatusDto[] = [
    { status: FormStepStatus.NotStarted },
  ];
  const defaultProps: WizardRoutedStepProps<FormikValues> = {
    title: 'Test Step',
    location: '/step-1',
    url: '',
    initialValues: {},
    stepStatuses: defaultStatuses,
    loadStepValues: async () => ({ stepValues: {} }),
    allSteps: [makeStepElement()],
    currentStepIndex: 0,
    locationOnCompletion: '/done',
    bannerTitle: 'Test Wizard',
    ...propsOverride,
  };

  return createMemoryRouter(
    [
      {
        path: '/step-1',
        element: (
          <AccountStateCtx.Provider value={accountState}>
            <AccountDispatchCtx.Provider value={accountDispatch}>
              <WizardRoutedStep {...defaultProps} />
            </AccountDispatchCtx.Provider>
          </AccountStateCtx.Provider>
        ),
      },
      { path: '/not-found', element: <div>Not Found Page</div> },
      { path: '/server-error', element: <div>Server Error Page</div> },
      { path: '/dashboard', element: <div>Dashboard Page</div> },
      { path: '/sign-out', element: <div>Sign Out Page</div> },
      { path: '/done', element: <div>Done Page</div> },
      ...extraRoutes,
    ],
    { initialEntries: ['/step-1'] },
  );
}

describe('wizardRoutedStep — error navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('navigates to /not-found when loadStepValues throws a 404', async () => {
    expect.assertions(1);
    const router = makeRouter({
      loadStepValues: vi
        .fn()
        .mockRejectedValue({ status: 404, title: 'Not Found' }),
    });
    render(<RouterProvider router={router} />);

    await waitFor(() =>
      expect(screen.getByText('Not Found Page')).toBeInTheDocument(),
    );
  });
});

describe('wizardRoutedStep — error navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('navigates to /server-error when loadStepValues throws an unrecognised error — restores suppressed silent failure', async () => {
    expect.assertions(1);
    const router = makeRouter({
      loadStepValues: vi
        .fn()
        .mockRejectedValue({ status: 500, title: 'Internal Server Error' }),
    });
    render(<RouterProvider router={router} />);

    await waitFor(() =>
      expect(screen.getByText('Server Error Page')).toBeInTheDocument(),
    );
  });
});

describe('wizardRoutedStep — error navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('navigates to a custom redirect URL when getRedirectionLocationOnError returns one', async () => {
    expect.assertions(1);
    const router = makeRouter(
      {
        loadStepValues: vi
          .fn()
          .mockRejectedValue({ status: 404, title: 'Not Found' }),
        getRedirectionLocationOnError: () => '/custom-gone',
      },
      [{ path: '/custom-gone', element: <div>Custom Gone Page</div> }],
    );
    render(<RouterProvider router={router} />);

    await waitFor(() =>
      expect(screen.getByText('Custom Gone Page')).toBeInTheDocument(),
    );
  });
});

describe('wizardRoutedStep — error navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('automatically retries loadStepValues after a 409 concurrency error', async () => {
    expect.assertions(2);
    const loadStepValues = vi
      .fn()
      .mockRejectedValueOnce({ status: 409, title: 'Conflict' })
      .mockResolvedValue({ stepValues: {} });

    const router = makeRouter({ loadStepValues });
    render(<RouterProvider router={router} />);

    // After the 409, the concurrency effect triggers a reload.
    // Wait until loadStepValues has been called twice AND the form is visible —
    // both assertions must be inside waitFor to avoid a race condition.
    await waitFor(() => {
      expect(loadStepValues).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('form')).toBeInTheDocument();
    });
  });
});
