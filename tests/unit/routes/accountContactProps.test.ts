import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  AccountInfo,
  IPublicClientApplication,
} from '@azure/msal-browser';
import createAccountProps from '../../../ClientApp/src/routes/account/create/createAccountProps';
import updateAccountProps from '../../../ClientApp/src/routes/account/update/updateAccountProps';
import addBranchProps from '../../../ClientApp/src/routes/account/addBranch/addBranchProps';
import createContactProps from '../../../ClientApp/src/routes/contact/create/createContactProps';
import updateContactProps from '../../../ClientApp/src/routes/contact/update/updateContactProps';
import { HttpStatusCode } from '../../../ClientApp/src/types';
import { ErrorType } from '../../../ClientApp/src/components/forms/WizardForm/types';
import type { AccountContextState } from '../../../ClientApp/src/authentication/accountContext';
import {
  Title,
  type AccountDto,
  type ContactFormStep,
  type GetAccountValuesDto,
} from '../../../ClientApp/src/api/web-api-client';
import { stepStatuses } from './testFixtures';

const mocks = vi.hoisted(() => ({
  acquireTokenSilent: vi.fn<(...args: unknown[]) => unknown>(),
  accountSetAuthToken: vi.fn<(...args: unknown[]) => unknown>(),
  contactSetAuthToken: vi.fn<(...args: unknown[]) => unknown>(),
  userSetAuthToken: vi.fn<(...args: unknown[]) => unknown>(),
  getNewAccountDetails: vi.fn<(...args: unknown[]) => unknown>(),
  completeAccountDetails: vi.fn<(...args: unknown[]) => unknown>(),
  getAccountDetailsByOrgId: vi.fn<(...args: unknown[]) => unknown>(),
  getBranchDetails: vi.fn<(...args: unknown[]) => unknown>(),
  completeBranchAdd: vi.fn<(...args: unknown[]) => unknown>(),
  signIn: vi.fn<(...args: unknown[]) => unknown>(),
  getUserContact: vi.fn<(...args: unknown[]) => unknown>(),
  saveContactDetails: vi.fn<(...args: unknown[]) => unknown>(),
  setDashboardNotification: vi.fn<(...args: unknown[]) => unknown>(),
  setBranchModalNotification: vi.fn<(...args: unknown[]) => unknown>(),
}));

// eslint-disable-next-line vitest/prefer-import-in-mock
vi.mock('../../../ClientApp/src/api/web-api-client', async (importOriginal) => {
  const actual = await importOriginal();
  if (typeof actual !== 'object' || actual === null) {
    throw new TypeError('Expected module exports object');
  }
  return {
    ...actual,
    AccountsClient: vi.fn<(...args: unknown[]) => unknown>(
      function AccountsClientMock() {
        return {
          setAuthToken: mocks.accountSetAuthToken,
          getNewAccountDetails: mocks.getNewAccountDetails,
          completeAccountDetails: mocks.completeAccountDetails,
          getAccountDetailsByOrgId: mocks.getAccountDetailsByOrgId,
          getBranchDetails: mocks.getBranchDetails,
          completeBranchAdd: mocks.completeBranchAdd,
        };
      },
    ),
    ContactClient: vi.fn<(...args: unknown[]) => unknown>(
      function ContactClientMock() {
        return {
          setAuthToken: mocks.contactSetAuthToken,
          getUserContact: mocks.getUserContact,
          saveContactDetails: mocks.saveContactDetails,
        };
      },
    ),
    UsersClient: vi.fn<(...args: unknown[]) => unknown>(
      function UsersClientMock() {
        return {
          setAuthToken: mocks.userSetAuthToken,
          signIn: mocks.signIn,
        };
      },
    ),
  } satisfies __ExactMockModule<__TestMockModule4>;
});

vi.mock(
  import('../../../ClientApp/src/authentication/authConfig'),
  () =>
    ({
      tokenRequest: { scopes: ['scope'] },
    }) satisfies __ExactMockModule<__TestMockModule8>,
);

