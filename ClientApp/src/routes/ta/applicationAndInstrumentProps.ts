import type { FormikHelpers } from 'formik';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import {
    type FormStepStatusDto,
    RequestForPatternApprovalClient,
    type ApplicationAndInstrumentStepDto,
    CRMLookupTypes,
    LookupClient,
} from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import type { WizardFormStepValues, WizardStepProps } from '../../components/forms/WizardForm/types';
import { applicationAndInstrumentSaveValidation, applicationAndInstrumentSubmitValidation } from './validation';
import type { AccountDetails } from '../../authentication/accountContext';
import { DisplayRules } from './displayRules';
import { discardChanges } from '../common/constants';
import { formatBannerTitle } from '../common/helperFunctions';
import AppLogger from '../../instrumentation/AppLogger';

const loadApplicationAndInstrument = (id: string, accounts: AccountInfo[], instance: IPublicClientApplication) => async (
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

            const [instCatResult, instTypeResult, infoPanelresult, certNumResult, appAndInstrument] = await Promise.all([
                lookupClient.getLookup(CRMLookupTypes.PAPortalCategory, abortSignal),
                lookupClient.getLookup(CRMLookupTypes.PAPortalInstrumentType, abortSignal),
                lookupClient.getAllInfoPanelContent(abortSignal),
                lookupClient.getNmiApplication(abortSignal),
                client.getApplicationAndInstrument(id, abortSignal),
            ]);
            const appAndInstrumentDto: ApplicationAndInstrumentStepDto = {
                ...appAndInstrument,
                instrumentCategoryLookup: instCatResult,
                instrumentTypeLookup: instTypeResult,
                instrumentTypeContent: infoPanelresult,
                certNameOptions: certNumResult,
            };

            const wizardStepValues: WizardFormStepValues<ApplicationAndInstrumentStepDto> = {
                stepValues: { ...appAndInstrumentDto },
            };
            return wizardStepValues;
        } catch (error) {
            AppLogger.error('Failed to load PA application and instrument details', error as Error, { Id: id });
            throw Error(`Failed to load PA application and instrument details. Id: ${id}`);
        }
    } else {
        AppLogger.verbose('There are no accounts available to load PA application and instrument details', { Id: id, Accounts: accounts });
        throw Error(`There are no accounts available to load PA application and instrument details. Id: ${id}`);
    }
};

const saveStep = (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    isComplete: boolean,
) => async (
    values: ApplicationAndInstrumentStepDto,
    isDirty: boolean,
    _: FormikHelpers<ApplicationAndInstrumentStepDto>,
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

            const valuesToSave = { ...values };

            valuesToSave.certNameOptions = undefined;
            valuesToSave.instrumentCategoryLookup = undefined;
            valuesToSave.instrumentTypeLookup = undefined;
            valuesToSave.instrumentTypeContent = undefined;

            await client.saveApplicationAndInstrument(
                id,
                {
                    applicationId: id,
                    formStep: valuesToSave,
                    isCompletingStep: isComplete,
                },
                abortSignal,
            );
        } catch (error) {
            AppLogger.error('Failed to save PA application and instrument details', error as Error, { Id: id });
            throw Error(`Failed to save PA application and instrument details. Id: ${id}`);
        }
    } else {
        AppLogger.verbose('There are no accounts available to save PA application and instrument details', { Id: id, Accounts: accounts });
        throw Error(`There are no accounts available to save PA application and instrument details. Id: ${id}`);
    }
};

const applicationAndInstrumentProps = (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    accountDetails: AccountDetails,
    statuses: FormStepStatusDto[],
    bannerTitle: string,
)
: WizardStepProps<ApplicationAndInstrumentStepDto> => ({
    initialValues: {
    },
    stepStatuses: statuses,
    loadStepValues: loadApplicationAndInstrument(id, accounts, instance),
    location: '/application-details',
    title: 'Application details',
    hidingFields: {
        isApplNewHide: (x: any) => DisplayRules.isNewCertificateHiddenP(x),
        isApplNewInstrumentHide: (x: any) => DisplayRules.isApplNewInstrumentHiddenP(x),
        isApplVariationHide: (x: any) => DisplayRules.isVariationHiddenP(x),
        isApplOtherHide: (x: any) => DisplayRules.isApplOtherHiddenP(x),
        isApplOIMLHide: (x: any) => DisplayRules.isOIMLHiddenP(x),
    },
    validateHard: applicationAndInstrumentSubmitValidation,
    validateSoft: applicationAndInstrumentSaveValidation,
    onSaveAndExit: saveStep(id, accounts, instance, false),
    onSaveAndNext: saveStep(id, accounts, instance, true),
    bannerTitle,
    bannerRefTitle: `Ref ID: ${id}`,
    bannerSubTitle: formatBannerTitle(accountDetails),
    discard: discardChanges,
});

export default applicationAndInstrumentProps;
