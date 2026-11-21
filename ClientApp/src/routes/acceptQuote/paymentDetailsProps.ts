import type {
  AccountInfo,
  IPublicClientApplication,
} from '@azure/msal-browser';
import {
  AcceptQuoteClient,
  InvoiceSentToValues,
  Title,
} from '../../api/web-api-client';
import type {
  FormStepStatusDto,
  PaymentDetailsStep,
} from '../../api/web-api-client';
import { createAuthenticatedClient } from '../../authentication/authenticatedClient';
import type {
  WizardFormStepValues,
  WizardStepProps,
} from '../../components/forms/WizardForm/types';
import { discardChanges } from '../common/constants';
import type { AccountDetails } from '../../authentication/accountContext';
import {
  paymentDetailsSaveValidation,
  paymentDetailsSubmitValidation,
} from './validation';

import { acceptQuoteRedirectionOnError } from './redirection';
import { formatBannerTitle } from '../common/helperFunctions';
import AppLogger from '../../instrumentation/AppLogger';

const loadPaymentDetails =
  (id: string, accounts: AccountInfo[], instance: IPublicClientApplication) =>
  async (abortSignal?: AbortSignal) => {
    try {
      if (accounts.length > 0) {
        const client = await createAuthenticatedClient(
          AcceptQuoteClient,
          accounts,
          instance,
        );
        const paymentDetails = await client.getPaymentDetails(id, abortSignal);
        const wizardStepValues: WizardFormStepValues<PaymentDetailsStep> = {
          stepValues: { ...paymentDetails },
        };

        return wizardStepValues;
      }
    } catch (e) {
      AppLogger.error('Failed to load payment details', e as Error, { Id: id });
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
    values: PaymentDetailsStep,
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
        await client.savePaymentDetails(
          id,
          {
            applicationId: id,
            formStep: values,
            isCompletingStep: isComplete,
          },
          abortSignal,
        );
      } catch (e) {
        AppLogger.error('Failed to save payment details:', e as Error, {
          ApplicationId: id,
        });
        // Surface the failure so the wizard shows an error and stays on the
        // step, instead of reporting a failed save as a success.
        throw e;
      }
    } else {
      throw new Error('No authenticated account available to save form.');
    }
  };

const paymentDetailsProps = (
  id: string,
  accounts: AccountInfo[],
  instance: IPublicClientApplication,
  accountDetails: AccountDetails,
  statuses: FormStepStatusDto[],
  bannerTitle: string,
): WizardStepProps<PaymentDetailsStep> => ({
  initialValues: {},
  stepStatuses: statuses,
  loadStepValues: loadPaymentDetails(id, accounts, instance),
  location: '/payment-details',
  title: 'Payment details',
  hidingFields: {
    contactHide: (x: PaymentDetailsStep) =>
      x.invoiceSentTo === InvoiceSentToValues.SamePerson,
    contact: {
      titleOther: (x: PaymentDetailsStep) => x.contact?.title !== Title.Other,
    },
  },
  validateHard: paymentDetailsSubmitValidation,
  validateSoft: paymentDetailsSaveValidation,
  onSaveAndExit: saveStep(id, accounts, instance, false),
  onSaveAndNext: saveStep(id, accounts, instance, true),
  bannerTitle,
  bannerRefTitle: `Quotation ID: ${id}`,
  bannerSubTitle: formatBannerTitle(accountDetails),
  getRedirectionLocationOnError: acceptQuoteRedirectionOnError(id),
  discard: discardChanges,
});

export default paymentDetailsProps;
