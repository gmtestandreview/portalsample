import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import '@testing-library/jest-dom/vitest';

import { vi, describe, it, expect, beforeEach } from 'vitest';

import { MemoryRouter, Route, Routes, useLocation } from 'react-router';

import PreConditions from '../../../ClientApp/src/routes/preConditions/PreConditions';

import type { AccountDetails } from '../../../ClientApp/src/authentication/accountContext';

import { ModalDispatchCtx } from '../../../ClientApp/src/components/modals/ModalContext';

import { getBranchModalNotification } from '../../../ClientApp/src/storage/notification';

import { NotificationSeverity } from '../../../ClientApp/src/storage/types';

// ── Mock factories ─────────────────────────────────────────────────────────────

let mockIsAuthenticated = false;

let mockAccountStateDetails: AccountDetails | null = null;

let mockAccountDispatchAvailable = true;

// ── Module mocks ───────────────────────────────────────────────────────────────

vi.mock(
  import('@azure/msal-react'),
  () =>
    ({
      useIsAuthenticated: () => mockIsAuthenticated,
      useMsal: vi.fn(() => ({
        inProgress: 'none',
        accounts: [],
        instance: {},
      })),
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(
  import('../../../ClientApp/src/authentication/hooks'),
  () =>
    ({
      useAccountState: () => ({ details: mockAccountStateDetails }),
      useAccountDispatch: () =>
        mockAccountDispatchAvailable
          ? {
              setAgree: vi.fn(),
              setCompleted: vi.fn(),
              setContactCompleted: vi.fn(),
              setDefaultOrganisationId: vi.fn(),
              setTargetOrganisation: vi.fn(),
              setOrganisationAndBranch: vi.fn(),
              setUserProfile: vi.fn(),
            }
          : undefined,
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

vi.mock(
  import('../../../ClientApp/src/components/Layout'),
  () =>
    ({
      default: ({ children }: any) => (
        <div data-testid='layout'>{children}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule110>,
);

vi.mock(
  import('../../../ClientApp/src/components/modals/TermsAndCondition'),
  () =>
    ({
      default: () => <div data-testid='terms-modal'>Terms Modal</div>,
    }) satisfies __ExactMockModule<__TestMockModule111>,
);

vi.mock(
  import('../../../ClientApp/src/components/modals/BranchSelectorModal'),
  () =>
    ({
      default: () => (
        <div data-testid='branch-selector-modal'>Branch Selector Modal</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule112>,
);

vi.mock(
  import('../../../ClientApp/src/components/modals/BranchSelectorModal/enums'),
  () =>
    ({
      BranchSelectionModalMode: {
        SelectAndEditOrg: 'SelectAndEditOrg',
        RFQSelectOrg: 'RFQSelectOrg',
      },
    }) satisfies __ExactMockModule<__TestMockModule109>,
);

vi.mock(
  import('../../../ClientApp/src/components/modals/RFQDeleteModal'),
  () =>
    ({
      default: () => <div data-testid='rfq-delete-modal'>RFQ Delete Modal</div>,
    }) satisfies __ExactMockModule<__TestMockModule113>,
);

vi.mock(
  import('../../../ClientApp/src/components/modals/ModalContext'),
  () =>
    ({
      ModalStateCtx: React.createContext(null),
      ModalDispatchCtx: React.createContext(null),
      useModalState: vi.fn(),
      useModalDispatch: vi.fn(),
    }) satisfies __ExactMockModule<__TestMockModule27>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/routeChangeScrollTop'),
  () =>
    ({
      default: () => null,
    }) satisfies __ExactMockModule<__TestMockModule44>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/backToTopButton'),
  () =>
    ({
      default: () => null,
    }) satisfies __ExactMockModule<__TestMockModule43>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/routeAccessibleNavigation'),
  () =>
    ({
      default: () => null,
    }) satisfies __ExactMockModule<__TestMockModule114>,
);

vi.mock(
  import('../../../ClientApp/src/storage/notification'),
  () =>
    ({
      clearDashboardNotification: vi.fn(),
      getBranchModalNotification: vi.fn(() => undefined),
    }) satisfies __ExactMockModule<__TestMockModule46>,
);

// ── Fixtures ───────────────────────────────────────────────────────────────────

/**
 * BASE has both account + contact completed, terms accepted, defaultOrganisationId set.
 * Completed users are redirected away from create-account/create-contact setup routes.
 * Tests override fields and use appropriate paths to isolate each condition.
 *
 * KEY PATH FACTS (from source):
 *   redirectToDashboard only applies on: paths containing 'create-account' OR 'create-contact'
 *   autoShowBranchSelector suppressed on: paths containing 'success-creating-account'
 *
 * Safe render paths for "both completed + terms accepted + want children to render":
 *   '/dashboard' — authenticated app route, does NOT suppress autoShowBranchSelector
 *   '/success-creating-account' — authenticated app route, suppresses autoShowBranchSelector
 */
const BASE: AccountDetails = {
  organisation: 'Acme',
  trading: 'Acme',
  branch: '',
  homeAccountId: 'id',
  userAcceptedTermsOfUse: true,
  accountCreationCompleted: true,
  accountContactCompleted: true,
  currentTermsVersion: '1',
  defaultOrganisationId: 1,
  organisationCRMGuid: 'guid-001',
  organisationIsCompleted: true,
  isDefaultOrganisation: true,
  showBranchSelector: false,
};

// ── Location observer component ────────────────────────────────────────────────

/** Renders the current pathname into DOM so tests can assert navigation. */
const LocationDisplay = () => {
  const loc = useLocation();
  return <div data-testid='current-path'>{loc.pathname}</div>;
};

const ModalControls = () => {
  const dispatch = React.useContext(ModalDispatchCtx);

  return (
    <>
      <button
        type='button'
        onClick={() => dispatch?.setShowBranchSelector(true)}
      >
        Show branch
      </button>
      <button
        type='button'
        onClick={() => dispatch?.setShowRFQDeleteModal(true, 'RFQ-1')}
      >
        Show delete
      </button>
      <button
        type='button'
        onClick={() =>
          dispatch?.setShowRFQSelectModal(true, 'RFQ-2', '/request')
        }
      >
        Show RFQ branch
      </button>
    </>
  );
};

// ── Render helpers ─────────────────────────────────────────────────────────────

/**
 * Standard render: PreConditions is on every route including the redirect destinations.
 * Use this when you want to verify that after a Navigate the destination still works,
 * or when you need to verify children DO render (redirect suppressed).
 */
function renderAt(initialPath: string, displayHeaderAndFooter = true) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocationDisplay />
      <Routes>
        <Route
          path='/create-account'
          element={
            <PreConditions displayHeaderAndFooter={displayHeaderAndFooter}>
              <div data-testid='child-content'>Protected Content</div>
            </PreConditions>
          }
        />
        <Route
          path='/create-contact'
          element={
            <PreConditions displayHeaderAndFooter={displayHeaderAndFooter}>
              <div data-testid='child-content'>Protected Content</div>
            </PreConditions>
          }
        />
        <Route
          path='/success-creating-account'
          element={
            <PreConditions displayHeaderAndFooter={displayHeaderAndFooter}>
              <div data-testid='child-content'>Protected Content</div>
            </PreConditions>
          }
        />
        <Route
          path='*'
          element={
            <PreConditions displayHeaderAndFooter={displayHeaderAndFooter}>
              <div data-testid='child-content'>Protected Content</div>
            </PreConditions>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

/**
 * Render for redirect tests where '/' should be a plain landing page, not
 * another PreConditions route that immediately re-renders protected children.
 */
function renderAtPathWithPlainRoot(initialPath: string) {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocationDisplay />
      <Routes>
        <Route
          path='/wizard'
          element={
            <PreConditions displayHeaderAndFooter>
              <div data-testid='child-content'>Protected Content</div>
            </PreConditions>
          }
        />
        <Route
          path='/create-account'
          element={
            <PreConditions displayHeaderAndFooter>
              <div data-testid='child-content'>Protected Content</div>
            </PreConditions>
          }
        />
        <Route
          path='/create-contact'
          element={
            <PreConditions displayHeaderAndFooter>
              <div data-testid='child-content'>Protected Content</div>
            </PreConditions>
          }
        />
        <Route
          path='/'
          element={<div data-testid='root-page'>Root Dashboard</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('preConditions state machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBranchModalNotification).mockReturnValue(undefined);
    mockIsAuthenticated = false;
    mockAccountStateDetails = null;
    mockAccountDispatchAvailable = true;
  });
  it('1. unauthenticated: renders children without any redirect', () => {
    expect.assertions(1);
    mockIsAuthenticated = false;
    mockAccountStateDetails = null;
    // No account state → no precondition fires → children render
    renderAt('/some-path');

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
});

describe('preConditions state machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBranchModalNotification).mockReturnValue(undefined);
    mockIsAuthenticated = false;
    mockAccountStateDetails = null;
    mockAccountDispatchAvailable = true;
  });
  it('2. redirectToCreateAccount: navigates to /create-account when org exists and account not created', () => {
    expect.assertions(2);
    mockIsAuthenticated = true;
    mockAccountStateDetails = {
      ...BASE,
      accountCreationCompleted: false,
      // defaultOrganisationId: 1 from BASE — 1 !== null → redirect fires
    };
    // Start at /some-path → Navigate to /create-account → on /create-account path is suppressed
    renderAt('/some-path');

    // After redirect, current path is /create-account
    expect(screen.getByTestId('current-path').textContent).toBe(
      '/create-account',
    );
    // Children render on /create-account because redirect is suppressed there
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
});

describe('preConditions state machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBranchModalNotification).mockReturnValue(undefined);
    mockIsAuthenticated = false;
    mockAccountStateDetails = null;
    mockAccountDispatchAvailable = true;
  });
  it('3. redirectToCreateAccount suppressed: children render when already on /create-account', () => {
    expect.assertions(2);
    mockIsAuthenticated = true;
    mockAccountStateDetails = {
      ...BASE,
      accountCreationCompleted: false,
      defaultOrganisationId: 1,
    };
    renderAt('/create-account');

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByTestId('current-path').textContent).toBe(
      '/create-account',
    );
  });
});
