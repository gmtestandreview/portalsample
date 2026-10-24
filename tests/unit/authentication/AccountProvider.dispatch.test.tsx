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
    }) satisfies __ExactMockModule<__TestMockModule2>
);

vi.mock(
  import('@azure/msal-browser'),
  () =>
    ({
      InteractionStatus: { Logout: 'logout', None: 'none', Startup: 'startup' },
    }) satisfies __ExactMockModule<__TestMockModule3>
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
    }) satisfies __ExactMockModule<__TestMockModule4>
);

vi.mock(
  import('../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: {
        error: providerMocks.appLoggerError,
        verbose: vi.fn(),
      },
    }) satisfies __ExactMockModule<__TestMockModule5>
);

vi.mock(
  import('../../../ClientApp/src/storage/targetOrganisation'),
  () =>
    ({
      default: providerMocks.setStoredTargetOrganisation,
      getTargetOrganisation: providerMocks.getStoredTargetOrganisation,
    }) satisfies __ExactMockModule<__TestMockModule6>
);

vi.mock(
  import('../../../ClientApp/src/terms-config.json'),
  () =>
    ({
      default: { TermsVersion: '1' },
    }) satisfies __ExactMockModule<__TestMockModule7>
);

vi.mock(
  import('../../../ClientApp/src/authentication/authConfig'),
  () =>
    ({
      tokenRequest: { scopes: ['read'] },
    }) satisfies __ExactMockModule<__TestMockModule8>
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
            'Branch Name'
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
            undefined as unknown as string
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
            >[0]
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
    const user = userEvent.setup();

    render(
      <AccountProvider>
        <AccountConsumer />
      </AccountProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('details')).toHaveTextContent('Test Org')
    );

    await user.click(screen.getByRole('button', { name: 'agree' }));
    await user.click(screen.getByRole('button', { name: 'complete account' }));
    await user.click(screen.getByRole('button', { name: 'complete contact' }));
    await user.click(screen.getByRole('button', { name: 'set default org' }));
    await user.click(
      screen.getByRole('button', { name: 'show branch selector' })
    );
    await user.click(screen.getByRole('button', { name: 'show rfq selector' }));
    await user.click(screen.getByRole('button', { name: 'set target org' }));
    await user.click(screen.getByRole('button', { name: 'set org branch' }));
    await user.click(screen.getByRole('button', { name: 'set profile' }));

    const details = screen.getByTestId('details').textContent ?? '';

    expect(details).toContain('"userAcceptedTermsOfUse":true');
    expect(details).toContain('"accountCreationCompleted":true');
    expect(details).toContain('"accountContactCompleted":true');
    expect(details).toContain('"defaultOrganisationId":42');
    expect(details).toContain('"organisationCRMGuid":"crm-42"');
    expect(details).toContain('"showBranchSelector":true');
    expect(details).toContain('"rfqId":"rfq-123"');
    expect(details).toContain('"callingPath":"/requests"');
    expect(details).toContain('"targetOrganisationAbn":"99999999999"');
    expect(details).toContain('"targetOrganisationName":"Target Org"');
    expect(details).toContain('"organisation":"New Org"');
    expect(details).toContain('"trading":"Trading Name"');
    expect(details).toContain('"branch":"Branch Name"');
    expect(details).toContain(
      '"userProfile":{"testingCalibrationDashboard":{"filterActiveTab":"2","filterCurrentPage":3,"filterSearchText":"needle","filterSortOrder":"1","filterStatusType":"4","filterYearType":"2026","filtersChanged":true}}'
    );
    expect(providerMocks.setStoredTargetOrganisation).toHaveBeenCalledWith({
      targetOrganisationAbn: '99999999999',
      targetOrganisationName: 'Target Org',
    });

    await waitFor(() =>
      expect(providerMocks.setUserProfileApi).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        undefined,
        '4',
        '2026',
        '1',
        true,
        3,
        '2',
        'needle',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      )
    );
  });

  it('logs profile save failures without removing provider children', async () => {
    const user = userEvent.setup();
    providerMocks.setUserProfileApi.mockRejectedValue(new Error('save failed'));

    render(
      <AccountProvider>
        <AccountConsumer />
      </AccountProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('details')).toHaveTextContent('Test Org')
    );
    await user.click(screen.getByRole('button', { name: 'set profile' }));

    await waitFor(() =>
      expect(providerMocks.appLoggerError).toHaveBeenCalledWith(
        'Failed to save userprofile',
        expect.any(Error)
      )
    );

    expect(screen.getByTestId('details')).toHaveTextContent('userProfile');
  });

  it('clears account details while MSAL logout is in progress', async () => {
    providerMocks.inProgress = 'logout';

    render(
      <AccountProvider>
        <AccountConsumer />
      </AccountProvider>
    );

    expect(screen.getByTestId('details')).toHaveTextContent('null');
    expect(providerMocks.signIn).not.toHaveBeenCalled();
  });

  it('uses the active account without request-level navigation callbacks', async () => {
    providerMocks.signIn.mockRejectedValue(new Error('load failed'));

    render(
      <AccountProvider>
        <AccountConsumer />
      </AccountProvider>
    );

    await waitFor(() =>
      expect(providerMocks.logoutRedirect).toHaveBeenCalledWith()
    );

    expect(providerMocks.logoutRedirect).toHaveBeenCalledWith({
      account: { homeAccountId: 'active-id' },
    });
  });

  it('shows error UI and logs out when account-load token acquisition fails', async () => {
    providerMocks.acquireTokenSilent.mockRejectedValue(
      new Error('token failed')
    );

    render(
      <AccountProvider>
        <AccountConsumer />
      </AccountProvider>
    );

    await waitFor(() =>
      expect(providerMocks.logoutRedirect).toHaveBeenCalledWith()
    );

    expect(providerMocks.logoutRedirect).toHaveBeenCalledTimes(1);

    expect(
      screen.getByText(/Unable to load account details/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId('details')).not.toBeInTheDocument();
    expect(providerMocks.appLoggerError).toHaveBeenCalledWith(
      'Failed to load loadAccountDetails',
      expect.any(Error)
    );
  });

  it('leaves dispatch callbacks as no-ops before account details exist', async () => {
    const user = userEvent.setup();
    providerMocks.accounts = [];

    render(
      <AccountProvider>
        <AccountConsumer />
      </AccountProvider>
    );

    expect(screen.getByTestId('details')).toHaveTextContent('null');

    await user.click(screen.getByRole('button', { name: 'agree' }));
    await user.click(screen.getByRole('button', { name: 'complete account' }));
    await user.click(screen.getByRole('button', { name: 'complete contact' }));
    await user.click(screen.getByRole('button', { name: 'set default org' }));
    await user.click(
      screen.getByRole('button', { name: 'show branch selector' })
    );
    await user.click(screen.getByRole('button', { name: 'show rfq selector' }));
    await user.click(screen.getByRole('button', { name: 'set target org' }));
    await user.click(screen.getByRole('button', { name: 'set org branch' }));
    await user.click(screen.getByRole('button', { name: 'set profile' }));
    await user.click(
      screen.getByRole('button', { name: 'set undefined profile' })
    );

    expect(screen.getByTestId('details')).toHaveTextContent('null');
    expect(providerMocks.acquireTokenSilent).not.toHaveBeenCalled();
    expect(providerMocks.signIn).not.toHaveBeenCalled();
  });

  it('uses existing business context and defaults missing user fields', async () => {
    providerMocks.accounts = [
      {
        homeAccountId: 'minimal-id',
        idTokenClaims: {} as {
          email: string;
          family_name: string;
          given_name: string;
        },
      },
    ];
    providerMocks.getStoredTargetOrganisation.mockReturnValue({
      targetOrganisationAbn: 'stored-abn',
      targetOrganisationName: 'Stored Org',
    });
    providerMocks.signIn.mockResolvedValue({
      acceptedTerms: true,
      defaultOrganisationId: undefined,
      organisation: undefined,
      termsVersion: 2,
      userProfile: {
        testingCalibrationDashboard: {
          filterSearchText: 'saved',
        },
      },
    });

    render(
      <AccountProvider>
        <AccountConsumer />
      </AccountProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('details')).toHaveTextContent('minimal-id')
    );

    const details = screen.getByTestId('details').textContent ?? '';

    expect(details).toContain('"organisation":""');
    expect(details).toContain('"trading":""');
    expect(details).toContain('"branch":""');
    expect(details).toContain('"abn":""');
    expect(details).toContain('"userAcceptedTermsOfUse":false');
    expect(details).toContain('"accountCreationCompleted":false');
    expect(details).toContain('"accountContactCompleted":false');
    expect(details).toContain('"targetOrganisationAbn":"stored-abn"');
    expect(details).toContain('"targetOrganisationName":"Stored Org"');
    expect(details).toContain('"organisationIsCompleted":false');
    expect(providerMocks.setStoredTargetOrganisation).not.toHaveBeenCalled();
    expect(details).toContain(
      '"userProfile":{"testingCalibrationDashboard":{"filterSearchText":"saved"}}'
    );
  });

  it('stores empty target organisation values when no business context or organisation exists', async () => {
    providerMocks.signIn.mockResolvedValue({
      acceptedTerms: false,
      defaultOrganisationId: null,
      organisation: undefined,
      termsVersion: '1',
    });

    render(
      <AccountProvider>
        <AccountConsumer />
      </AccountProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('details')).toHaveTextContent('test-id')
    );

    expect(providerMocks.setStoredTargetOrganisation).toHaveBeenCalledWith({
      targetOrganisationAbn: '',
      targetOrganisationName: '',
    });
  });

  it('falls back to empty trading and branch names when organisation branch dispatch receives nullish values', async () => {
    const user = userEvent.setup();

    render(
      <AccountProvider>
        <AccountConsumer />
      </AccountProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('details')).toHaveTextContent('Test Org')
    );
    await user.click(
      screen.getByRole('button', { name: 'set fallback org branch' })
    );

    const details = screen.getByTestId('details').textContent ?? '';

    expect(details).toContain('"organisation":"Fallback Org"');
    expect(details).toContain('"trading":""');
    expect(details).toContain('"branch":""');
  });

  it('logs profile-save token failures without removing provider children', async () => {
    const user = userEvent.setup();

    render(
      <AccountProvider>
        <AccountConsumer />
      </AccountProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('details')).toHaveTextContent('Test Org')
    );
    providerMocks.acquireTokenSilent.mockRejectedValueOnce(
      new Error('profile token failed')
    );
    await user.click(screen.getByRole('button', { name: 'set profile' }));

    await waitFor(() =>
      expect(providerMocks.appLoggerError).toHaveBeenCalledWith(
        'Failed to save userprofile',
        expect.any(Error)
      )
    );

    expect(screen.getByTestId('details')).toHaveTextContent('userProfile');
  });
});
