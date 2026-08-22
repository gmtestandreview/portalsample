/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FormikHelpers } from 'formik';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import { AcceptQuoteClient } from '../../api/web-api-client';
import type { FormStepStatusDto, SummaryAndAcceptStep } from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import { ErrorType } from '../../components/forms/WizardForm/types';
import type { WizardFormStepValues, WizardStepProps } from '../../components/forms/WizardForm/types';
import { setDashboardNotification } from '../../storage/notification';
import { NotificationSeverity } from '../../storage/types';
import { HttpStatusCode } from '../../types';
import type { AccountDetails } from '../../authentication/accountContext';
import { discardChanges } from '../common/constants';
import { summaryAndAcceptSaveValidation, summaryAndAcceptSubmitValidation } from './validation';
import { formatBannerTitle } from '../common/helperFunctions';
import SessionStorageCache from '../../storage/sessionStorageCache';

const loadSummary = (id: string, accounts: AccountInfo[], instance: IPublicClientApplication) => async (
    abortSignal?: AbortSignal,
) => {
    if (accounts.length > 0) {
        const client = new AcceptQuoteClient();
        const tokenResult = await instance.acquireTokenSilent({
            ...tokenRequest,
            account: accounts[0],
        });
        client.setAuthToken(tokenResult.accessToken);
        const summaryStep = await client.getSummaryAndAccept(id, abortSignal);
        const wizardStepValues: WizardFormStepValues<SummaryAndAcceptStep> = {
            stepValues: { ...summaryStep },
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
    values: SummaryAndAcceptStep,
    isDirty: boolean,
    _: FormikHelpers<SummaryAndAcceptStep>,
    abortSignal?: AbortSignal,
) => {
    if (accounts.length > 0) {
        const client = new AcceptQuoteClient();
        const tokenResult = await instance.acquireTokenSilent({
            ...tokenRequest,
            account: accounts[0],
        });
        client.setAuthToken(tokenResult.accessToken);
        await client.saveSummaryAndAccept(
            id,
            {
                applicationId: id,
                formStep: values,
                isCompletingStep: isComplete,
            },
            abortSignal,
        );
        if (isComplete) {
            SessionStorageCache().setItem(values.acceptQuotePreInfo!.quoteRequestIdNum!, 'accepted-quote-id');
        }
    } else {
        throw new Error('No authenticated account available to save form.');
    }
};

const getRedirectionLocationOnError = (id: string) => (errorCode: number, errorType: ErrorType) => {
    if (errorCode === HttpStatusCode.PreconditionFailed && errorType === ErrorType.Load) {
        return `/request-for-quote/${id}/view-summary`;
    }

    if (errorCode === HttpStatusCode.NotFound && errorType === ErrorType.Update) {
        setDashboardNotification({
            message: 'The request could not be submitted as it has already been deleted by another person.',
            severity: NotificationSeverity.Error,
        });
        return '/';
    }

    return undefined;
};

const summaryAndAcceptProps = (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    accountDetails: AccountDetails,
    statuses: FormStepStatusDto[],
    bannerTitle: string,
)
: WizardStepProps<SummaryAndAcceptStep> => ({
    initialValues: {
    },
    stepStatuses: statuses,
    loadStepValues: loadSummary(id, accounts, instance),
    location: '/summary-and-accept',
    title: 'Summary and accept',
    hidingFields: {
        associatedDispute: (x: SummaryAndAcceptStep) => x.associatedDisputes === 'No',
        reportRecipient: {
            rfqHide: (x: SummaryAndAcceptStep) => x.reportRecipient?.organisationDifferent !== 'No',
            organisationNameHide: (x: SummaryAndAcceptStep) => x.reportRecipient?.organisationDifferent === 'No',
            contact: {
                titleOther: (x: SummaryAndAcceptStep) => x.reportRecipient?.contact?.title !== 'Other',
            },
            recipientMailingAddress: (x: SummaryAndAcceptStep) => x.reportRecipient?.isRecipientMailingAddressSame === true,
        },
        deliveryAndReturn: {
            rfqHide: (x: SummaryAndAcceptStep) => x.deliveryAndReturn?.returnContactType !== 'SamePerson',
            contactHide: (x: SummaryAndAcceptStep) => x.deliveryAndReturn?.returnContactType === 'SamePerson',
            contact: {
                titleOther: (x: SummaryAndAcceptStep) => x.deliveryAndReturn?.contact?.title !== 'Other',
            },
        },
        paymentDetails: {
            rfqHide: (x: SummaryAndAcceptStep) => x.paymentDetails?.invoiceSentTo !== 'SamePerson',
            contactHide: (x: SummaryAndAcceptStep) => x.paymentDetails?.invoiceSentTo === 'SamePerson',
            contact: {
                titleOther: (x: SummaryAndAcceptStep) => x.paymentDetails?.contact?.title !== 'Other',
            },
        },
        requestForQuote: {
            contact: {
                titleOther: (x: SummaryAndAcceptStep) => x.requestForQuote?.contact?.title !== 'Other',
            },
        },
    },
    validateHard: summaryAndAcceptSubmitValidation,
    validateSoft: summaryAndAcceptSaveValidation,
    onSaveAndExit: saveStep(id, accounts, instance, false),
    onSaveAndNext: saveStep(id, accounts, instance, true),
    bannerTitle,
    bannerRefTitle: `Quotation ID: ${id}`,
    bannerSubTitle: formatBannerTitle(accountDetails),
    getRedirectionLocationOnError: getRedirectionLocationOnError(id),
    isSummaryPage: false,
    discard: discardChanges,
});

export default summaryAndAcceptProps;
