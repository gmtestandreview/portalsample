import { describe, expect, it } from 'vitest';

import type { ValidationError } from 'yup';

import {
  PatternApprovalRequiredValues,
  YesNo,
} from '../../../../ClientApp/src/api/web-api-client';

import {
  applicationAndInstrumentSaveValidation,
  applicationAndInstrumentSubmitValidation,
  organisationAndContactSaveValidation,
  organisationAndContactSubmitValidation,
  patternApprovalOrgAndContactSaveValidation,
  patternApprovalOrgAndContactSubmitValidation,
  summaryAndSaveValidation,
  summaryAndSubmitValidation,
  supportingDocsSaveValidation,
  supportingDocsSubmitValidation,
} from '../../../../ClientApp/src/routes/ta/validation';

import { ValidationMessages } from '../../../../ClientApp/src/routes/ta/types';

/**
 * Structural schema type: the exported schemas carry different generic context
 * parameters, so only the validate contract is depended upon here.
 */
type ValidatableSchema = {
  validate(
    value: unknown,
    options?: { abortEarly?: boolean },
  ): Promise<unknown>;
};

/** Collects every message so conditional branches are asserted, not just the first. */
const errorsFor = async (
  schema: ValidatableSchema,
  value: unknown,
): Promise<string[]> => {
  try {
    await schema.validate(value, { abortEarly: false });
    return [];
  } catch (error) {
    return (error as ValidationError).errors;
  }
};

const contactDetails = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phoneNumber: '0400000000',
};

const allNominated = {
  isPrincipalContact: YesNo.No,
  isPrincipalInvoiceContact: YesNo.No,
  isManufacturer: YesNo.No,
  contact: {},
  invoiceContact: {},
  authorisedAgent: {},
};

const allPrincipal = {
  isPrincipalContact: YesNo.Yes,
  isPrincipalInvoiceContact: YesNo.Yes,
  isManufacturer: YesNo.Yes,
  contact: {},
  invoiceContact: {},
  authorisedAgent: {},
};

describe('organisation and contact submit validation', () => {
  it('requires the organisation type', async () => {
    expect.assertions(1);
    const errors = await errorsFor(organisationAndContactSubmitValidation, {});

    expect(errors).toContain('Organisation type is a required field');
  });
});

describe('organisation and contact submit validation', () => {
  it('rejects an organisation type outside the Yes/No options', async () => {
    expect.assertions(1);
    const errors = await errorsFor(organisationAndContactSubmitValidation, {
      isManufacturer: 'Maybe',
    });

    expect(errors).toContain('Organisation type is required');
  });
});

describe('organisation and contact submit validation', () => {
  it('requires manufacturer details when the organisation is not the manufacturer', async () => {
    expect.assertions(2);
    const errors = await errorsFor(organisationAndContactSubmitValidation, {
      isManufacturer: YesNo.No,
    });

    expect(errors.some((e) => e.includes('Manufacturer name'))).toBe(true);
    expect(errors.some((e) => e.includes('Company identifier'))).toBe(true);
  });
});
