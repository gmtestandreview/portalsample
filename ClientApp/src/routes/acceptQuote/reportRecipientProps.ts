import type {
  AccountInfo,
  IPublicClientApplication,
} from '@azure/msal-browser';
import {
  AcceptQuoteClient,
  ReportAddressTypeValues,
  Title,
} from '../../api/web-api-client';
import type {
  FormStepStatusDto,
  ReportRecipientStep,
} from '../../api/web-api-client';
import { createAuthenticatedClient } from '../../authentication/authenticatedClient';
import type {
  WizardFormStepValues,
  WizardStepProps,
} from '../../components/forms/WizardForm/types';
import {
  reportRecipientSaveValidation,
  reportRecipientSubmitValidation,
} from './validation';
import type { AccountDetails } from '../../authentication/accountContext';
import type { DiscardProps } from '../../components/forms/types';
import { acceptQuoteRedirectionOnError } from './redirection';
import { formatBannerTitle } from '../common/helperFunctions';
import AppLogger from '../../instrumentation/AppLogger';

const loadReportRecipient =
  (id: string, accounts: AccountInfo[], instance: IPublicClientApplication) =>
  async (abortSignal?: AbortSignal) => {
    if (accounts.length > 0) {
      const client = await createAuthenticatedClient(
        AcceptQuoteClient,
        accounts,
        instance,
      );
      const reportRecipient = await client.getReportRecipient(id, abortSignal);
      const wizardStepValues: WizardFormStepValues<ReportRecipientStep> = {
        stepValues: { ...reportRecipient },
      };

      return wizardStepValues;
    }

    throw new Error('There was an error retrieving your details.');
  };

const saveStep =
  (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    isComplete: boolean,
  ) =>
  async (
    values: ReportRecipientStep,
    _isDirty: boolean,
    abortSignal?: AbortSignal,
  ) => {
    if (accounts.length > 0) {
      try {
        const client = await createAuthenticatedClient(
          AcceptQuoteClient,
          accounts,
          instance,
        );
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
        AppLogger.error('Failed to save payment report recipient', e as Error, {
          Id: id,
        });
        // Surface the failure so the wizard shows an error and stays on the
        // step, instead of reporting a failed save as a success.
        throw e;
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

const reportRecipientProps = (
  id: string,
  referenceId: string,
  accounts: AccountInfo[],
  instance: IPublicClientApplication,
  accountDetails: AccountDetails,
  statuses: FormStepStatusDto[],
  bannerTitle: string,
): WizardStepProps<ReportRecipientStep> => ({
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
      titleOther: (x: ReportRecipientStep) => x.contact?.title !== Title.Other,
    },
    businessStreetAddress: (x: ReportRecipientStep) =>
      x.reportAddressType !== ReportAddressTypeValues.Other,
  },
  validateHard: reportRecipientSubmitValidation,
  validateSoft: reportRecipientSaveValidation,
  onSaveAndExit: saveStep(id, accounts, instance, false),
  onSaveAndNext: saveStep(id, accounts, instance, true),
  bannerTitle,
  bannerRefTitle: `Quotation ID: ${id}`,
  bannerSubTitle: formatBannerTitle(accountDetails),
  getRedirectionLocationOnError: acceptQuoteRedirectionOnError(id),
  discard: discardChanges(referenceId),
});

export default reportRecipientProps;
