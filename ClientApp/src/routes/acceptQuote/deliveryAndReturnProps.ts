import type {
  AccountInfo,
  IPublicClientApplication,
} from '@azure/msal-browser';
import {
  AcceptQuoteClient,
  ReturnAddressTypeValues,
  ReturnContactTypeValues,
  ReturnMethodValues,
} from '../../api/web-api-client';
import type {
  DeliveryAndReturnStep,
  FormStepStatusDto,
} from '../../api/web-api-client';
import { createAuthenticatedClient } from '../../authentication/authenticatedClient';
import type {
  WizardFormStepValues,
  WizardStepProps,
} from '../../components/forms/WizardForm/types';
import { discardChanges } from '../common/constants';
import type { AccountDetails } from '../../authentication/accountContext';
import {
  deliveryAndReturnSaveValidation,
  deliveryAndReturnSubmitValidation,
} from './validation';

import { acceptQuoteRedirectionOnError } from './redirection';
import { formatBannerTitle } from '../common/helperFunctions';

const loadDeliveryAndReturn =
  (id: string, accounts: AccountInfo[], instance: IPublicClientApplication) =>
  async (abortSignal?: AbortSignal) => {
    if (accounts.length > 0) {
      const client = await createAuthenticatedClient(
        AcceptQuoteClient,
        accounts,
        instance,
      );
      const deliveryAndReturn = await client.getDeliveryAndReturn(
        id,
        abortSignal,
      );
      const wizardStepValues: WizardFormStepValues<DeliveryAndReturnStep> = {
        stepValues: { ...deliveryAndReturn },
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
    values: DeliveryAndReturnStep,
    _isDirty: boolean,
    abortSignal?: AbortSignal,
  ) => {
    if (accounts.length > 0) {
      const client = await createAuthenticatedClient(
        AcceptQuoteClient,
        accounts,
        instance,
      );
      await client.saveDeliveryAndReturn(
        id,
        {
          applicationId: id,
          formStep: values,
          isCompletingStep: isComplete,
        },
        abortSignal,
      );
    } else {
      throw new Error('No authenticated account available to save form.');
    }
  };

export const deliveryAndReturnHidingFields = {
  contactHide: (x: DeliveryAndReturnStep) =>
    x.returnContactType === ReturnContactTypeValues.SamePerson,
  contact: {
    titleOther: (x: DeliveryAndReturnStep) =>
      String(x.contact?.title) !== 'Other',
  },
  returnAddress: (x: DeliveryAndReturnStep) =>
    x.returnAddressType !== ReturnAddressTypeValues.Other,
  carrierHide: (x: DeliveryAndReturnStep) =>
    x.returnMethod !== ReturnMethodValues.ClientWillProvide,
};

const deliveryAndReturnProps = (
  id: string,
  accounts: AccountInfo[],
  instance: IPublicClientApplication,
  accountDetails: AccountDetails,
  statuses: FormStepStatusDto[],
  bannerTitle: string,
): WizardStepProps<DeliveryAndReturnStep> => ({
  initialValues: {
    returnAddress: {},
  },
  stepStatuses: statuses,
  loadStepValues: loadDeliveryAndReturn(id, accounts, instance),
  location: '/delivery-and-return',
  title: 'Instrument/artefact delivery and return',
  hidingFields: deliveryAndReturnHidingFields,
  validateHard: deliveryAndReturnSubmitValidation,
  validateSoft: deliveryAndReturnSaveValidation,
  onSaveAndExit: saveStep(id, accounts, instance, false),
  onSaveAndNext: saveStep(id, accounts, instance, true),
  bannerTitle,
  bannerRefTitle: `Quotation ID: ${id}`,
  bannerSubTitle: formatBannerTitle(accountDetails),
  getRedirectionLocationOnError: acceptQuoteRedirectionOnError(id),
  discard: discardChanges,
});

export default deliveryAndReturnProps;
