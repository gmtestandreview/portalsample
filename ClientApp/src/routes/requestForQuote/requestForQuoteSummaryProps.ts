 
import type { FormikHelpers } from 'formik';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import { RequestForQuoteClient } from '../../api/web-api-client';
import type { FormStepStatusDto, RequestForQuoteSummary } from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import type { ErrorType, WizardFormStepValues, WizardStepProps } from '../../components/forms/WizardForm/types';
import type { AccountDetails } from '../../authentication/accountContext';
import AppLogger from '../../instrumentation/AppLogger';
import { formatBannerTitle } from '../common/helperFunctions';

const loadSummary = (id: string, accounts: AccountInfo[], instance: IPublicClientApplication) => async (
    abortSignal?: AbortSignal,
) => {
    try {
        if (accounts.length > 0) {
            const client = new RequestForQuoteClient();
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            client.setAuthToken(tokenResult.accessToken);
            const summaryStep = await client.getSummary(id, abortSignal);
            const wizardStepValues: WizardFormStepValues<RequestForQuoteSummary> = {
                stepValues: { ...summaryStep },
            };
            return wizardStepValues;
        }
    } catch (error) {
        AppLogger.error('Failed to load summary', error as Error, { Id: id });
    }

    throw new Error('There was an error retrieving your details.');
};

const getRedirectionLocationOnError = (_id: string) => (_errorCode: number, _errorType: ErrorType) => '/not-found';

const submitForm = (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    _isComplete: boolean,
) => async (
    values: RequestForQuoteSummary,
    isDirty: boolean,
    _: FormikHelpers<RequestForQuoteSummary>,
    abortSignal?: AbortSignal,
) => {
    if (accounts.length > 0) {
        try {
            const client = new RequestForQuoteClient();
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            client.setAuthToken(tokenResult.accessToken);
            await client.submit(
                id,
                {
                    applicationId: id,
                    formStep: values,
                    isCompletingStep: true,
                },
                abortSignal,
            );
        } catch (error) {
            AppLogger.error('failoed to submit form', error as Error, { Id: id });
        }
    } else {
        throw new Error('error');
    }
};

const requestForQuoteSummaryProps = (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    accountDetails: AccountDetails,
    statuses: FormStepStatusDto[],
    bannerTitle: string,
)
: WizardStepProps<RequestForQuoteSummary> => ({
    initialValues: {
    },
    stepStatuses: statuses,
    loadStepValues: loadSummary(id, accounts, instance),
    location: '/summary',
    title: 'Summary and submit',
    hidingFields: {
        organisationAndContact: {
            branchOrLocationName: (x: RequestForQuoteSummary) => !x.organisationAndContact?.branchOrLocationName,
            principalContactHide: (_x: RequestForQuoteSummary) => false,
            contact: {
                titleOther: (x: RequestForQuoteSummary) => x.organisationAndContact?.contact?.title !== 'Other',
            },
        },
    },
    onSaveAndNext: submitForm(id, accounts, instance, false),
    bannerTitle,
    bannerRefTitle: `Ref ID: ${id}`,
    bannerSubTitle: formatBannerTitle(accountDetails),
    getRedirectionLocationOnError: getRedirectionLocationOnError(id),
    isSummaryPage: true,
});

export default requestForQuoteSummaryProps;
