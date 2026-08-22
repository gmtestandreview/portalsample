import type { FormikHelpers } from 'formik';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import { AcceptQuoteClient } from '../../api/web-api-client';
import type { DeliveryAndReturnStep, FormStepStatusDto } from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import { ErrorType } from '../../components/forms/WizardForm/types';
import type { WizardFormStepValues, WizardStepProps } from '../../components/forms/WizardForm/types';
import { setDashboardNotification } from '../../storage/notification';
import { NotificationSeverity } from '../../storage/types';
import { discardChanges } from '../common/constants';
import { HttpStatusCode } from '../../types';
import type { AccountDetails } from '../../authentication/accountContext';
import { deliveryAndReturnSaveValidation, deliveryAndReturnSubmitValidation } from './validation';
import { formatBannerTitle } from '../common/helperFunctions';

const loadDeliveryAndReturn = (id: string, accounts: AccountInfo[], instance: IPublicClientApplication) => async (
    abortSignal?: AbortSignal,
) => {
    if (accounts.length > 0) {
        const client = new AcceptQuoteClient();
        const tokenResult = await instance.acquireTokenSilent({
            ...tokenRequest,
            account: accounts[0],
        });
        client.setAuthToken(tokenResult.accessToken);
        const deliveryAndReturn = await client.getDeliveryAndReturn(id, abortSignal);
        const wizardStepValues: WizardFormStepValues<DeliveryAndReturnStep> = {
            stepValues: { ...deliveryAndReturn },
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
    values: DeliveryAndReturnStep,
    isDirty: boolean,
    _: FormikHelpers<DeliveryAndReturnStep>,
    abortSignal?: AbortSignal,
) => {
    if (accounts.length > 0) {
        const client = new AcceptQuoteClient();
        const tokenResult = await instance.acquireTokenSilent({
            ...tokenRequest,
            account: accounts[0],
        });
        client.setAuthToken(tokenResult.accessToken);
        await client.saveDeliveryAndReturn(
            id,
            {
                applicationId: id,
                formStep: values,
                isCompletingStep: isComplete,
            },
            abortSignal,
        );
    } else {
        throw new Error('No authenticated account available to save form.');
    }
};

const getRedirectionLocationOnError = (id: string) => (errorCode: number, errorType: ErrorType) => {
    if (errorCode === HttpStatusCode.PreconditionFailed && errorType === ErrorType.Load) {
        return `/accept-quote/${id}/view-summary`;
    }

    if (errorCode === HttpStatusCode.NotFound && errorType === ErrorType.Update) {
        setDashboardNotification({
            message: 'Another person has deleted this request. Your changes have not been saved.',
            severity: NotificationSeverity.Error,
        });
        return '/';
    }

    return undefined;
};

const deliveryAndReturnProps = (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    accountDetails: AccountDetails,
    statuses: FormStepStatusDto[],
    bannerTitle: string,
)
: WizardStepProps<DeliveryAndReturnStep> => ({
    initialValues: {
        returnAddress: {},
    },
    stepStatuses: statuses,
    loadStepValues: loadDeliveryAndReturn(id, accounts, instance),
    location: '/delivery-and-return',
    title: 'Instrument/artefact delivery and return',
    hidingFields: {
        contactHide: (x: DeliveryAndReturnStep) => x.returnContactType === 'SamePerson',
        contact: {
            titleOther: (x: DeliveryAndReturnStep) => x.contact?.title !== 'Other',
        },
        returnAddress: (x: DeliveryAndReturnStep) => x.returnAddressType !== 'Other',
        carrierHide: (x: DeliveryAndReturnStep) => x.returnMethod !== 'ClientWillProvide',
    },
    validateHard: deliveryAndReturnSubmitValidation,
    validateSoft: deliveryAndReturnSaveValidation,
    onSaveAndExit: saveStep(id, accounts, instance, false),
    onSaveAndNext: saveStep(id, accounts, instance, true),
    bannerTitle,
    bannerRefTitle: `Quotation ID: ${id}`,
    bannerSubTitle: formatBannerTitle(accountDetails),
    getRedirectionLocationOnError: getRedirectionLocationOnError(id),
    discard: discardChanges,
});

export default deliveryAndReturnProps;
