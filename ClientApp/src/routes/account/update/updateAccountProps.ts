import type { FormikHelpers } from 'formik';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import { AccountsClient } from '../../../api/web-api-client';
import type { AccountDto, GetAccountValuesDto, FormStepStatusDto, ValidationProblemDetails } from '../../../api/web-api-client';
import { tokenRequest } from '../../../authentication/authConfig';
import type { ErrorType, WizardFormStepValues, WizardStepProps } from '../../../components/forms/WizardForm/types';
import type { DiscardProps } from '../../../components/forms/FormikForm/types';
import { setDashboardNotification } from '../../../storage/notification';
import { NotificationSeverity } from '../../../storage/types';
import type { AccountContextState } from '../../../authentication/accountContext';
import { HttpStatusCode } from '../../../types';
import organisationSubmitValidation from './validation';

const loadAccountDetails = (accounts: AccountInfo[], instance: IPublicClientApplication, accountId: number) => async (
    abortSignal?: AbortSignal,
) => {
    if (accounts.length > 0) {
        const client = new AccountsClient();
        const tokenResult = await instance.acquireTokenSilent({
            ...tokenRequest,
            account: accounts[0],
        });
        client.setAuthToken(tokenResult.accessToken);

        const businessDetailsStep = await client.getAccountDetailsByOrgId(accountId, abortSignal);

        const wizardStepValues: WizardFormStepValues<GetAccountValuesDto> = {
            stepValues: { ...businessDetailsStep.stepValues },
        };

        return wizardStepValues;
    }

    throw new Error('There was an error retrieving your organisation details.');
};

const completeAccountDetails = (accounts: AccountInfo[], instance: IPublicClientApplication, accountContext: AccountContextState | null) => async (
    values: AccountDto,
    isDirty: boolean,
    _: FormikHelpers<AccountDto>,
    abortSignal?: AbortSignal,
) => {
    if (accounts.length > 0) {
        try {
            const client = new AccountsClient();
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            client.setAuthToken(tokenResult.accessToken);
            await client.completeAccountDetails(
                {
                    formStep: {
                        ...values,
                    },
                },
                abortSignal,
            );
            accountContext?.setCompleted();
            if (values.name !== undefined && accountContext?.details?.defaultOrganisationId === values.id) {
                const tradingName = values.businessOrTradingName ?? '';
                const branchName = values.branchOrLocationName ?? '';
                accountContext?.setOrganisationAndBranch(values.name, tradingName, branchName);
            }
            setDashboardNotification({
                message: 'Your organisation details have been successfully updated.',
                severity: NotificationSeverity.Success,
            });
        } catch (error) {
            const problemDetails = error as ValidationProblemDetails;
            if (problemDetails) {
                if (problemDetails.status === HttpStatusCode.PreconditionFailed) {
                    setDashboardNotification({
                        message: 'This branch/location name already exists. Please enter a unique branch/location name.',
                        severity: NotificationSeverity.Error,
                    });
                } else {
                    setDashboardNotification({
                        message: 'There was an error saving your organisation.',
                        severity: NotificationSeverity.Error,
                    });
                }
            }
        }
    } else {
        throw new Error('There was an error saving your organisation details.');
    }
};

const discardChanges: DiscardProps = {
    cancelButtonTitle: 'Cancel',
    discardButtonTitle: 'Cancel',
    showCancelButton: true,
    locationOnDiscard: '/',
};

const getRedirectionLocationOnError = (errorCode: number, _errorType: ErrorType) => {
    if (errorCode === 412) {
        return '/';
    }

    return undefined;
};

const updateAccountProps = (
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    statuses: FormStepStatusDto[],
    accountContext: AccountContextState | null,
    accountId: number,
)
: WizardStepProps<GetAccountValuesDto> => ({
    initialValues: {
        id: '',
        abn: '',
        branchOrLocationName: '',
        isDefaultOrganisation: undefined,
        businessWebsiteAddress: '',
        businessEmailAddress: '',
        contact: {},
        streetAddress: {},
        postalAddressSameAsStreetAddress: undefined,
        postalAddress: {},
        timestamp: '',
    },
    stepStatuses: statuses,
    loadStepValues: loadAccountDetails(accounts, instance, accountId),
    location: '/',
    title: 'Organisation',
    hidingFields: {
        isDefaultOrganisation: (x: GetAccountValuesDto) => x.isDefaultOrganisation === true,
        postalAddress: (x: GetAccountValuesDto) => x.postalAddressSameAsStreetAddress === true,
        contact: {
            titleOther: (x: GetAccountValuesDto) => x.contact?.title !== 'Other',
        },
    },
    validateHard: organisationSubmitValidation,
    onSaveAndNext: completeAccountDetails(accounts, instance, accountContext),
    bannerTitle: 'Manage organisation',
    discard: discardChanges,
    getRedirectionLocationOnError,
});

export default updateAccountProps;
