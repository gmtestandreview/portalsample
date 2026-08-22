import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
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
import { formikHelpers, stepStatuses } from './testFixtures';

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

vi.mock('../../../ClientApp/src/api/web-api-client', async (importOriginal) => {
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
    };
});

vi.mock('../../../ClientApp/src/authentication/authConfig', () => ({
    tokenRequest: { scopes: ['scope'] },
}));

vi.mock('../../../ClientApp/src/storage/notification', () => ({
    setDashboardNotification: mocks.setDashboardNotification,
    setBranchModalNotification: mocks.setBranchModalNotification,
}));

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
        mocks.getNewAccountDetails.mockResolvedValue({ stepValues: { name: 'New org' } });
        mocks.getAccountDetailsByOrgId.mockResolvedValue({ stepValues: { name: 'Existing org' } });
        mocks.getBranchDetails.mockResolvedValue({ stepValues: { name: 'Branch org' } });
        mocks.getUserContact.mockResolvedValue({ contact: { title: 'Other' } });
        mocks.signIn.mockResolvedValue({
            defaultOrganisationId: 'new-default',
            organisation: { crmGuid: 'crm-guid' },
        });
    });

    it('loads and completes create-account details with account context updates', async () => {
        const props = createAccountProps(accounts, instance, statuses, accountContext);
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
        expect(props.hidingFields?.isDefaultOrganisation?.(values as GetAccountValuesDto)).toBe(true);
        expect(props.hidingFields?.postalAddress?.(values as GetAccountValuesDto)).toBe(true);
        expect(props.hidingFields?.contact?.titleOther?.(values as GetAccountValuesDto)).toBe(true);
        expect(props.getRedirectionLocationOnError?.(HttpStatusCode.PreconditionFailed, ErrorType.Load)).toBe('/');
        expect(props.getRedirectionLocationOnError?.(HttpStatusCode.InternalServerError, ErrorType.Load)).toBeUndefined();

        await props.onSaveAndNext?.(values, true, formikHelpers<GetAccountValuesDto>(), abortSignal);

        expect(mocks.completeAccountDetails).toHaveBeenCalledWith({ formStep: values }, abortSignal);
        expect(accountContext.setOrganisationAndBranch).toHaveBeenCalledWith('National Measurement Institute', 'Trading', 'Branch');
        expect(accountContext.setCompleted).toHaveBeenCalled();
    });

    it('loads and completes update-account details with success and error notifications', async () => {
        const props = updateAccountProps(accounts, instance, statuses, accountContext, 42);
        const abortSignal = new AbortController().signal;
        const values: AccountDto = {
            id: 1,
            name: 'Updated org',
            businessOrTradingName: undefined,
            branchOrLocationName: undefined,
            contact: { title: Title.Other },
        };

        await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
            stepValues: { name: 'Existing org' },
        });
        expect(mocks.getAccountDetailsByOrgId).toHaveBeenCalledWith(42, abortSignal);
        expect(props.hidingFields?.isDefaultOrganisation?.({ isDefaultOrganisation: true })).toBe(true);
        expect(props.hidingFields?.postalAddress?.({ postalAddressSameAsStreetAddress: true })).toBe(true);
        expect(props.hidingFields?.contact?.titleOther?.(values)).toBe(false);
        expect(props.getRedirectionLocationOnError?.(HttpStatusCode.PreconditionFailed, ErrorType.Load)).toBe('/');
        expect(props.getRedirectionLocationOnError?.(HttpStatusCode.InternalServerError, ErrorType.Load)).toBeUndefined();

        await props.onSaveAndNext?.(values, true, formikHelpers<GetAccountValuesDto>(), abortSignal);
        expect(accountContext.setOrganisationAndBranch).toHaveBeenCalledWith('Updated org', '', '');
        expect(mocks.setDashboardNotification).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Your organisation details have been successfully updated.',
        }));

        mocks.completeAccountDetails.mockRejectedValueOnce({ status: HttpStatusCode.PreconditionFailed });
        await props.onSaveAndNext?.(values, true, formikHelpers<GetAccountValuesDto>(), abortSignal);
        expect(mocks.setDashboardNotification).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('already exists'),
        }));

        mocks.completeAccountDetails.mockRejectedValueOnce({ status: HttpStatusCode.InternalServerError });
        await props.onSaveAndNext?.(values, true, formikHelpers<GetAccountValuesDto>(), abortSignal);
        expect(mocks.setDashboardNotification).toHaveBeenCalledWith(expect.objectContaining({
            message: 'There was an error saving your organisation.',
        }));
    });

    it('loads and completes add-branch details with branch selector side effects', async () => {
        const onShowBranchSelector = vi.fn();
        const props = addBranchProps(accounts, instance, statuses, accountContext, onShowBranchSelector);
        const abortSignal = new AbortController().signal;
        const values = {
            name: 'Default org',
            isDefaultOrganisation: true,
            businessOrTradingName: 'Trading',
            branchOrLocationName: 'Branch',
            postalAddressSameAsStreetAddress: false,
            contact: { title: 'Other' },
        } as AccountDto;

        await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
            stepValues: { name: 'Branch org' },
        });
        expect(props.hidingFields?.isDefaultOrganisation?.(values as GetAccountValuesDto)).toBe(false);
        expect(props.hidingFields?.postalAddress?.(values as GetAccountValuesDto)).toBe(false);
        expect(props.hidingFields?.contact?.titleOther?.(values as GetAccountValuesDto)).toBe(false);
        expect(props.getRedirectionLocationOnError?.(HttpStatusCode.PreconditionFailed, ErrorType.Load)).toBe('/');
        expect(props.getRedirectionLocationOnError?.(HttpStatusCode.InternalServerError, ErrorType.Load)).toBeUndefined();

        await props.onSaveAndNext?.(values, true, formikHelpers<GetAccountValuesDto>(), abortSignal);

        expect(mocks.completeBranchAdd).toHaveBeenCalledWith({ formStep: values }, abortSignal);
        expect(mocks.userSetAuthToken).toHaveBeenCalledWith('access-token');
        expect(accountContext.setOrganisationAndBranch).toHaveBeenCalledWith('Default org', 'Trading', 'Branch');
        expect(accountContext.setDefaultOrganisationId).toHaveBeenCalledWith('new-default', 'crm-guid');
        expect(mocks.setBranchModalNotification).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Your branch/location details have been successfully saved.',
        }));
        expect(onShowBranchSelector).toHaveBeenCalled();

        mocks.completeBranchAdd.mockRejectedValueOnce({ status: HttpStatusCode.PreconditionFailed });
        await props.onSaveAndNext?.(values, true, formikHelpers<GetAccountValuesDto>(), abortSignal);
        expect(mocks.setBranchModalNotification).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('already exists'),
        }));

        mocks.completeBranchAdd.mockRejectedValueOnce({ status: HttpStatusCode.InternalServerError });
        await props.onSaveAndNext?.(values, true, formikHelpers<GetAccountValuesDto>(), abortSignal);
        expect(mocks.setBranchModalNotification).toHaveBeenCalledWith(expect.objectContaining({
            message: 'There was an error saving your branch/location details.',
        }));
    });

    it('loads and saves create/update contact details with notifications and title hiding', async () => {
        const createProps = createContactProps(accounts, instance, statuses, accountContext, 1);
        const updateProps = updateContactProps(accounts, instance, statuses, accountContext, 2);
        const abortSignal = new AbortController().signal;
        const values = { contact: { title: 'Dr' } } as ContactFormStep;

        await expect(createProps.loadStepValues?.(abortSignal)).resolves.toEqual({
            stepValues: { contact: { title: 'Other' } },
        });
        await expect(updateProps.loadStepValues?.(abortSignal)).resolves.toEqual({
            stepValues: { contact: { title: 'Other' } },
        });
        expect(createProps.hidingFields?.contact?.titleOther?.(values)).toBe(true);
        expect(updateProps.hidingFields?.contact?.titleOther?.({ contact: { title: 'Other' } })).toBe(false);
        expect(createProps.getRedirectionLocationOnError?.(HttpStatusCode.PreconditionFailed, ErrorType.Load)).toBe('/');
        expect(createProps.getRedirectionLocationOnError?.(HttpStatusCode.InternalServerError, ErrorType.Load)).toBeUndefined();
        expect(updateProps.getRedirectionLocationOnError?.(HttpStatusCode.PreconditionFailed, ErrorType.Load)).toBe('/');
        expect(updateProps.getRedirectionLocationOnError?.(HttpStatusCode.InternalServerError, ErrorType.Load)).toBeUndefined();

        await createProps.onSaveAndNext?.(values, true, formikHelpers<ContactFormStep>(), abortSignal);
        await updateProps.onSaveAndNext?.(values, true, formikHelpers<ContactFormStep>(), abortSignal);

        expect(accountContext.setContactCompleted).toHaveBeenCalledTimes(2);
        expect(mocks.setDashboardNotification).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Your contact details have been successfully saved.',
        }));

        mocks.saveContactDetails.mockRejectedValueOnce({ status: HttpStatusCode.PreconditionFailed });
        await createProps.onSaveAndNext?.(values, true, formikHelpers<ContactFormStep>(), abortSignal);
        expect(mocks.setDashboardNotification).toHaveBeenCalledWith(expect.objectContaining({
            message: 'This contact already exists. Please review the details and try again.',
        }));

        mocks.saveContactDetails.mockRejectedValueOnce({ status: HttpStatusCode.InternalServerError });
        await updateProps.onSaveAndNext?.(values, true, formikHelpers<ContactFormStep>(), abortSignal);
        expect(mocks.setDashboardNotification).toHaveBeenCalledWith(expect.objectContaining({
            message: 'There was an error saving your contact details.',
        }));

        mocks.saveContactDetails.mockRejectedValueOnce({ status: HttpStatusCode.InternalServerError });
        await createProps.onSaveAndNext?.(values, true, formikHelpers<ContactFormStep>(), abortSignal);
        expect(mocks.setDashboardNotification).toHaveBeenCalledWith(expect.objectContaining({
            message: 'There was an error saving your contact details.',
        }));

        mocks.saveContactDetails.mockRejectedValueOnce({ status: HttpStatusCode.PreconditionFailed });
        await updateProps.onSaveAndNext?.(values, true, formikHelpers<ContactFormStep>(), abortSignal);
        expect(mocks.setDashboardNotification).toHaveBeenCalledWith(expect.objectContaining({
            message: 'This contact already exists. Please review the details and try again.',
        }));
    });

    it('throws load/save errors when account or contact users are missing', async () => {
        const createAccount = createAccountProps(emptyAccounts, instance, statuses, accountContext);
        const updateAccount = updateAccountProps(emptyAccounts, instance, statuses, accountContext, 1);
        const branch = addBranchProps(emptyAccounts, instance, statuses, accountContext, vi.fn());
        const createContact = createContactProps(emptyAccounts, instance, statuses, accountContext, 1);
        const updateContact = updateContactProps(emptyAccounts, instance, statuses, accountContext, 1);

        await expect(createAccount.loadStepValues?.()).rejects.toThrow('There was an error retrieving your organisation and contact details.');
        await expect(createAccount.onSaveAndNext?.(
            {},
            false,
            formikHelpers<GetAccountValuesDto>(),
        )).rejects.toThrow('There was an error saving your organisation and contact details.');
        await expect(updateAccount.loadStepValues?.()).rejects.toThrow('There was an error retrieving your organisation details.');
        await expect(updateAccount.onSaveAndNext?.(
            {},
            false,
            formikHelpers<GetAccountValuesDto>(),
        )).rejects.toThrow('There was an error saving your organisation details.');
        await expect(branch.loadStepValues?.()).rejects.toThrow('There was an error retrieving your organisation and contact details.');
        await expect(branch.onSaveAndNext?.(
            {},
            false,
            formikHelpers<GetAccountValuesDto>(),
        )).rejects.toThrow('There was an error saving your branch/location details.');
        await expect(createContact.loadStepValues?.()).rejects.toThrow('There was an error retrieving your contact details.');
        await expect(createContact.onSaveAndNext?.(
            {},
            false,
            formikHelpers<ContactFormStep>(),
        )).rejects.toThrow('There was an error saving your contact details.');
        await expect(updateContact.loadStepValues?.()).rejects.toThrow('There was an error retrieving your contact details.');
        await expect(updateContact.onSaveAndNext?.(
            {},
            false,
            formikHelpers<ContactFormStep>(),
        )).rejects.toThrow('There was an error saving your contact details.');
    });

    it('handles optional account context and organisation values', async () => {
        const createProps = createAccountProps(accounts, instance, statuses, null);
        const updateProps = updateAccountProps(accounts, instance, statuses, accountContext, 42);
        const branchProps = addBranchProps(accounts, instance, statuses, accountContext, vi.fn());
        const helpers = formikHelpers<GetAccountValuesDto>();

        await expect(createProps.onSaveAndNext?.({
            name: 'Organisation',
            businessOrTradingName: undefined,
            branchOrLocationName: undefined,
        }, true, helpers)).resolves.toBeUndefined();

        await expect(updateProps.onSaveAndNext?.({
            id: 99,
            name: undefined,
        }, true, helpers)).resolves.toBeUndefined();
        expect(accountContext.setOrganisationAndBranch).not.toHaveBeenCalled();

        await expect(branchProps.onSaveAndNext?.({
            name: 'Non-default branch',
            isDefaultOrganisation: false,
        }, true, helpers)).resolves.toBeUndefined();
        expect(accountContext.setDefaultOrganisationId).not.toHaveBeenCalled();

        await expect(branchProps.onSaveAndNext?.({
            name: 'Default branch',
            isDefaultOrganisation: true,
            businessOrTradingName: undefined,
            branchOrLocationName: undefined,
        }, true, helpers)).resolves.toBeUndefined();
        expect(accountContext.setOrganisationAndBranch).toHaveBeenCalledWith('Default branch', '', '');
    });

    it('preserves defined trading and branch names in account context updates', async () => {
        const createProps = createAccountProps(accounts, instance, statuses, accountContext);
        const updateProps = updateAccountProps(accounts, instance, statuses, accountContext, 1);
        const helpers = formikHelpers<GetAccountValuesDto>();

        await createProps.onSaveAndNext?.({
            name: 'Created organisation',
            businessOrTradingName: undefined,
            branchOrLocationName: undefined,
        }, true, helpers);
        await updateProps.onSaveAndNext?.({
            id: 1,
            name: 'Updated organisation',
            businessOrTradingName: 'Updated trading name',
            branchOrLocationName: 'Updated branch',
        }, true, helpers);

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
        const updateProps = updateAccountProps(accounts, instance, statuses, accountContext, 42);
        const createContact = createContactProps(accounts, instance, statuses, accountContext, 1);
        const updateContact = updateContactProps(accounts, instance, statuses, accountContext, 2);

        mocks.completeAccountDetails.mockRejectedValueOnce(null);
        await expect(updateProps.onSaveAndNext?.(
            { id: 1, name: 'Organisation' },
            true,
            formikHelpers<GetAccountValuesDto>(),
        )).resolves.toBeUndefined();

        mocks.saveContactDetails.mockRejectedValueOnce(null);
        await expect(createContact.onSaveAndNext?.(
            { contact: {} },
            true,
            formikHelpers<ContactFormStep>(),
        )).resolves.toBeUndefined();

        mocks.saveContactDetails.mockRejectedValueOnce(null);
        await expect(updateContact.onSaveAndNext?.(
            { contact: {} },
            true,
            formikHelpers<ContactFormStep>(),
        )).resolves.toBeUndefined();
    });
});
