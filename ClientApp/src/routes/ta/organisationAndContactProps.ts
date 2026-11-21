import type {
  AccountInfo,
  IPublicClientApplication,
} from '@azure/msal-browser';
import {
  type FormStepStatusDto,
  type PatternApprovalOrgAndContact,
  RequestForPatternApprovalClient,
  Title,
  YesNo,
} from '../../api/web-api-client';
import { createAuthenticatedClient } from '../../authentication/authenticatedClient';
import type {
  ErrorType,
  WizardFormStepValues,
  WizardStepProps,
} from '../../components/forms/WizardForm/types';
import { discardChanges } from '../common/constants';
import {
  patternApprovalOrgAndContactSaveValidation,
  patternApprovalOrgAndContactSubmitValidation,
} from './validation';
import type { AccountDetails } from '../../authentication/accountContext';
import { formatBannerTitle } from '../common/helperFunctions';
import AppLogger from '../../instrumentation/AppLogger';

const loadOrganisationAndContact =
  (id: string, accounts: AccountInfo[], instance: IPublicClientApplication) =>
  async (abortSignal?: AbortSignal) => {
    if (accounts.length > 0) {
      try {
        const client = await createAuthenticatedClient(
          RequestForPatternApprovalClient,
          accounts,
          instance,
        );
        const organisationAndContact = await client.getOrganisationAndContact(
          id,
          abortSignal,
        );
        const wizardStepValues: WizardFormStepValues<PatternApprovalOrgAndContact> =
          {
            stepValues: { ...organisationAndContact },
          };

        return wizardStepValues;
      } catch (error) {
        AppLogger.error(
          'Failed to load PA org and contact details',
          error as Error,
          { Id: id },
        );
        throw new Error(
          `Failed to load PA org and contact details. Id: ${id}`,
          { cause: error },
        );
      }
    } else {
      AppLogger.verbose(
        'There are no accounts available to load PA organisation and contact details',
        { Id: id, Accounts: accounts },
      );
      throw new Error(
        `There are no accounts available to load PA organisation and contact details. Id: ${id}`,
      );
    }
  };

const saveStep =
  (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    isComplete: boolean,
  ) =>
  async (
    values: PatternApprovalOrgAndContact,
    _isDirty: boolean,
    abortSignal?: AbortSignal,
  ) => {
    if (accounts.length > 0) {
      try {
        const client = await createAuthenticatedClient(
          RequestForPatternApprovalClient,
          accounts,
          instance,
        );
        await client.saveOrganisationAndContact(
          id,
          {
            applicationId: id,
            formStep: values,
            isCompletingStep: isComplete,
          },
          abortSignal,
        );
      } catch (error) {
        AppLogger.error(
          'Failed to save PA org and contact details',
          error as Error,
          { Id: id },
        );
        throw new Error(
          `Failed to save PA org and contact details. Id: ${id}`,
          { cause: error },
        );
      }
    } else {
      AppLogger.verbose(
        'There are no accounts available to save PA organisation and contact details',
        { Id: id, Accounts: accounts },
      );
      throw new Error(
        `There are no accounts available to save PA organisation and contact details. Id: ${id}`,
      );
    }
  };

const getRedirectionLocationOnError =
  (_id: string) => (_errorCode: number, _errorType: ErrorType) =>
    '/not-found';

const OrganisationAndContactProps = (
  id: string,
  accounts: AccountInfo[],
  instance: IPublicClientApplication,
  accountDetails: AccountDetails,
  statuses: FormStepStatusDto[],
  bannerTitle: string,
): WizardStepProps<PatternApprovalOrgAndContact> => ({
  initialValues: {},
  stepStatuses: statuses,
  loadStepValues: loadOrganisationAndContact(id, accounts, instance),
  location: '/organisation-details',
  title: 'Organisation details',
  hidingFields: {
    isManufacturerHide: (x: Partial<PatternApprovalOrgAndContact>) =>
      x.isManufacturer === YesNo.Yes || x.isManufacturer === undefined,
    isCurrentOrganisationHide: (_x: Partial<PatternApprovalOrgAndContact>) =>
      true,
    principalContactHide: (x: Partial<PatternApprovalOrgAndContact>) =>
      x.isPrincipalContact === YesNo.Yes || x.isPrincipalContact === undefined,
    principalInvoiceContactHide: (x: Partial<PatternApprovalOrgAndContact>) =>
      x.isPrincipalInvoiceContact === YesNo.Yes ||
      x.isPrincipalInvoiceContact === undefined,
    contact: {
      titleOther: (x: Partial<PatternApprovalOrgAndContact>) =>
        x.contact?.title !== Title.Other,
    },
    invoiceContact: {
      titleOther: (x: Partial<PatternApprovalOrgAndContact>) =>
        x.invoiceContact?.title !== Title.Other,
    },
  },
  validateHard: patternApprovalOrgAndContactSubmitValidation,
  validateSoft: patternApprovalOrgAndContactSaveValidation,
  onSaveAndExit: saveStep(id, accounts, instance, false),
  onSaveAndNext: saveStep(id, accounts, instance, true),
  bannerTitle,
  bannerRefTitle: `Ref ID: ${id}`,
  bannerSubTitle: formatBannerTitle(accountDetails),
  getRedirectionLocationOnError: getRedirectionLocationOnError(id),
  discard: discardChanges,
});

export default OrganisationAndContactProps;
