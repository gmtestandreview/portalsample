import type {
  AccountInfo,
  IPublicClientApplication,
} from '@azure/msal-browser';
import {
  AcceptQuoteClient,
  InvoiceSentToValues,
  ReturnContactTypeValues,
  Title,
  YesNo,
} from '../../api/web-api-client';
import type {
  FormStepStatusDto,
  SummaryAndAcceptStep,
} from '../../api/web-api-client';
import { createAuthenticatedClient } from '../../authentication/authenticatedClient';
import { ErrorType } from '../../components/forms/WizardForm/types';
import type {
  WizardFormStepValues,
  WizardStepProps,
} from '../../components/forms/WizardForm/types';
import { setDashboardNotification } from '../../storage/notification';
import { NotificationSeverity } from '../../storage/types';
import { HttpStatusCode } from '../../types';
import type { AccountDetails } from '../../authentication/accountContext';
import { discardChanges } from '../common/constants';
import {
  summaryAndAcceptSaveValidation,
  summaryAndAcceptSubmitValidation,
} from './validation';
import { formatBannerTitle } from '../common/helperFunctions';
import SessionStorageCache from '../../storage/sessionStorageCache';

const loadSummary =
  (id: string, accounts: AccountInfo[], instance: IPublicClientApplication) =>
  async (abortSignal?: AbortSignal) => {
    if (accounts.length > 0) {
      const client = await createAuthenticatedClient(
        AcceptQuoteClient,
        accounts,
        instance,
      );
      const summaryStep = await client.getSummaryAndAccept(id, abortSignal);
      const wizardStepValues: WizardFormStepValues<SummaryAndAcceptStep> = {
        stepValues: { ...summaryStep },
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
    values: SummaryAndAcceptStep,
    _isDirty: boolean,
    abortSignal?: AbortSignal,
  ) => {
    if (accounts.length > 0) {
      const client = await createAuthenticatedClient(
        AcceptQuoteClient,
        accounts,
        instance,
      );
      await client.saveSummaryAndAccept(
        id,
        {
          applicationId: id,
          formStep: values,
          isCompletingStep: isComplete,
        },
        abortSignal,
      );
      const quoteRequestIdNum = values.acceptQuotePreInfo?.quoteRequestIdNum;
      if (isComplete && quoteRequestIdNum !== undefined) {
        SessionStorageCache().setItem(quoteRequestIdNum, 'accepted-quote-id');
      }
    } else {
      throw new Error('No authenticated account available to save form.');
    }
  };

const getRedirectionLocationOnError =
  (id: string) => (errorCode: HttpStatusCode, errorType: ErrorType) => {
    if (
      errorCode === HttpStatusCode.PreconditionFailed &&
      errorType === ErrorType.Load
    ) {
      return `/request-for-quote/${id}/view-summary`;
    }

    if (
      errorCode === HttpStatusCode.NotFound &&
      errorType === ErrorType.Update
    ) {
      setDashboardNotification({
        message:
          'The request could not be submitted as it has already been deleted by another person.',
        severity: NotificationSeverity.Error,
      });
      return '/';
    }

    return undefined;
  };

export const summaryAndAcceptOwnHidingFields = {
  associatedDispute: (x: SummaryAndAcceptStep) =>
    x.associatedDisputes === YesNo.No,
};

const summaryAndAcceptProps = (
  id: string,
  accounts: AccountInfo[],
  instance: IPublicClientApplication,
  accountDetails: AccountDetails,
  statuses: FormStepStatusDto[],
  bannerTitle: string,
): WizardStepProps<SummaryAndAcceptStep> => ({
  initialValues: {},
  stepStatuses: statuses,
  loadStepValues: loadSummary(id, accounts, instance),
  location: '/summary-and-accept',
  title: 'Summary and accept',
  hidingFields: {
    ...summaryAndAcceptOwnHidingFields,
    reportRecipient: {
      rfqHide: (x: SummaryAndAcceptStep) =>
        x.reportRecipient?.organisationDifferent !== YesNo.No,
      organisationNameHide: (x: SummaryAndAcceptStep) =>
        x.reportRecipient?.organisationDifferent === YesNo.No,
      contact: {
        titleOther: (x: SummaryAndAcceptStep) =>
          x.reportRecipient?.contact?.title !== Title.Other,
      },
      recipientMailingAddress: (x: SummaryAndAcceptStep) =>
        x.reportRecipient?.isRecipientMailingAddressSame === true,
    },
    deliveryAndReturn: {
      rfqHide: (x: SummaryAndAcceptStep) =>
        x.deliveryAndReturn?.returnContactType !==
        ReturnContactTypeValues.SamePerson,
      contactHide: (x: SummaryAndAcceptStep) =>
        x.deliveryAndReturn?.returnContactType ===
        ReturnContactTypeValues.SamePerson,
      contact: {
        titleOther: (x: SummaryAndAcceptStep) =>
          x.deliveryAndReturn?.contact?.title !== Title.Other,
      },
    },
    paymentDetails: {
      rfqHide: (x: SummaryAndAcceptStep) =>
        x.paymentDetails?.invoiceSentTo !== InvoiceSentToValues.SamePerson,
      contactHide: (x: SummaryAndAcceptStep) =>
        x.paymentDetails?.invoiceSentTo === InvoiceSentToValues.SamePerson,
      contact: {
        titleOther: (x: SummaryAndAcceptStep) =>
          x.paymentDetails?.contact?.title !== Title.Other,
      },
    },
    requestForQuote: {
      contact: {
        titleOther: (x: SummaryAndAcceptStep) =>
          x.requestForQuote?.contact?.title !== Title.Other,
      },
    },
  },
  validateHard: summaryAndAcceptSubmitValidation,
  validateSoft: summaryAndAcceptSaveValidation,
  onSaveAndExit: saveStep(id, accounts, instance, false),
  onSaveAndNext: saveStep(id, accounts, instance, true),
  bannerTitle,
  bannerRefTitle: `Quotation ID: ${id}`,
  bannerSubTitle: formatBannerTitle(accountDetails),
  getRedirectionLocationOnError: getRedirectionLocationOnError(id),
  isSummaryPage: false,
  discard: discardChanges,
});

export default summaryAndAcceptProps;