vi.mock(
  import('../../../ClientApp/src/storage/notification'),
  () =>
    ({
      setDashboardNotification: mocks.setDashboardNotification,
      setBranchModalNotification: mocks.setBranchModalNotification,
    }) satisfies __ExactMockModule<__TestMockModule46>,
);

const accounts = [{ homeAccountId: 'account-1' }] as AccountInfo[];
const emptyAccounts = [] as AccountInfo[];
const instance = {
  acquireTokenSilent: mocks.acquireTokenSilent,
} as unknown as IPublicClientApplication;
const statuses = stepStatuses;

const accountContext = {
  details: { defaultOrganisationId: 1 },
  setOrganisationAndBranch: vi.fn<(...args: unknown[]) => unknown>(),
  setDefaultOrganisationId: vi.fn<(...args: unknown[]) => unknown>(),
  setCompleted: vi.fn<(...args: unknown[]) => unknown>(),
  setContactCompleted: vi.fn<(...args: unknown[]) => unknown>(),
} as unknown as AccountContextState;

describe('account and contact wizard prop factories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.getNewAccountDetails.mockResolvedValue({
      stepValues: { name: 'New org' },
    });
    mocks.getAccountDetailsByOrgId.mockResolvedValue({
      stepValues: { name: 'Existing org' },
    });
    mocks.getBranchDetails.mockResolvedValue({
      stepValues: { name: 'Branch org' },
    });
    mocks.getUserContact.mockResolvedValue({ contact: { title: 'Other' } });
    mocks.signIn.mockResolvedValue({
      defaultOrganisationId: 'new-default',
      organisation: { crmGuid: 'crm-guid' },
    });
  });

  it('loads and completes create-account details with account context updates', async () => {
    expect.hasAssertions();

    const props = createAccountProps(
      accounts,
      instance,
      statuses,
      accountContext,
    );
    const abortSignal = new AbortController().signal;
    const values = {
      name: 'National Measurement Institute',
      businessOrTradingName: 'Trading',
      branchOrLocationName: 'Branch',
      isDefaultOrganisation: true,
      postalAddressSameAsStreetAddress: true,
      contact: { title: 'Dr' },
    } as AccountDto;

    const loaded = await props.loadStepValues?.(abortSignal);

    expect({
      loaded,
      hidden: [
        props.hidingFields?.isDefaultOrganisation?.(
          values as GetAccountValuesDto,
        ),
        props.hidingFields?.postalAddress?.(values as GetAccountValuesDto),
        props.hidingFields?.contact?.titleOther?.(
          values as GetAccountValuesDto,
        ),
      ],
      redirects: [
        props.getRedirectionLocationOnError?.(
          HttpStatusCode.PreconditionFailed,
          ErrorType.Load,
        ),
        props.getRedirectionLocationOnError?.(
          HttpStatusCode.InternalServerError,
          ErrorType.Load,
        ),
      ],
    }).toStrictEqual({
      loaded: { stepValues: { name: 'New org' } },
      hidden: [true, true, true],
      redirects: ['/', undefined],
    });

    await props.onSaveAndNext?.(values, true, abortSignal);

    expect({
      completeCalls: mocks.completeAccountDetails.mock.calls,
      organisationCalls: vi.mocked(accountContext.setOrganisationAndBranch).mock
        .calls,
      completedCalls: vi.mocked(accountContext.setCompleted).mock.calls,
    }).toStrictEqual({
      completeCalls: [[{ formStep: values }, abortSignal]],
      organisationCalls: [
        ['National Measurement Institute', 'Trading', 'Branch'],
      ],
      completedCalls: [[]],
    });
  });

  it('loads and completes update-account details with success and error notifications', async () => {
    expect.hasAssertions();

    const props = updateAccountProps(
      accounts,
      instance,
      statuses,
      accountContext,
      42,
    );
    const abortSignal = new AbortController().signal;
    const values: AccountDto = {
      id: 1,
      name: 'Updated org',
      businessOrTradingName: undefined,
      branchOrLocationName: undefined,
      contact: { title: Title.Other },
    };

    const loaded = await props.loadStepValues?.(abortSignal);

    expect({
      loaded,
      getCalls: mocks.getAccountDetailsByOrgId.mock.calls,
      hidden: [
        props.hidingFields?.isDefaultOrganisation?.({
          isDefaultOrganisation: true,
        }),
        props.hidingFields?.postalAddress?.({
          postalAddressSameAsStreetAddress: true,
        }),
        props.hidingFields?.contact?.titleOther?.(values),
      ],
      redirects: [
        props.getRedirectionLocationOnError?.(
          HttpStatusCode.PreconditionFailed,
          ErrorType.Load,
        ),
        props.getRedirectionLocationOnError?.(
          HttpStatusCode.InternalServerError,
          ErrorType.Load,
        ),
      ],
    }).toStrictEqual({
      loaded: { stepValues: { name: 'Existing org' } },
      getCalls: [[42, abortSignal]],
      hidden: [true, true, false],
      redirects: ['/', undefined],
    });

    await props.onSaveAndNext?.(values, true, abortSignal);

    expect({
      organisationCalls: vi.mocked(accountContext.setOrganisationAndBranch).mock
        .calls,
      notifications: mocks.setDashboardNotification.mock.calls,
    }).toMatchObject({
      organisationCalls: [['Updated org', '', '']],
      notifications: [
        [
          expect.objectContaining({
            message:
              'Your organisation details have been successfully updated.',
          }),
        ],
      ],
    });

    mocks.completeAccountDetails.mockRejectedValueOnce({
      status: HttpStatusCode.PreconditionFailed,
    });
    await props.onSaveAndNext?.(values, true, abortSignal);

    mocks.completeAccountDetails.mockRejectedValueOnce({
      status: HttpStatusCode.InternalServerError,
    });
    await props.onSaveAndNext?.(values, true, abortSignal);

    expect(mocks.setDashboardNotification.mock.calls).toMatchObject([
      [
        expect.objectContaining({
          message: 'Your organisation details have been successfully updated.',
        }),
      ],
      [
        expect.objectContaining({
          message: expect.stringContaining('already exists'),
        }),
      ],
      [
        expect.objectContaining({
          message: 'There was an error saving your organisation.',
        }),
      ],
    ]);
  });

  it('loads and completes add-branch details with branch selector side effects', async () => {
    expect.hasAssertions();

    const onShowBranchSelector = vi.fn<(...args: unknown[]) => unknown>();
    const props = addBranchProps(
      accounts,
      instance,
      statuses,
      accountContext,
      onShowBranchSelector,
    );
    const abortSignal = new AbortController().signal;
    const values = {
      name: 'Default org',
      isDefaultOrganisation: true,
      businessOrTradingName: 'Trading',
      branchOrLocationName: 'Branch',
      postalAddressSameAsStreetAddress: false,
      contact: { title: 'Other' },
    } as AccountDto;

    const loaded = await props.loadStepValues?.(abortSignal);

    expect({
      loaded,
      hidden: [
        props.hidingFields?.isDefaultOrganisation?.(
          values as GetAccountValuesDto,
        ),
        props.hidingFields?.postalAddress?.(values as GetAccountValuesDto),
        props.hidingFields?.contact?.titleOther?.(
          values as GetAccountValuesDto,
        ),
      ],
      redirects: [
        props.getRedirectionLocationOnError?.(
          HttpStatusCode.PreconditionFailed,
          ErrorType.Load,
        ),
        props.getRedirectionLocationOnError?.(
          HttpStatusCode.InternalServerError,
          ErrorType.Load,
        ),
      ],
    }).toStrictEqual({
      loaded: { stepValues: { name: 'Branch org' } },
      hidden: [false, false, false],
      redirects: ['/', undefined],
    });

    const saveResult = props.onSaveAndNext?.(values, true, abortSignal);

    expect(saveResult).toBeInstanceOf(Promise);

    await saveResult;

    expect({
      completeCalls: mocks.completeBranchAdd.mock.calls,
      authCalls: mocks.userSetAuthToken.mock.calls,
      organisationCalls: vi.mocked(accountContext.setOrganisationAndBranch).mock
        .calls,
      defaultOrganisationCalls: vi.mocked(
        accountContext.setDefaultOrganisationId,
      ).mock.calls,
      notifications: mocks.setBranchModalNotification.mock.calls,
      selectorCalls: onShowBranchSelector.mock.calls,
    }).toMatchObject({
      completeCalls: [[{ formStep: values }, abortSignal]],
      authCalls: [['access-token']],
      organisationCalls: [['Default org', 'Trading', 'Branch']],
      defaultOrganisationCalls: [['new-default', 'crm-guid']],
      notifications: [
        [
          expect.objectContaining({
            message:
              'Your branch/location details have been successfully saved.',
          }),
        ],
      ],
      selectorCalls: [[]],
    });

    mocks.completeBranchAdd.mockRejectedValueOnce({
      status: HttpStatusCode.PreconditionFailed,
    });
    await props.onSaveAndNext?.(values, true, abortSignal);

    mocks.completeBranchAdd.mockRejectedValueOnce({
      status: HttpStatusCode.InternalServerError,
    });
    await props.onSaveAndNext?.(values, true, abortSignal);

    expect(mocks.setBranchModalNotification.mock.calls).toMatchObject([
      [
        expect.objectContaining({
          message: 'Your branch/location details have been successfully saved.',
        }),
      ],
      [
        expect.objectContaining({
          message: expect.stringContaining('already exists'),
        }),
      ],
      [
        expect.objectContaining({
          message: 'There was an error saving your branch/location details.',
        }),
      ],
    ]);
  });

  it('loads and saves create/update contact details with notifications and title hiding', async () => {
    expect.hasAssertions();

    const createProps = createContactProps(
      accounts,
      instance,
      statuses,
      accountContext,
      1,
    );
    const updateProps = updateContactProps(
      accounts,
      instance,
      statuses,
      accountContext,
      2,
    );
    const abortSignal = new AbortController().signal;
    const values = { contact: { title: 'Dr' } } as ContactFormStep;

    const createLoaded = await createProps.loadStepValues?.(abortSignal);
    const updateLoaded = await updateProps.loadStepValues?.(abortSignal);

    expect({
      loaded: [createLoaded, updateLoaded],
      contactCalls: mocks.getUserContact.mock.calls,
      hidden: [
        createProps.hidingFields?.contact?.titleOther?.(values),
        updateProps.hidingFields?.contact?.titleOther?.({
          contact: { title: 'Other' },
        }),
      ],
      redirects: [
        createProps.getRedirectionLocationOnError?.(
          HttpStatusCode.PreconditionFailed,
          ErrorType.Load,
        ),
        createProps.getRedirectionLocationOnError?.(
          HttpStatusCode.InternalServerError,
          ErrorType.Load,
        ),
        updateProps.getRedirectionLocationOnError?.(
          HttpStatusCode.PreconditionFailed,
          ErrorType.Load,
        ),
        updateProps.getRedirectionLocationOnError?.(
          HttpStatusCode.InternalServerError,
          ErrorType.Load,
        ),
      ],
    }).toStrictEqual({
      loaded: [
        { stepValues: { contact: { title: 'Other' } } },
        { stepValues: { contact: { title: 'Other' } } },
      ],
      contactCalls: [
        [undefined, abortSignal],
        [undefined, abortSignal],
      ],
      hidden: [true, false],
      redirects: ['/', undefined, '/', undefined],
    });

    await createProps.onSaveAndNext?.(values, true, abortSignal);
    await updateProps.onSaveAndNext?.(values, true, abortSignal);

    expect({
      completedCalls: vi.mocked(accountContext.setContactCompleted).mock.calls,
      notifications: mocks.setDashboardNotification.mock.calls,
    }).toMatchObject({
      completedCalls: [[], []],
      notifications: [
        [
          expect.objectContaining({
            message: 'Your contact details have been successfully saved.',
          }),
        ],
        [
          expect.objectContaining({
            message: 'Your contact details have been successfully saved.',
          }),
        ],
      ],
    });

    mocks.saveContactDetails.mockRejectedValueOnce({
      status: HttpStatusCode.PreconditionFailed,
    });
    await createProps.onSaveAndNext?.(values, true, abortSignal);

    mocks.saveContactDetails.mockRejectedValueOnce({
      status: HttpStatusCode.InternalServerError,
    });
    await updateProps.onSaveAndNext?.(values, true, abortSignal);

    mocks.saveContactDetails.mockRejectedValueOnce({
      status: HttpStatusCode.InternalServerError,
    });
    await createProps.onSaveAndNext?.(values, true, abortSignal);

    mocks.saveContactDetails.mockRejectedValueOnce({
      status: HttpStatusCode.PreconditionFailed,
    });
    await updateProps.onSaveAndNext?.(values, true, abortSignal);

    expect(mocks.setDashboardNotification.mock.calls).toMatchObject([
      [
        expect.objectContaining({
          message: 'Your contact details have been successfully saved.',
        }),
      ],
      [
        expect.objectContaining({
          message: 'Your contact details have been successfully saved.',
        }),
      ],
      [
        expect.objectContaining({
          message:
            'This contact already exists. Please review the details and try again.',
        }),
      ],
      [
        expect.objectContaining({
          message: 'There was an error saving your contact details.',
        }),
      ],
      [
        expect.objectContaining({
          message: 'There was an error saving your contact details.',
        }),
      ],
      [
        expect.objectContaining({
          message:
            'This contact already exists. Please review the details and try again.',
        }),
      ],
    ]);
  });

  it('throws load/save errors when account or contact users are missing', async () => {
    expect.hasAssertions();

    const createAccount = createAccountProps(
      emptyAccounts,
      instance,
      statuses,
      accountContext,
    );
    const updateAccount = updateAccountProps(
      emptyAccounts,
      instance,
      statuses,
      accountContext,
      1,
    );
    const branch = addBranchProps(
      emptyAccounts,
      instance,
      statuses,
      accountContext,
      vi.fn<(...args: unknown[]) => unknown>(),
    );
    const createContact = createContactProps(
      emptyAccounts,
      instance,
      statuses,
      accountContext,
      1,
    );
    const updateContact = updateContactProps(
      emptyAccounts,
      instance,
      statuses,
      accountContext,
      1,
    );

    const rejectionMessage = async (invoke: () => unknown) => {
      try {
        await invoke();
        return undefined;
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    };

    await expect(
      Promise.all([
        rejectionMessage(() => createAccount.loadStepValues?.()),
        rejectionMessage(() => createAccount.onSaveAndNext?.({}, false)),
        rejectionMessage(() => updateAccount.loadStepValues?.()),
        rejectionMessage(() => updateAccount.onSaveAndNext?.({}, false)),
        rejectionMessage(() => branch.loadStepValues?.()),
        rejectionMessage(() => branch.onSaveAndNext?.({}, false)),
        rejectionMessage(() => createContact.loadStepValues?.()),
        rejectionMessage(() => createContact.onSaveAndNext?.({}, false)),
        rejectionMessage(() => updateContact.loadStepValues?.()),
        rejectionMessage(() => updateContact.onSaveAndNext?.({}, false)),
      ]),
    ).resolves.toStrictEqual([
      'There was an error retrieving your organisation and contact details.',
      'There was an error saving your organisation and contact details.',
      'There was an error retrieving your organisation details.',
      'There was an error saving your organisation details.',
      'There was an error retrieving your organisation and contact details.',
      'There was an error saving your branch/location details.',
      'There was an error retrieving your contact details.',
      'There was an error saving your contact details.',
      'There was an error retrieving your contact details.',
      'There was an error saving your contact details.',
    ]);
  });

  it('handles optional account context and organisation values', async () => {
    expect.hasAssertions();

    const createProps = createAccountProps(accounts, instance, statuses, null);
    const updateProps = updateAccountProps(
      accounts,
      instance,
      statuses,
      accountContext,
      42,
    );
    const branchProps = addBranchProps(
      accounts,
      instance,
      statuses,
      accountContext,
      vi.fn<(...args: unknown[]) => unknown>(),
    );

    const createResult = await createProps.onSaveAndNext?.(
      {
        name: 'Organisation',
        businessOrTradingName: undefined,
        branchOrLocationName: undefined,
      },
      true,
    );
    const updateResult = await updateProps.onSaveAndNext?.(
      {
        id: 99,
        name: undefined,
      },
      true,
    );

    expect([createResult, updateResult]).toStrictEqual([undefined, undefined]);

    const nonDefaultBranchResult = await branchProps.onSaveAndNext?.(
      {
        name: 'Non-default branch',
        isDefaultOrganisation: false,
      },
      true,
    );

    expect({
      nonDefaultBranchResult,
      organisationCalls: vi.mocked(accountContext.setOrganisationAndBranch).mock
        .calls,
      defaultOrganisationCalls: vi.mocked(
        accountContext.setDefaultOrganisationId,
      ).mock.calls,
    }).toStrictEqual({
      nonDefaultBranchResult: undefined,
      organisationCalls: [],
      defaultOrganisationCalls: [],
    });

    const defaultBranchResult = await branchProps.onSaveAndNext?.(
      {
        name: 'Default branch',
        isDefaultOrganisation: true,
        businessOrTradingName: undefined,
        branchOrLocationName: undefined,
      },
      true,
    );

    expect({
      defaultBranchResult,
      organisationCalls: vi.mocked(accountContext.setOrganisationAndBranch).mock
        .calls,
    }).toStrictEqual({
      defaultBranchResult: undefined,
      organisationCalls: [['Default branch', '', '']],
    });
  });

  it('preserves defined trading and branch names in account context updates', async () => {
    expect.hasAssertions();

    const createProps = createAccountProps(
      accounts,
      instance,
      statuses,
      accountContext,
    );
    const updateProps = updateAccountProps(
      accounts,
      instance,
      statuses,
      accountContext,
      1,
    );

    await createProps.onSaveAndNext?.(
      {
        name: 'Created organisation',
        businessOrTradingName: undefined,
        branchOrLocationName: undefined,
      },
      true,
    );
    await updateProps.onSaveAndNext?.(
      {
        id: 1,
        name: 'Updated organisation',
        businessOrTradingName: 'Updated trading name',
        branchOrLocationName: 'Updated branch',
      },
      true,
    );

    expect(accountContext.setOrganisationAndBranch).toHaveBeenCalledWith(
      'Created organisation',
      '',
      '',
    );
    expect(accountContext.setOrganisationAndBranch).toHaveBeenCalledWith(
      'Updated organisation',
      'Updated trading name',
      'Updated branch',
    );
  });

  it('ignores falsy caught account and contact errors', async () => {
    expect.hasAssertions();

    const updateProps = updateAccountProps(
      accounts,
      instance,
      statuses,
      accountContext,
      42,
    );
    const createContact = createContactProps(
      accounts,
      instance,
      statuses,
      accountContext,
      1,
    );
    const updateContact = updateContactProps(
      accounts,
      instance,
      statuses,
      accountContext,
      2,
    );

    mocks.completeAccountDetails.mockRejectedValueOnce(null);

    await expect(
      updateProps.onSaveAndNext?.({ id: 1, name: 'Organisation' }, true),
    ).resolves.toBeUndefined();

    mocks.saveContactDetails.mockRejectedValueOnce(null);

    await expect(
      createContact.onSaveAndNext?.({ contact: {} }, true),
    ).resolves.toBeUndefined();

    mocks.saveContactDetails.mockRejectedValueOnce(null);

    await expect(
      updateContact.onSaveAndNext?.({ contact: {} }, true),
    ).resolves.toBeUndefined();
  });
});
