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
  acquireTokenSilent: vi.fn(),
  accountSetAuthToken: vi.fn(),
  contactSetAuthToken: vi.fn(),
  userSetAuthToken: vi.fn(),
  getNewAccountDetails: vi.fn(),
  completeAccountDetails: vi.fn(),
  getAccountDetailsByOrgId: vi.fn(),
  getBranchDetails: vi.fn(),
  completeBranchAdd: vi.fn(),
  signIn: vi.fn(),
  getUserContact: vi.fn(),
  saveContactDetails: vi.fn(),
  setDashboardNotification: vi.fn(),
  setBranchModalNotification: vi.fn(),
}));

vi.mock(
  import('../../../ClientApp/src/api/web-api-client'),
  async (importOriginal) => {
    const actual = await importOriginal();
    if (typeof actual !== 'object' || actual === null) {
      throw new TypeError('Expected module exports object');
    }
    return {
      ...actual,
      AccountsClient: vi.fn(function AccountsClientMock() {
        return {
          setAuthToken: mocks.accountSetAuthToken,
          getNewAccountDetails: mocks.getNewAccountDetails,
          completeAccountDetails: mocks.completeAccountDetails,
          getAccountDetailsByOrgId: mocks.getAccountDetailsByOrgId,
          getBranchDetails: mocks.getBranchDetails,
          completeBranchAdd: mocks.completeBranchAdd,
        };
      }),
      ContactClient: vi.fn(function ContactClientMock() {
        return {
          setAuthToken: mocks.contactSetAuthToken,
          getUserContact: mocks.getUserContact,
          saveContactDetails: mocks.saveContactDetails,
        };
      }),
      UsersClient: vi.fn(function UsersClientMock() {
        return {
          setAuthToken: mocks.userSetAuthToken,
          signIn: mocks.signIn,
        };
      }),
    } satisfies __ExactMockModule<__TestMockModule4>;
  },
);

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
  setOrganisationAndBranch: vi.fn(),
  setDefaultOrganisationId: vi.fn(),
  setCompleted: vi.fn(),
  setContactCompleted: vi.fn(),
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
    expect.assertions(1);
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
    await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
      stepValues: { name: 'New org' },
    });
  });
});

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
    expect.assertions(1);
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
    expect(
      props.hidingFields?.isDefaultOrganisation?.(
        values as GetAccountValuesDto,
      ),
    ).toBe(true);
  });
});

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
    expect.assertions(1);
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
    expect(
      props.hidingFields?.postalAddress?.(values as GetAccountValuesDto),
    ).toBe(true);
  });
});

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
    expect.assertions(1);
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
    expect(
      props.hidingFields?.contact?.titleOther?.(values as GetAccountValuesDto),
    ).toBe(true);
  });
});

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
    expect.assertions(1);
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
    expect(
      props.getRedirectionLocationOnError?.(
        HttpStatusCode.PreconditionFailed,
        ErrorType.Load,
      ),
    ).toBe('/');
  });
});
