/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FormikHelpers } from 'formik';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import { RequestForQuoteClient, YesNo } from '../../api/web-api-client';
import type { InstrumentAndRequestStep, FormStepStatusDto } from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import type { WizardFormStepValues, WizardStepProps } from '../../components/forms/WizardForm/types';
import { discardChanges } from '../common/constants';
import { instrumentAndRequestSaveValidation, instrumentAndRequestSubmitValidation } from './validation';
import type { AccountDetails } from '../../authentication/accountContext';
import { formatBannerTitle } from '../common/helperFunctions';
import { formatDateStringToUTC } from '../../utils';

const loadInstrumentAndRequest = (id: string, accounts: AccountInfo[], instance: IPublicClientApplication) => async (
    abortSignal?: AbortSignal,
) => {
    if (accounts.length > 0) {
        const client = new RequestForQuoteClient();
        const tokenResult = await instance.acquireTokenSilent({
            ...tokenRequest,
            account: accounts[0],
        });
        client.setAuthToken(tokenResult.accessToken);
        const instrumentAndRequest = await client.getInstrumentAndRequest(id, abortSignal);
        const wizardStepValues: WizardFormStepValues<InstrumentAndRequestStep> = {
            stepValues: { ...instrumentAndRequest },
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
    values: InstrumentAndRequestStep,
    isDirty: boolean,
    _: FormikHelpers<InstrumentAndRequestStep>,
    abortSignal?: AbortSignal,
) => {
    if (accounts.length > 0) {
        const client = new RequestForQuoteClient();
        const tokenResult = await instance.acquireTokenSilent({
            ...tokenRequest,
            account: accounts[0],
        });
        client.setAuthToken(tokenResult.accessToken);

        let formStepValues: InstrumentAndRequestStep | undefined;
        if (values.preferredInstrumentOrArtefactAvailabilityDate) {
            const updatedValues = {
                ...values,
                preferredInstrumentOrArtefactAvailabilityDate: formatDateStringToUTC(values.preferredInstrumentOrArtefactAvailabilityDate),
            };
            formStepValues = updatedValues;
        } else {
            formStepValues = values;
        }

        await client.saveInstrumentAndRequest(
            id,
            {
                applicationId: id,
                formStep: formStepValues,
                isCompletingStep: isComplete,
            },
            abortSignal,
        );
    } else {
        throw new Error('error');
    }
};

const instrumentAndRequestProps = (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    accountDetails: AccountDetails,
    statuses: FormStepStatusDto[],
    bannerTitle: string,
)
: WizardStepProps<InstrumentAndRequestStep> => ({
    initialValues: {
    },
    stepStatuses: statuses,
    loadStepValues: loadInstrumentAndRequest(id, accounts, instance),
    location: '/instrument-and-request',
    title: 'Instrument and request',
    hidingFields: {
        serialNumber: (x: InstrumentAndRequestStep) => x.hasSerialNumber !== YesNo.Yes,
    },
    validateHard: instrumentAndRequestSubmitValidation,
    validateSoft: instrumentAndRequestSaveValidation,
    onSaveAndExit: saveStep(id, accounts, instance, false),
    onSaveAndNext: saveStep(id, accounts, instance, true),
    bannerTitle,
    bannerRefTitle: `Ref ID: ${id}`,
    bannerSubTitle: formatBannerTitle(accountDetails),
    // getRedirectionLocationOnError: getRedirectionLocationOnError(id),
    discard: discardChanges,
});

export default instrumentAndRequestProps;
