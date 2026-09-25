 
import type { FormikHelpers } from 'formik';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import { RequestForQuoteClient, YesNo } from '../../api/web-api-client';
import type { FormStepStatusDto, OrganisationAndContact } from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import type { ErrorType, WizardFormStepValues, WizardStepProps } from '../../components/forms/WizardForm/types';
import { discardChanges } from '../common/constants';
import { organisationAndContactSaveValidation, organisationAndContactSubmitValidation } from './validation';
import type { AccountDetails } from '../../authentication/accountContext';
import { formatBannerTitle } from '../common/helperFunctions';

const loadOrganisationAndContact = (id: string, accounts: AccountInfo[], instance: IPublicClientApplication) => async (
    abortSignal?: AbortSignal,
) => {
    if (accounts.length > 0) {
        const client = new RequestForQuoteClient();
        const tokenResult = await instance.acquireTokenSilent({
            ...tokenRequest,
            account: accounts[0],
        });
        client.setAuthToken(tokenResult.accessToken);
        const organisationAndContact = await client.getOrganisationAndContact(id, abortSignal);
        const wizardStepValues: WizardFormStepValues<OrganisationAndContact> = {
            stepValues: { ...organisationAndContact },
        };

        return wizardStepValues;
    }

    throw new Error('There was an error retrieving your details.');
};

const saveStep = (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    isComplete: boolean,
) => async (
    values: OrganisationAndContact,
    isDirty: boolean,
    _: FormikHelpers<OrganisationAndContact>,
    abortSignal?: AbortSignal,
) => {
    if (accounts.length > 0) {
        const client = new RequestForQuoteClient();
        const tokenResult = await instance.acquireTokenSilent({
            ...tokenRequest,
            account: accounts[0],
        });
        client.setAuthToken(tokenResult.accessToken);
        await client.saveOrganisationAndContact(
            id,
            {
                applicationId: id,
                formStep: values,
                isCompletingStep: isComplete,
            },
            abortSignal,
        );
    } else {
        throw new Error('error');
    }
};

const getRedirectionLocationOnError = (_id: string) => (_errorCode: number, _errorType: ErrorType) => '/not-found';

const organisationAndContactProps = (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    accountDetails: AccountDetails,
    statuses: FormStepStatusDto[],
    bannerTitle: string,
)
: WizardStepProps<OrganisationAndContact> => ({
    initialValues: {
    },
    stepStatuses: statuses,
    loadStepValues: loadOrganisationAndContact(id, accounts, instance),
    location: '/organisation-and-contact',
    title: 'Organisation and contact',
    hidingFields: {
        businessOrTradingName: (_x: OrganisationAndContact) => false,
        branchOrLocationName: (_x: OrganisationAndContact) => false,
        principalContactHide: (x: OrganisationAndContact) => x.isPrincipalContact === YesNo.Yes,
        contact: {
            titleOther: (x: OrganisationAndContact) => x.contact?.title !== 'Other',
        },
    },
    validateHard: organisationAndContactSubmitValidation,
    validateSoft: organisationAndContactSaveValidation,
    onSaveAndExit: saveStep(id, accounts, instance, false),
    onSaveAndNext: saveStep(id, accounts, instance, true),
    bannerTitle,
    bannerRefTitle: `Ref ID: ${id}`,
    bannerSubTitle: formatBannerTitle(accountDetails),
    getRedirectionLocationOnError: getRedirectionLocationOnError(id),
    discard: discardChanges,
});

export default organisationAndContactProps;
