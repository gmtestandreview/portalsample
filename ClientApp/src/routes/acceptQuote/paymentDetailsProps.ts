import type { FormikHelpers } from 'formik';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import { AcceptQuoteClient } from '../../api/web-api-client';
import type { FormStepStatusDto, PaymentDetailsStep } from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import { ErrorType } from '../../components/forms/WizardForm/types';
import type { WizardFormStepValues, WizardStepProps } from '../../components/forms/WizardForm/types';
import { setDashboardNotification } from '../../storage/notification';
import { NotificationSeverity } from '../../storage/types';
import { discardChanges } from '../common/constants';
import { HttpStatusCode } from '../../types';
import type { AccountDetails } from '../../authentication/accountContext';
import { paymentDetailsSaveValidation, paymentDetailsSubmitValidation } from './validation';
import { formatBannerTitle } from '../common/helperFunctions';
import AppLogger from '../../instrumentation/AppLogger';

const loadPaymentDetails = (id: string, accounts: AccountInfo[], instance: IPublicClientApplication) => async (
    abortSignal?: AbortSignal,
) => {
    try {
        if (accounts.length > 0) {
            const client = new AcceptQuoteClient();
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            client.setAuthToken(tokenResult.accessToken);
            const paymentDetails = await client.getPaymentDetails(id, abortSignal);
            const wizardStepValues: WizardFormStepValues<PaymentDetailsStep> = {
                stepValues: { ...paymentDetails },
            };

            return wizardStepValues;
        }
    } catch (e) {
        AppLogger.error('Failed to load payment details', e as Error, { Id: id });
    }

    throw new Error('There was an error retrieving your details.');
};

const saveStep = (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    isComplete: boolean,
) => async (
    values: PaymentDetailsStep,
    isDirty: boolean,
    _: FormikHelpers<PaymentDetailsStep>,
    abortSignal?: AbortSignal,
) => {
    if (accounts.length > 0) {
        try {
            const client = new AcceptQuoteClient();
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            client.setAuthToken(tokenResult.accessToken);
            await client.savePaymentDetails(
                id,
                {
                    applicationId: id,
                    formStep: values,
                    isCompletingStep: isComplete,
                },
                abortSignal,
            );
        } catch (e) {
            AppLogger.error('Failed to save payment details:', e as Error, { ApplicationId: id });
        }
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

const paymentDetailsProps = (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    accountDetails: AccountDetails,
    statuses: FormStepStatusDto[],
    bannerTitle: string,
)
: WizardStepProps<PaymentDetailsStep> => ({
    initialValues: {
    },
    stepStatuses: statuses,
    loadStepValues: loadPaymentDetails(id, accounts, instance),
    location: '/payment-details',
    title: 'Payment details',
    hidingFields: {
        contactHide: (x: PaymentDetailsStep) => x.invoiceSentTo === 'SamePerson',
        contact: {
            titleOther: (x: PaymentDetailsStep) => x.contact?.title !== 'Other',
        },
    },
    validateHard: paymentDetailsSubmitValidation,
    validateSoft: paymentDetailsSaveValidation,
    onSaveAndExit: saveStep(id, accounts, instance, false),
    onSaveAndNext: saveStep(id, accounts, instance, true),
    bannerTitle,
    bannerRefTitle: `Quotation ID: ${id}`,
    bannerSubTitle: formatBannerTitle(accountDetails),
    getRedirectionLocationOnError: getRedirectionLocationOnError(id),
    discard: discardChanges,
});

export default paymentDetailsProps;
