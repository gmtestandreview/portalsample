import type {
  AccountInfo,
  IPublicClientApplication,
} from '@azure/msal-browser';
import type { SinglePageFormValues, SinglePageFormProps } from '../types';
import AppLogger from '../../../instrumentation/AppLogger';
import {
  PatternApprovalRequiredValues,
  Title,
  type RequestForPatternApprovalAppDetails,
  RequestForPatternApprovalClient,
  YesNo,
} from '../../../api/web-api-client';
import { silentRequestFor } from '../../../authentication/silentRequest';
import { DisplayRules } from '../displayRules';

type AppDetailsHidingValues = Partial<RequestForPatternApprovalAppDetails>;

const loadAppDetails =
  (id: string, accounts: AccountInfo[], instance: IPublicClientApplication) =>
  async (abortSignal?: AbortSignal) => {
    if (accounts.length > 0) {
      try {
        const client = new RequestForPatternApprovalClient();
        const tokenResult = await instance.acquireTokenSilent(
          silentRequestFor(accounts[0]),
        );
        client.setAuthToken(tokenResult.accessToken);
        const instrumentAndRequest = await client.getAppDetails(
          id,
          abortSignal,
        );
        const values: SinglePageFormValues<RequestForPatternApprovalAppDetails> =
          {
            formValues: { ...instrumentAndRequest },
          };

        return values;
      } catch (error) {
        AppLogger.error('Failed to load app details', error as Error, {
          Id: id,
        });
        throw new Error(`Failed to load app details. Id: ${id}`, {
          cause: error,
        });
      }
    } else {
      AppLogger.verbose('There are no accounts available to load app details', {
        Id: id,
        Accounts: accounts,
      });
      throw new Error(
        `There are no accounts available to load app details. Id: ${id}`,
      );
    }
  };

const appDetailsProps = (
  id: string,
  accounts: AccountInfo[],
  instance: IPublicClientApplication,
): SinglePageFormProps<RequestForPatternApprovalAppDetails> => ({
  initialValues: {},
  loadStepValues: loadAppDetails(id, accounts, instance),
  location: '/summary',
  title: 'Summary and submit',
  hidingFields: {
    organisationAndContact: {
      branchOrLocationName: (x: AppDetailsHidingValues) =>
        !x.organisationAndContact?.branchOrLocationName,
      isManufacturerHide: (x: AppDetailsHidingValues) =>
        x.organisationAndContact?.isManufacturer === YesNo.Yes ||
        x.organisationAndContact?.isManufacturer === undefined,
      principalInvoiceContactHide: (x: AppDetailsHidingValues) =>
        x.organisationAndContact?.isPrincipalInvoiceContact === YesNo.Yes ||
        x.organisationAndContact?.isPrincipalInvoiceContact === undefined,
      isCurrentOrganisationHide: (x: AppDetailsHidingValues) =>
        x.organisationAndContact?.isManufacturer === YesNo.No,
      contact: {
        titleOther: (x: AppDetailsHidingValues) =>
          x.organisationAndContact?.contact?.title !== Title.Other,
      },
      invoiceContact: {
        titleOther: (x: AppDetailsHidingValues) =>
          x.organisationAndContact?.invoiceContact?.title !== Title.Other,
      },
    },
    applicationAndInstrument: {
      isApplNewHide: (x: AppDetailsHidingValues) =>
        x.applicationAndInstrument?.patternApprovalType !==
          PatternApprovalRequiredValues.NewCertificate ||
        x.applicationAndInstrument?.patternApprovalType === undefined,
      isApplVariationHide: (x: AppDetailsHidingValues) =>
        x.applicationAndInstrument?.patternApprovalType !==
          PatternApprovalRequiredValues.Variation ||
        x.applicationAndInstrument?.patternApprovalType === undefined,
      isApplOtherHide: (x: AppDetailsHidingValues) =>
        x.applicationAndInstrument?.patternApprovalType !==
          PatternApprovalRequiredValues.OtherApproval ||
        x.applicationAndInstrument?.patternApprovalType === undefined,
      isApplOIMLHide: (x: AppDetailsHidingValues) =>
        DisplayRules.isOIMLHidden(x.applicationAndInstrument ?? {}),
    },
  },
  // bannerRefTitle: `Ref ID: ${id}`,
  // getRedirectionLocationOnError: getRedirectionLocationOnError(id),
  isSummaryPage: true,
});

export default appDetailsProps;
