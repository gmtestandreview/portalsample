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
    preferredInstrumentOrArtefactAvailabilityDate: new Date(Date.now() + 86_400_000),
};

describe('organisationAndContact validation', () => {
    it('accepts valid submit and save objects', async () => {
        await expect(organisationAndContactSubmitValidation.validate({
            businessWebsiteAddress: 'https://measurement.gov.au',
            isPrincipalContact: YesNo.Yes,
            organisationCount: 1,
        })).resolves.toBeDefined();
        await expect(organisationAndContactSaveValidation.validate({
            businessWebsiteAddress: '',
            isPrincipalContact: YesNo.Yes,
        })).resolves.toBeDefined();
    });

    it('requires conditional contact and branch confirmation on submit', async () => {
        await expect(organisationAndContactSubmitValidation.validate({
            isPrincipalContact: YesNo.No,
            organisationCount: 2,
            isCorrectBranchOrLocation: YesNo.No,
            contact: {},
        }, { abortEarly: false })).rejects.toMatchObject({
            errors: expect.arrayContaining([
                'Please select a branch/location name before proceeding.',
                'Title other is required',
                'First name is required',
                'Last name is required',
                'Email address is required',
            ]),
        });
    });

    it('validates website format and length', async () => {
        await expect(organisationAndContactSubmitValidation.validate({
            businessWebsiteAddress: 'not a website',
            isPrincipalContact: YesNo.Yes,
        })).rejects.toThrow('Business website address is not a valid website address');
        await expect(organisationAndContactSaveValidation.validate({
            businessWebsiteAddress: `${'a'.repeat(97)}.com`,
            isPrincipalContact: YesNo.Yes,
        })).rejects.toThrow('Business website address cannot be greater than 100 characters');
    });

    it('uses soft contact validation for saves when principal contact differs', async () => {
        await expect(organisationAndContactSaveValidation.validate({
            isPrincipalContact: YesNo.No,
            contact: {
                email: 'bad',
            },
        })).rejects.toThrow('Email address is not a valid email address');
    });
});

describe('instrumentAndRequest validation', () => {
    it('accepts a valid submit object', async () => {
        await expect(instrumentAndRequestSubmitValidation.validate(validInstrument)).resolves.toMatchObject({
            serialNumber: 'SN-123',
        });
    });

    it('validates RFQ availability dates as calendar dates rather than timezone-shifted instants', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');

        await expect(instrumentAndRequestSubmitValidation.validate({
            ...validInstrument,
            preferredInstrumentOrArtefactAvailabilityDate: `${year}-${month}-${day}T00:00:00+10:00`,
        })).resolves.toMatchObject({
            preferredInstrumentOrArtefactAvailabilityDate: `${year}-${month}-${day}T00:00:00+10:00`,
        });
    });

    it('requires missing submit fields', async () => {
        await expect(instrumentAndRequestSubmitValidation.validate({}, { abortEarly: false })).rejects.toMatchObject({
            errors: expect.arrayContaining([
                'Does this instrument/artefact have a serial number available? is a required field',
                'Enter a manufacturer.',
                'Model is a required field',
                'Number of items is a required field',
                'Measurement category is a required field',
                'Instrument or artefact type is a required field',
                'Testing and calibration requirements is a required field',
                'Measurement report and certificate required is a required field',
            ]),
        });
    });

    it('validates invalid formats and conditional serial number', async () => {
        await expect(instrumentAndRequestSubmitValidation.validate({
            ...validInstrument,
            serialNumber: 'bad<>',
            manufacturer: 'A',
            model: 'B',
            description: 'bad|',
            previousQuoteOrReportNumber: 'Q',
            testingAndCalibrationRequirements: 'bad|',
            numberOfItems: 0,
            preferredInstrumentOrArtefactAvailabilityDate: new Date(Date.now() - 86_400_000),
        }, { abortEarly: false })).rejects.toMatchObject({
            errors: expect.arrayContaining([
                'Serial number has invalid characters. Please use only letters, periods, numbers, and keyboard characters.',
                'Manufacturer cannot be less than 2 characters',
                'Model cannot be less than 2 characters',
                String.raw`Description has invalid characters. Please remove any invalid characters such as degrees (°), semicolon (;), backslash (\), or pipe (|) to continue`,
                'Previous NMI Quote or Report number cannot be less than 2 characters',
                String.raw`Testing and calibration requirements has invalid characters. Please remove any invalid characters such as degrees (°), semicolon (;), backslash (\), or pipe (|) to continue`,
                'Number of items cannot be less than 1',
                'Cannot select a date earlier than today',
            ]),
        });
        await expect(instrumentAndRequestSubmitValidation.validate({
            ...validInstrument,
            hasSerialNumber: YesNo.No,
            serialNumber: '',
        })).resolves.toBeDefined();
    });

    it('allows whitespace-only optional custom text checks after required validation passes', async () => {
        await expect(instrumentAndRequestSubmitValidation.validate({
            ...validInstrument,
            description: '   ',
            testingAndCalibrationRequirements: '   ',
        })).resolves.toBeDefined();
    });

    it('accepts max length boundaries and rejects over max length boundaries', async () => {
        await expect(instrumentAndRequestSubmitValidation.validate({
            ...validInstrument,
            serialNumber: 's'.repeat(100),
            manufacturer: 'm'.repeat(100),
            model: 'o'.repeat(100),
            description: 'd'.repeat(400),
            previousQuoteOrReportNumber: 'p'.repeat(100),
            testingAndCalibrationRequirements: 't'.repeat(2000),
            numberOfItems: 100,
        })).resolves.toBeDefined();
        await expect(instrumentAndRequestSubmitValidation.validate({
            ...validInstrument,
            serialNumber: 's'.repeat(101),
            manufacturer: 'm'.repeat(101),
            model: 'o'.repeat(101),
            description: 'd'.repeat(401),
            previousQuoteOrReportNumber: 'p'.repeat(101),
            testingAndCalibrationRequirements: 't'.repeat(2001),
            numberOfItems: 101,
        }, { abortEarly: false })).rejects.toMatchObject({
            errors: expect.arrayContaining([
                'Serial number cannot be greater than 100 characters',
                'Manufacturer cannot be greater than 100 characters',
                'Model cannot be greater than 100 characters',
                'Description cannot be greater than 400 characters',
                'Previous NMI Quote or Report number cannot be greater than 100 characters',
                'Testing and calibration requirements cannot be greater than 2000 characters',
                'Number of items cannot be greater than 100',
            ]),
        });
    });

    it('allows sparse saves but validates populated save fields', async () => {
        await expect(instrumentAndRequestSaveValidation.validate({
            numberOfItems: Number.NaN,
            description: '',
            testingAndCalibrationRequirements: '',
        })).resolves.toBeDefined();
        await expect(instrumentAndRequestSaveValidation.validate({
            ...validInstrument,
            description: 'bad|',
            testingAndCalibrationRequirements: 'bad|',
            numberOfItems: 101,
        }, { abortEarly: false })).rejects.toMatchObject({
            errors: expect.arrayContaining([
                'Description has invalid characters. Please use only letters, periods, numbers, and keyboard characters.',
                'Testing and calibration requirements has invalid characters. Please use only letters, periods, numbers, and keyboard characters.',
                'Number of items cannot be greater than 100',
            ]),
        });
    });
});
