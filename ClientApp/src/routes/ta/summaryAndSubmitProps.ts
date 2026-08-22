/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FormikHelpers } from 'formik';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import {
    CRMLookupTypes,
    type FormStepStatusDto,
    LookupClient,
    PatternApprovalRequiredValues,
    RequestForPatternApprovalClient,
    type RequestForPatternApprovalSummary,
    YesNo,
} from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import type { ErrorType, WizardFormStepValues, WizardStepProps } from '../../components/forms/WizardForm/types';
import type { AccountDetails } from '../../authentication/accountContext';
import AppLogger from '../../instrumentation/AppLogger';
import { formatBannerTitle } from '../common/helperFunctions';
import { DisplayRules } from './displayRules';
import { summaryAndSaveValidation, summaryAndSubmitValidation } from './validation';
import type { RequestForPatternApprovalSummaryDto } from './types';

const loadSummary = (id: string, accounts: AccountInfo[], instance: IPublicClientApplication) => async (
    abortSignal?: AbortSignal,
) => {
    if (accounts.length > 0) {
        try {
            const client = new RequestForPatternApprovalClient();
            const lookupClient = new LookupClient();
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            client.setAuthToken(tokenResult.accessToken);
            lookupClient.setAuthToken(tokenResult.accessToken);

            const [instCatResult, instTypeResult, summaryStep] = await Promise.all([
                lookupClient.getLookup(CRMLookupTypes.PAPortalCategory, abortSignal),
                lookupClient.getLookup(CRMLookupTypes.PAPortalInstrumentType, abortSignal),
                client.getSummary(id, abortSignal),
            ]);
            const { ...appAndInstrument } = summaryStep.applicationAndInstrument;

            const summaryStepDto: RequestForPatternApprovalSummaryDto = {
                ...summaryStep,
                applicationAndInstrument: {
                    ...appAndInstrument,
                    instrumentCategoryLookup: instCatResult,
                    instrumentTypeLookup: instTypeResult,
                },
            };
            // const summaryStep = await client.getSummary(id, abortSignal);
            const wizardStepValues: WizardFormStepValues<RequestForPatternApprovalSummaryDto> = {
                stepValues: { ...summaryStepDto },
            };

            return wizardStepValues;
        } catch (error) {
            AppLogger.error('Failed to load PA summary', error as Error, { Id: id });
            throw Error(`Failed to load PA summary. Id: ${id}`);
        }
    } else {
        AppLogger.verbose('There are no accounts available to load PA summary', { Id: id, Accounts: accounts });
        throw Error(`There are no accounts available to load PA summary. Id: ${id}`);
    }
};

const getRedirectionLocationOnError = (_id: string) => (
    _errorCode: number,
    _errorType: ErrorType,
) => '/not-found';

const submitForm = (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
) => async (
    values: RequestForPatternApprovalSummaryDto,
    isDirty: boolean,
    _: FormikHelpers<RequestForPatternApprovalSummaryDto>,
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

            const valuesToSave: RequestForPatternApprovalSummary = { ...values };

            await client.submit(
                id,
                {
                    applicationId: id,
                    formStep: valuesToSave,
                    isCompletingStep: true,
                },
                abortSignal,
            );
        } catch (error) {
            AppLogger.error('Failed to submit PA summary', error as Error, { Id: id });
            throw Error(`Failed to submit PA summary. Id: ${id}`);
        }
    } else {
        AppLogger.verbose('There are no accounts available to submit PA summary', { Id: id, Accounts: accounts });
        throw Error(`There are no accounts available to submit PA summary. Id: ${id}`);
    }
};

const summaryAndSubmitProps = (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    accountDetails: AccountDetails,
    statuses: FormStepStatusDto[],
    bannerTitle: string,
)
: WizardStepProps<RequestForPatternApprovalSummaryDto> => ({
    initialValues: {
    },
    stepStatuses: statuses,
    loadStepValues: loadSummary(id, accounts, instance),
    location: '/summary',
    title: 'Summary and submit',
    hidingFields: {
        organisationAndContact: {
            branchOrLocationName: (x: any) => !x.organisationAndContact?.branchOrLocationName,
            isManufacturerHide: (x: any) => x.organisationAndContact?.isManufacturer === YesNo.Yes || x.organisationAndContact?.isManufacturer === undefined,
            principalInvoiceContactHide: (x: any) => x.organisationAndContact?.isPrincipalInvoiceContact === YesNo.Yes || x.organisationAndContact?.isPrincipalInvoiceContact === undefined,
            isCurrentOrganisationHide: (x: any) => x.organisationAndContact?.isManufacturer === YesNo.No,
            contact: {
                titleOther: (x: any) => x.organisationAndContact?.contact?.title !== 'Other',
            },
            invoiceContact: {
                titleOther: (x: any) => x.organisationAndContact?.invoiceContact?.title !== 'Other',
            },
        },
        applicationAndInstrument: {
            isApplNewHide: (x: any) => x.applicationAndInstrument?.patternApprovalType !== PatternApprovalRequiredValues.NewCertificate || x.applicationAndInstrument?.patternApprovalType === undefined,
            isApplVariationHide: (x: any) => x.applicationAndInstrument?.patternApprovalType !== PatternApprovalRequiredValues.Variation || x.applicationAndInstrument?.patternApprovalType === undefined,
            isApplOtherHide: (x: any) => x.applicationAndInstrument?.patternApprovalType !== PatternApprovalRequiredValues.OtherApproval || x.applicationAndInstrument?.patternApprovalType === undefined,
            isApplOIMLHide: (x: any) => DisplayRules.isOIMLHidden(x),
        },
    },
    validateHard: summaryAndSubmitValidation,
    validateSoft: summaryAndSaveValidation,
    onSaveAndNext: submitForm(id, accounts, instance),
    bannerTitle,
    bannerRefTitle: `Ref ID: ${id}`,
    bannerSubTitle: formatBannerTitle(accountDetails),
    getRedirectionLocationOnError: getRedirectionLocationOnError(id),
    isSummaryPage: true,
    disableLinkedError: false,
    suppressErrorSummaryPath: true,
});

export default summaryAndSubmitProps;
