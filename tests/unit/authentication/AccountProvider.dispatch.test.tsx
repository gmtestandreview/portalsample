import { render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import AccountProvider from '../../../ClientApp/src/authentication/AccountProvider';

import {
  useAccountDispatch,
  useAccountState,
} from '../../../ClientApp/src/authentication/hooks';

const providerMocks = vi.hoisted(() => ({
  acquireTokenSilent: vi.fn(),
  appLoggerError: vi.fn(),
  accounts: [
    {
      homeAccountId: 'test-id',
      idTokenClaims: {
        email: 'test@example.test',
        family_name: 'User',
        given_name: 'Test',
      },
    },
  ],
  getActiveAccount: vi.fn(),
  getStoredTargetOrganisation: vi.fn(),
  handleRedirectPromise: vi.fn(),
  inProgress: 'none',
  logoutRedirect: vi.fn(),
  setStoredTargetOrganisation: vi.fn(),
  setUserProfileApi: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock(
  import('@azure/msal-react'),
  () =>
    ({
      useMsal: () => ({
        inProgress: providerMocks.inProgress,
        accounts: providerMocks.accounts,
        instance: {
          acquireTokenSilent: providerMocks.acquireTokenSilent,
          getActiveAccount: providerMocks.getActiveAccount,
          handleRedirectPromise: providerMocks.handleRedirectPromise,
          logoutRedirect: providerMocks.logoutRedirect,
        },
      }),
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(
  import('@azure/msal-browser'),
  () =>
    ({
      InteractionStatus: { Logout: 'logout', None: 'none', Startup: 'startup' },
    }) satisfies __ExactMockModule<__TestMockModule3>,
);

vi.mock(
  import('../../../ClientApp/src/api/web-api-client'),
  () =>
    ({
      UsersClient: class {
        setAuthToken = vi.fn();
        setUserProfile = providerMocks.setUserProfileApi;
        signIn = providerMocks.signIn;
      },
    }) satisfies __ExactMockModule<__TestMockModule4>,
);

vi.mock(
  import('../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: {
        error: providerMocks.appLoggerError,
        verbose: vi.fn(),
      },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

vi.mock(
  import('../../../ClientApp/src/storage/targetOrganisation'),
  () =>
    ({
      default: providerMocks.setStoredTargetOrganisation,
      getTargetOrganisation: providerMocks.getStoredTargetOrganisation,
    }) satisfies __ExactMockModule<__TestMockModule6>,
);

vi.mock(
  import('../../../ClientApp/src/terms-config.json'),
  () =>
    ({
      default: { TermsVersion: '1' },
    }) satisfies __ExactMockModule<__TestMockModule7>,
);

vi.mock(
  import('../../../ClientApp/src/authentication/authConfig'),
  () =>
    ({
      tokenRequest: { scopes: ['read'] },
    }) satisfies __ExactMockModule<__TestMockModule8>,
);

const AccountConsumer = () => {
  const accountState = useAccountState();
  const accountDispatch = useAccountDispatch();

  return (
    <>
      <pre data-testid='details'>{JSON.stringify(accountState?.details)}</pre>
      <button onClick={() => accountDispatch?.setAgree()} type='button'>
        agree
      </button>
      <button onClick={() => accountDispatch?.setCompleted()} type='button'>
        complete account
      </button>
      <button
        onClick={() => accountDispatch?.setContactCompleted()}
        type='button'
      >
        complete contact
      </button>
      <button
        onClick={() => accountDispatch?.setDefaultOrganisationId(42, 'crm-42')}
        type='button'
      >
        set default org
      </button>
      <button
        onClick={() => accountDispatch?.setShowBranchSelector(true)}
        type='button'
      >
        show branch selector
      </button>
      <button
        onClick={() =>
          accountDispatch?.setShowRFQSelectModal(true, 'rfq-123', '/requests')
        }
        type='button'
      >
        show rfq selector
      </button>
      <button
        onClick={() =>
          accountDispatch?.setTargetOrganisation('99999999999', 'Target Org')
        }
        type='button'
      >
        set target org
      </button>
      <button
        onClick={() =>
          accountDispatch?.setOrganisationAndBranch(
            'New Org',
            'Trading Name',
            'Branch Name',
          )
        }
        type='button'
      >
        set org branch
      </button>
      <button
        onClick={() =>
          accountDispatch?.setOrganisationAndBranch(
            'Fallback Org',
            undefined as unknown as string,
            undefined as unknown as string,
          )
        }
        type='button'
      >
        set fallback org branch
      </button>
      <button
        onClick={() =>
          accountDispatch?.setUserProfile({
            testingCalibrationDashboard: {
              filterActiveTab: '2',
              filterCurrentPage: 3,
              filterSearchText: 'needle',
              filterSortOrder: '1',
              filterStatusType: '4',
              filterYearType: '2026',
              filtersChanged: true,
            },
          })
        }
        type='button'
      >
        set profile
      </button>
      <button
        onClick={() =>
          accountDispatch?.setUserProfile(
            undefined as unknown as Parameters<
              NonNullable<typeof accountDispatch>['setUserProfile']
            >[0],
          )
        }
        type='button'
      >
        set undefined profile
      </button>
    </>
  );
};

describe('accountProvider dispatch callbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    providerMocks.accounts = [
      {
        homeAccountId: 'test-id',
        idTokenClaims: {
          email: 'test@example.test',
          family_name: 'User',
          given_name: 'Test',
        },
      },
    ];
    providerMocks.acquireTokenSilent.mockResolvedValue({
      accessToken: 'test-token',
    });
    providerMocks.getStoredTargetOrganisation.mockReturnValue(null);
    providerMocks.getActiveAccount.mockReturnValue({
      homeAccountId: 'active-id',
    });
    providerMocks.handleRedirectPromise.mockResolvedValue(null);
    providerMocks.inProgress = 'none';
    providerMocks.logoutRedirect.mockResolvedValue(undefined);
    providerMocks.setUserProfileApi.mockResolvedValue(undefined);
    providerMocks.signIn.mockResolvedValue({
      acceptedTerms: false,
      contact: { isCompleted: false },
      contactId: 7,
      defaultOrganisationId: null,
      employerAbn: '12345678901',
      organisation: {
        abn: '12345678901',
        accountCompleted: false,
        businessOrTradingName: 'Old Trading',
        branchOrLocationName: 'Old Branch',
        isCompleted: false,
        name: 'Test Org',
      },
      termsVersion: '1',
    });
  });
  it('updates account state through dispatch callbacks exposed by hooks', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    render(
      <AccountProvider>
        <AccountConsumer />
      </AccountProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('details')).toHaveTextContent('Test Org'),
    );
  });
});

describe('accountProvider dispatch callbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    providerMocks.accounts = [
      {
        homeAccountId: 'test-id',
        idTokenClaims: {
          email: 'test@example.test',
          family_name: 'User',
          given_name: 'Test',
        },
      },
    ];
    providerMocks.acquireTokenSilent.mockResolvedValue({
      accessToken: 'test-token',
    });
    providerMocks.getStoredTargetOrganisation.mockReturnValue(null);
    providerMocks.getActiveAccount.mockReturnValue({
      homeAccountId: 'active-id',
    });
    providerMocks.handleRedirectPromise.mockResolvedValue(null);
    providerMocks.inProgress = 'none';
    providerMocks.logoutRedirect.mockResolvedValue(undefined);
    providerMocks.setUserProfileApi.mockResolvedValue(undefined);
    providerMocks.signIn.mockResolvedValue({
      acceptedTerms: false,
      contact: { isCompleted: false },
      contactId: 7,
      defaultOrganisationId: null,
      employerAbn: '12345678901',
      organisation: {
        abn: '12345678901',
        accountCompleted: false,
        businessOrTradingName: 'Old Trading',
        branchOrLocationName: 'Old Branch',
        isCompleted: false,
        name: 'Test Org',
      },
      termsVersion: '1',
    });
  });
  it('updates account state through dispatch callbacks exposed by hooks', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    render(
      <AccountProvider>
        <AccountConsumer />
      </AccountProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'agree' }));
    await user.click(screen.getByRole('button', { name: 'complete account' }));
    await user.click(screen.getByRole('button', { name: 'complete contact' }));
    await user.click(screen.getByRole('button', { name: 'set default org' }));
    await user.click(
      screen.getByRole('button', { name: 'show branch selector' }),
    );
    await user.click(screen.getByRole('button', { name: 'show rfq selector' }));
    await user.click(screen.getByRole('button', { name: 'set target org' }));
    await user.click(screen.getByRole('button', { name: 'set org branch' }));
    await user.click(screen.getByRole('button', { name: 'set profile' }));
    const details = screen.getByTestId('details').textContent ?? '';
    expect(details).toContain('"userAcceptedTermsOfUse":true');
  });
});

