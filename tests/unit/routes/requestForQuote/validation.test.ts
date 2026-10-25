import { describe, expect, it } from 'vitest';

import '../../../../ClientApp/src/validationSchemas/yupExtensions';

import { YesNo } from '../../../../ClientApp/src/api/web-api-client';

import {
  instrumentAndRequestSaveValidation,
  instrumentAndRequestSubmitValidation,
  organisationAndContactSaveValidation,
  organisationAndContactSubmitValidation,
} from '../../../../ClientApp/src/routes/requestForQuote/validation';

const validInstrument = {
  hasSerialNumber: YesNo.Yes,
  serialNumber: 'SN-123',
  manufacturer: 'Acme',
  model: 'Model 1',
  description: 'Calibrator',
  numberOfItems: 1,
  measurementCategory: 'Mass',
  instrumentOrArtefactType: 'Weight',
  previousQuoteOrReportNumber: 'QR-1',
  testingAndCalibrationRequirements: 'Calibrate against standard',
  measurementReportAndCertificateRequired: 'MeasurementReportOnly',
  preferredInstrumentOrArtefactAvailabilityDate: new Date(
    Date.now() + 86_400_000,
  ),
};

describe('organisationAndContact validation', () => {
  it('accepts valid submit and save objects', async () => {
    expect.assertions(2);
    await expect(
      organisationAndContactSubmitValidation.validate({
        businessWebsiteAddress: 'https://measurement.gov.au',
        isPrincipalContact: YesNo.Yes,
        organisationCount: 1,
      }),
    ).resolves.toBeDefined();
    await expect(
      organisationAndContactSaveValidation.validate({
        businessWebsiteAddress: '',
        isPrincipalContact: YesNo.Yes,
      }),
    ).resolves.toBeDefined();
  });
});

describe('organisationAndContact validation', () => {
  it('requires conditional contact and branch confirmation on submit', async () => {
    expect.assertions(1);
    await expect(
      organisationAndContactSubmitValidation.validate(
        {
          isPrincipalContact: YesNo.No,
          organisationCount: 2,
          isCorrectBranchOrLocation: YesNo.No,
          contact: {},
        },
        { abortEarly: false },
      ),
    ).rejects.toMatchObject({
      errors: expect.arrayContaining([
        'Please select a branch/location name before proceeding.',
        'Title other is required',
        'First name is required',
        'Last name is required',
        'Email address is required',
      ]),
    });
  });
});

describe('organisationAndContact validation', () => {
  it('validates website format and length', async () => {
    expect.assertions(2);
    await expect(
      organisationAndContactSubmitValidation.validate({
        businessWebsiteAddress: 'not a website',
        isPrincipalContact: YesNo.Yes,
      }),
    ).rejects.toThrow(
      'Business website address is not a valid website address',
    );
    await expect(
      organisationAndContactSaveValidation.validate({
        businessWebsiteAddress: `${'a'.repeat(97)}.com`,
        isPrincipalContact: YesNo.Yes,
      }),
    ).rejects.toThrow(
      'Business website address cannot be greater than 100 characters',
    );
  });
});
