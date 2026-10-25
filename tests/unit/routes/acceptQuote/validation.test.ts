import { describe, expect, it } from 'vitest';

import '../../../../ClientApp/src/validationSchemas/yupExtensions';

import {
  InvoiceSentToValues,
  ReturnAddressTypeValues,
  ReturnContactTypeValues,
  ReturnMethodValues,
  YesNo,
} from '../../../../ClientApp/src/api/web-api-client';

import {
  deliveryAndReturnSaveValidation,
  deliveryAndReturnSubmitValidation,
  paymentDetailsSaveValidation,
  paymentDetailsSubmitValidation,
  reportRecipientSaveValidation,
  reportRecipientSubmitValidation,
  summaryAndAcceptSaveValidation,
  summaryAndAcceptSubmitValidation,
} from '../../../../ClientApp/src/routes/acceptQuote/validation';

describe('report recipient validation', () => {
  it('accepts valid submit and empty save objects', async () => {
    expect.assertions(2);
    await expect(
      reportRecipientSubmitValidation.validate({
        organisationName: 'NMI',
        reportAddressType: ReturnAddressTypeValues.BusinessAddress,
      }),
    ).resolves.toBeDefined();
    await expect(reportRecipientSaveValidation.validate({})).resolves.toEqual(
      {},
    );
  });
});

describe('report recipient validation', () => {
  it('requires other report address when selected', async () => {
    expect.assertions(1);
    await expect(
      reportRecipientSubmitValidation.validate({
        reportAddressType: ReturnAddressTypeValues.Other,
        businessStreetAddress: {
          isManuallyEntered: false,
          searchText: '',
        },
      }),
    ).rejects.toThrow('Organisation address for report is required');
  });
});

describe('report recipient validation', () => {
  it('enforces organisation name max length', async () => {
    expect.assertions(2);
    await expect(
      reportRecipientSubmitValidation.validate({
        organisationName: 'a'.repeat(400),
      }),
    ).resolves.toBeDefined();
    await expect(
      reportRecipientSubmitValidation.validate({
        organisationName: 'a'.repeat(401),
      }),
    ).rejects.toThrow(
      'Organisation name cannot be greater than 400 characters',
    );
  });
});
