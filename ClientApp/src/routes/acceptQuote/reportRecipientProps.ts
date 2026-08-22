import type { FormikHelpers } from 'formik';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import { AcceptQuoteClient } from '../../api/web-api-client';
import type { FormStepStatusDto, ReportRecipientStep } from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import { ErrorType } from '../../components/forms/WizardForm/types';
import type { WizardFormStepValues, WizardStepProps } from '../../components/forms/WizardForm/types';
import { setDashboardNotification } from '../../storage/notification';
import { NotificationSeverity } from '../../storage/types';
import { HttpStatusCode } from '../../types';
import { reportRecipientSaveValidation, reportRecipientSubmitValidation } from './validation';
import type { AccountDetails } from '../../authentication/accountContext';
import type { DiscardProps } from '../../components/forms/FormikForm/types';
import { formatBannerTitle } from '../common/helperFunctions';
import AppLogger from '../../instrumentation/AppLogger';

const loadReportRecipient = (id: string, accounts: AccountInfo[], instance: IPublicClientApplication) => async (
    abortSignal?: AbortSignal,
) => {
    if (accounts.length > 0) {
        const client = new AcceptQuoteClient();
        const tokenResult = await instance.acquireTokenSilent({
            ...tokenRequest,
            account: accounts[0],
        });
        client.setAuthToken(tokenResult.accessToken);
        const reportRecipient = await client.getReportRecipient(id, abortSignal);
        const wizardStepValues: WizardFormStepValues<ReportRecipientStep> = {
            stepValues: { ...reportRecipient },
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
    values: ReportRecipientStep,
    isDirty: boolean,
    _: FormikHelpers<ReportRecipientStep>,
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
            await client.saveReportRecipient(
                id,
                {
                    applicationId: id,
                    formStep: values,
                    isCompletingStep: isComplete,
                },
                abortSignal,
            );
        } catch (e) {
            AppLogger.error('Failed to save payment report recipient', e as Error, { Id: id });
        }
    } else {
        throw new Error('No authenticated account available to save form.');
    }
};

const discardChanges = (id: string): DiscardProps => ({
    locationOnDiscard: '/',
    showCancelButton: true,
    cancelButtonTitle: 'Cancel',
    // New option for Wizard footer Cancel button
    locationOnCancel: `/quotation/${id}`,
});

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

const reportRecipientProps = (
    id: string,
    referenceId: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    accountDetails: AccountDetails,
    statuses: FormStepStatusDto[],
    bannerTitle: string,
)
: WizardStepProps<ReportRecipientStep> => ({
    initialValues: {
        businessStreetAddress: {},
        recipientMailingAddress: {},
    },
    stepStatuses: statuses,
    loadStepValues: loadReportRecipient(id, accounts, instance),
    location: '/report-recipient',
    title: 'Report recipient',
    hidingFields: {
        contact: {
            titleOther: (x: ReportRecipientStep) => x.contact?.title !== 'Other',
        },
        businessStreetAddress: (x: ReportRecipientStep) => x.reportAddressType !== 'Other',
    },
    validateHard: reportRecipientSubmitValidation,
    validateSoft: reportRecipientSaveValidation,
    onSaveAndExit: saveStep(id, accounts, instance, false),
    onSaveAndNext: saveStep(id, accounts, instance, true),
    bannerTitle,
    bannerRefTitle: `Quotation ID: ${id}`,
    bannerSubTitle: formatBannerTitle(accountDetails),
    getRedirectionLocationOnError: getRedirectionLocationOnError(id),
    discard: discardChanges(referenceId),
});

export default reportRecipientProps;