describe('accountProvider dispatch callbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    providerMocks.accounts = [
      {
        homeAccountId: 'test-id',
        idTokenClaims: {
          email: 'test@example.test',
          family_name: 'User',
          given_name: 'Test',
        },
      },
    ];
    providerMocks.acquireTokenSilent.mockResolvedValue({
      accessToken: 'test-token',
    });
    providerMocks.getStoredTargetOrganisation.mockReturnValue(null);
    providerMocks.getActiveAccount.mockReturnValue({
      homeAccountId: 'active-id',
    });
    providerMocks.handleRedirectPromise.mockResolvedValue(null);
    providerMocks.inProgress = 'none';
    providerMocks.logoutRedirect.mockResolvedValue(undefined);
    providerMocks.setUserProfileApi.mockResolvedValue(undefined);
    providerMocks.signIn.mockResolvedValue({
      acceptedTerms: false,
      contact: { isCompleted: false },
      contactId: 7,
      defaultOrganisationId: null,
      employerAbn: '12345678901',
      organisation: {
        abn: '12345678901',
        accountCompleted: false,
        businessOrTradingName: 'Old Trading',
        branchOrLocationName: 'Old Branch',
        isCompleted: false,
        name: 'Test Org',
      },
      termsVersion: '1',
    });
  });
  it('updates account state through dispatch callbacks exposed by hooks', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    render(
      <AccountProvider>
        <AccountConsumer />
      </AccountProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'agree' }));
    await user.click(screen.getByRole('button', { name: 'complete account' }));
    await user.click(screen.getByRole('button', { name: 'complete contact' }));
    await user.click(screen.getByRole('button', { name: 'set default org' }));
    await user.click(
      screen.getByRole('button', { name: 'show branch selector' }),
    );
    await user.click(screen.getByRole('button', { name: 'show rfq selector' }));
    await user.click(screen.getByRole('button', { name: 'set target org' }));
    await user.click(screen.getByRole('button', { name: 'set org branch' }));
    await user.click(screen.getByRole('button', { name: 'set profile' }));
    const details = screen.getByTestId('details').textContent ?? '';
    expect(details).toContain('"accountCreationCompleted":true');
  });
});

