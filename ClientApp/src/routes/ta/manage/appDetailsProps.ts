/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import type { SinglePageFormValues, SinglePageFormProps } from '../types';
import AppLogger from '../../../instrumentation/AppLogger';
import {
    PatternApprovalRequiredValues, type RequestForPatternApprovalAppDetails, RequestForPatternApprovalClient, YesNo,
} from '../../../api/web-api-client';
import { tokenRequest } from '../../../authentication/authConfig';
import { DisplayRules } from '../displayRules';

const loadAppDetails = (id: string, accounts: AccountInfo[], instance: IPublicClientApplication) => async (
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
            const instrumentAndRequest = await client.getAppDetails(id as string, abortSignal);
            const values: SinglePageFormValues<RequestForPatternApprovalAppDetails> = {
                formValues: { ...instrumentAndRequest },
            };

            return values;
        } catch (error) {
            AppLogger.error('Failed to load app details', error as Error, { Id: id });
            throw Error(`Failed to load app details. Id: ${id}`);
        }
    } else {
        AppLogger.verbose('There are no accounts available to load app details', { Id: id, Accounts: accounts });
        throw Error(`There are no accounts available to load app details. Id: ${id}`);
    }
};

const appDetailsProps = (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
)
: SinglePageFormProps<RequestForPatternApprovalAppDetails> => ({
    initialValues: {
    },
    loadStepValues: loadAppDetails(id, accounts, instance),
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
            isApplOIMLHide: (x: any) => DisplayRules.isOIMLHidden(x.applicationAndInstrument),
        },
    },
    // bannerRefTitle: `Ref ID: ${id}`,
    // getRedirectionLocationOnError: getRedirectionLocationOnError(id),
    isSummaryPage: true,
});

export default appDetailsProps;
