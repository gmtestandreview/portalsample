import type { FormikHelpers } from 'formik';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import { ContactClient } from '../../api/web-api-client';
import type { ContactFormStep, ValidationProblemDetails } from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import { HttpStatusCode } from '../../types';
import { setDashboardNotification } from '../../storage/notification';
import { NotificationSeverity } from '../../storage/types';
import type { AccountContextState } from '../../authentication/accountContext';

const getAccessToken = async (
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
) => {
    const tokenResult = await instance.acquireTokenSilent({
        ...tokenRequest,
        account: accounts[0],
    });

    return tokenResult.accessToken;
};

export const loadContactDetails = (
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
) => async (abortSignal?: AbortSignal) => {
    if (accounts.length === 0) {
        throw new Error('There was an error retrieving your contact details.');
    }

    const client = new ContactClient();
    client.setAuthToken(await getAccessToken(accounts, instance));

    return {
        stepValues: {
            ...await client.getUserContact(abortSignal),
        },
    };
};

const handleContactSaveError = (error: unknown) => {
    const problemDetails = error as ValidationProblemDetails | null;

    if (problemDetails?.status === HttpStatusCode.PreconditionFailed) {
        setDashboardNotification({
            message: 'This contact already exists. Please review the details and try again.',
            severity: NotificationSeverity.Error,
        });
        return;
    }

    setDashboardNotification({
        message: 'There was an error saving your contact details.',
        severity: NotificationSeverity.Error,
    });
};

export const completeContactDetails = (
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    accountContext: AccountContextState | null,
) => async (
    values: ContactFormStep,
    _isDirty: boolean,
    _: FormikHelpers<ContactFormStep>,
    abortSignal?: AbortSignal,
) => {
    if (accounts.length === 0) {
        throw new Error('There was an error saving your contact details.');
    }

    try {
        const client = new ContactClient();
        client.setAuthToken(await getAccessToken(accounts, instance));
        await client.saveContactDetails(
            {
                formStep: {
                    ...values,
                },
            },
            abortSignal,
        );
        accountContext?.setContactCompleted();
        setDashboardNotification({
            message: 'Your contact details have been successfully saved.',
            severity: NotificationSeverity.Success,
        });
    } catch (error) {
        handleContactSaveError(error);
    }
};
