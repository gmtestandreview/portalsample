import type { FormikHelpers } from 'formik';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import {
    type FormStepStatusDto,
    RequestForPatternApprovalClient,
    type SupportingDocumentsStep,
} from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import type { ErrorType, WizardFormStepValues, WizardStepProps } from '../../components/forms/WizardForm/types';
import type { AccountDetails } from '../../authentication/accountContext';
import AppLogger from '../../instrumentation/AppLogger';
import { formatBannerTitle } from '../common/helperFunctions';
import { supportingDocsSaveValidation, supportingDocsSubmitValidation } from './validation';
import type { DiscardProps } from '../../components/forms/FormikForm/types';

const loadSummary = (id: string, accounts: AccountInfo[], instance: IPublicClientApplication) => async (
    abortSignal?: AbortSignal,
) => {
    if (accounts.length > 0) {
        try {
            const client = new RequestForPatternApprovalClient();
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            client.setAuthToken(tokenResult.accessToken);
            const summaryStep = await client.getSupportingDocuments(id, abortSignal);
            const wizardStepValues: WizardFormStepValues<SupportingDocumentsStep> = {
                stepValues: { ...summaryStep },
            };

            return wizardStepValues;
        } catch (error) {
            AppLogger.error('Failed to load PA supporting documents', error as Error, { Id: id });
            throw Error(`Failed to load PA supporting documents. Id: ${id}`);
        }
    } else {
        AppLogger.verbose('There are no accounts available to load PA supporting documents', { Id: id, Accounts: accounts });
        throw Error(`There are no accounts available to load PA supporting documents. Id: ${id}`);
    }
};

const saveStep = (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    isComplete: boolean,
) => async (
    values: SupportingDocumentsStep,
    isDirty: boolean,
    _: FormikHelpers<SupportingDocumentsStep>,
    abortSignal?: AbortSignal,
) => {
    if (accounts.length > 0) {
        try {
            const client = new RequestForPatternApprovalClient();
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            client.setAuthToken(tokenResult.accessToken);

            // Save for later
            let formStepValues: SupportingDocumentsStep | undefined;
            if (values.form!.documents) {
                const updatedValues: SupportingDocumentsStep = {
                    ...values,
                };
                formStepValues = updatedValues;
            } else {
                formStepValues = values;
            }

            await client.saveSupportingDocuments(
                id,
                {
                    applicationId: id,
                    formStep: formStepValues,
                    isCompletingStep: isComplete,
                },
                abortSignal,
            );
        } catch (error) {
            AppLogger.error('Failed to save PA supporting documents', error as Error, { Id: id });
            throw Error(`Failed to save PA supporting documents. Id: ${id}`);
        }
    } else {
        AppLogger.verbose('There are no accounts available to save PA supporting documents', { Id: id, Accounts: accounts });
        throw Error(`There are no accounts available to save PA supporting documents. Id: ${id}`);
    }
};

const getRedirectionLocationOnError = (_id: string) => (
    _errorCode: number,
    _errorType: ErrorType,
) => '/not-found';

const discardChanges: DiscardProps = {
    // disableDiscardButton: true, // This is for possible future use
    locationOnDiscard: '/',
    showCancelButton: false,
};

const supportingDocumentsProps = (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    accountDetails: AccountDetails,
    statuses: FormStepStatusDto[],
    bannerTitle: string,
)
: WizardStepProps<SupportingDocumentsStep> => ({
    initialValues: {
    },
    stepStatuses: statuses,
    loadStepValues: loadSummary(id, accounts, instance),
    location: '/supporting-documents',
    title: 'Supporting documents',
    hidingFields: {
    },
    onSaveAndExit: saveStep(id, accounts, instance, false),
    onSaveAndNext: saveStep(id, accounts, instance, true),
    validateHard: supportingDocsSubmitValidation,
    validateSoft: supportingDocsSaveValidation,
    bannerTitle,
    bannerRefTitle: `Ref ID: ${id}`,
    bannerSubTitle: formatBannerTitle(accountDetails),
    discard: discardChanges,
    getRedirectionLocationOnError: getRedirectionLocationOnError(id),
    isSummaryPage: true,
    suppressErrorSummary: true,
    suppressErrorSummaryPath: true,
});

export default supportingDocumentsProps;