describe('accountProvider dispatch callbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    providerMocks.accounts = [
      {
        homeAccountId: 'test-id',
        idTokenClaims: {
          email: 'test@example.test',
          family_name: 'User',
          given_name: 'Test',
        },
      },
    ];
    providerMocks.acquireTokenSilent.mockResolvedValue({
      accessToken: 'test-token',
    });
    providerMocks.getStoredTargetOrganisation.mockReturnValue(null);
    providerMocks.getActiveAccount.mockReturnValue({
      homeAccountId: 'active-id',
    });
    providerMocks.handleRedirectPromise.mockResolvedValue(null);
    providerMocks.inProgress = 'none';
    providerMocks.logoutRedirect.mockResolvedValue(undefined);
    providerMocks.setUserProfileApi.mockResolvedValue(undefined);
    providerMocks.signIn.mockResolvedValue({
      acceptedTerms: false,
      contact: { isCompleted: false },
      contactId: 7,
      defaultOrganisationId: null,
      employerAbn: '12345678901',
      organisation: {
        abn: '12345678901',
        accountCompleted: false,
        businessOrTradingName: 'Old Trading',
        branchOrLocationName: 'Old Branch',
        isCompleted: false,
        name: 'Test Org',
      },
      termsVersion: '1',
    });
  });
  it('updates account state through dispatch callbacks exposed by hooks', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    render(
      <AccountProvider>
        <AccountConsumer />
      </AccountProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'agree' }));
    await user.click(screen.getByRole('button', { name: 'complete account' }));
    await user.click(screen.getByRole('button', { name: 'complete contact' }));
    await user.click(screen.getByRole('button', { name: 'set default org' }));
    await user.click(
      screen.getByRole('button', { name: 'show branch selector' }),
    );
    await user.click(screen.getByRole('button', { name: 'show rfq selector' }));
    await user.click(screen.getByRole('button', { name: 'set target org' }));
    await user.click(screen.getByRole('button', { name: 'set org branch' }));
    await user.click(screen.getByRole('button', { name: 'set profile' }));
    const details = screen.getByTestId('details').textContent ?? '';
    expect(details).toContain('"accountContactCompleted":true');
  });
});

describe('accountProvider dispatch callbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    providerMocks.accounts = [
      {
        homeAccountId: 'test-id',
        idTokenClaims: {
          email: 'test@example.test',
          family_name: 'User',
          given_name: 'Test',
        },
      },
    ];
    providerMocks.acquireTokenSilent.mockResolvedValue({
      accessToken: 'test-token',
    });
    providerMocks.getStoredTargetOrganisation.mockReturnValue(null);
    providerMocks.getActiveAccount.mockReturnValue({
      homeAccountId: 'active-id',
    });
    providerMocks.handleRedirectPromise.mockResolvedValue(null);
    providerMocks.inProgress = 'none';
    providerMocks.logoutRedirect.mockResolvedValue(undefined);
    providerMocks.setUserProfileApi.mockResolvedValue(undefined);
    providerMocks.signIn.mockResolvedValue({
      acceptedTerms: false,
      contact: { isCompleted: false },
      contactId: 7,
      defaultOrganisationId: null,
      employerAbn: '12345678901',
      organisation: {
        abn: '12345678901',
        accountCompleted: false,
        businessOrTradingName: 'Old Trading',
        branchOrLocationName: 'Old Branch',
        isCompleted: false,
        name: 'Test Org',
      },
      termsVersion: '1',
    });
  });
  it('updates account state through dispatch callbacks exposed by hooks', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    render(
      <AccountProvider>
        <AccountConsumer />
      </AccountProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'agree' }));
    await user.click(screen.getByRole('button', { name: 'complete account' }));
    await user.click(screen.getByRole('button', { name: 'complete contact' }));
    await user.click(screen.getByRole('button', { name: 'set default org' }));
    await user.click(
      screen.getByRole('button', { name: 'show branch selector' }),
    );
    await user.click(screen.getByRole('button', { name: 'show rfq selector' }));
    await user.click(screen.getByRole('button', { name: 'set target org' }));
    await user.click(screen.getByRole('button', { name: 'set org branch' }));
    await user.click(screen.getByRole('button', { name: 'set profile' }));
    const details = screen.getByTestId('details').textContent ?? '';
    expect(details).toContain('"defaultOrganisationId":42');
  });
});
