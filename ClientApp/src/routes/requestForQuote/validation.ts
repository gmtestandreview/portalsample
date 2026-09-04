import * as yup from 'yup';
import { contactSchema, contactSchemaSoft } from '../../validationSchemas/contactValidation';
import '../../validationSchemas/yupExtensions';
import {
    serialNumMatchRegEx, extAlphaNumMultiLineMatchRegex, nullableDate, websiteUrlSchema,
} from '../../validationSchemas/common';
import { YesNo } from '../../api/web-api-client';
import type { InstrumentAndRequestStep, OrganisationAndContact } from '../../api/web-api-client';
import type { Validation } from '../../components/forms/FormikForm/types';
import { parseApiDateOnlyInput, parseDateOnlyInput } from '../../utils/dateOnly';

export const organisationAndContactSubmitValidation = yup.object<Validation<OrganisationAndContact>>({
    businessWebsiteAddress: websiteUrlSchema('Business website address is not a valid website address')
        .label('Business website address')
        .maxLength(100)
        .optional(),
    contact: yup.mixed().when('isPrincipalContact', {
        is: (x: YesNo | undefined) => x === YesNo.No,
        then: () => contactSchema(),
        otherwise: () => yup.mixed(),
    }),
    isCorrectBranchOrLocation: yup.string().when('organisationCount', {
        is: (val: number) => val > 1,
        then: (schema) => schema
            .required('Please confirm this is the correct branch/location.')
            .notOneOf(['No'], 'Please select a branch/location name before proceeding.'),
        otherwise: (schema) => schema.notRequired(),
    }),
});

export const organisationAndContactSaveValidation = yup.object<Validation<OrganisationAndContact>>({
    businessWebsiteAddress: websiteUrlSchema('Business website address is not a valid website address')
        .label('Business website address')
        .nullable()
        .maxLength(100),
    contact: yup.mixed().when('isPrincipalContact', {
        is: (x: YesNo | undefined) => x === YesNo.No,
        then: () => contactSchemaSoft(),
        otherwise: () => yup.mixed(),
    }),
});

export const instrumentAndRequestSubmitValidation = yup.object<Validation<InstrumentAndRequestStep>>({
    hasSerialNumber: yup.mixed<keyof typeof YesNo>()
        .label('Does this instrument/artefact have a serial number available?')
        .required()
        .oneOf(Object.values(YesNo), 'Does this instrument/artefact have a serial number available? is required'),
    serialNumber: yup.string().when('hasSerialNumber', {
        is: (x: YesNo | undefined) => x === YesNo.Yes,
        then: () => yup.string()
            .label('Serial number')
            .required()
            .minEntered(1)
            .maxLength(100)
            // To do - Explore create new Schema or stringExtensions Methods to support this
            .matches(
                serialNumMatchRegEx,
                'Serial number has invalid characters. Please use only letters, periods, numbers, and keyboard characters.',
            ),
    }),
    manufacturer: yup.string()
        .label('Manufacturer')
        .required('Enter a manufacturer.')
        .minEntered(2)
        .maxLength(100),
    model: yup.string()
        .label('Model')
        .required()
        .minEntered(2)
        .maxLength(100),
    description: yup.string()
        .label('Description')
        .optional()
        .minEntered(2)
            .maxLength(400)
        // To do - Explore create new Schema or stringExtensions Methods to support this
        .test(
            'description-valid-characters',
            String.raw`Description has invalid characters. Please remove any invalid characters such as degrees (°), semicolon (;), backslash (\), or pipe (|) to continue`,
            (value) => {
                if (!value || value.trim() === '') {
                    return true; // Skip validation if the field is blank or null
                }
                return extAlphaNumMultiLineMatchRegex.test(value); // Apply regex validation if not blank
            },
        ),
    // RULE-042: BA sign-off required — do not change during migration.
    // OPEN-ITEMS-BACKLOG P2 item 18 / analysis/BUSINESS_RULES.md RULE-042. The 1-100 bounds are
    // hardcoded; the open SME question is whether 100 is a hard operational limit (lab capacity or
    // a system constraint) or an informal cap. Confirm before changing or externalising it.
    numberOfItems: yup.number()
        .label('Number of items')
        .typeError('Number of items is a required field')
        .required()
        .min(1, 'Number of items cannot be less than 1')
        .max(100, 'Number of items cannot be greater than 100'),
    measurementCategory: yup.string()
        .label('Measurement category')
        .required(),
    instrumentOrArtefactType: yup.string()
        .label('Instrument or artefact type')
        .required(),
    previousQuoteOrReportNumber: yup.string()
        .label('Previous NMI Quote or Report number')
        .minEntered(2)
        .maxLength(100),
    testingAndCalibrationRequirements: yup.string()
        .label('Testing and calibration requirements')
        .required()
        .minEntered(2)
            .maxLength(2000)
        // To do - Explore create new Schema or stringExtensions Methods to support this
        .test(
            'testing-calib-valid-characters',
            String.raw`Testing and calibration requirements has invalid characters. Please remove any invalid characters such as degrees (°), semicolon (;), backslash (\), or pipe (|) to continue`,
            (value) => {
                if (!value || value.trim() === '') {
                    return true; // Skip validation if the field is blank or null
                }
                return extAlphaNumMultiLineMatchRegex.test(value); // Apply regex validation if not blank
            },
        ),
    measurementReportAndCertificateRequired: yup.string()
        .label('Measurement report and certificate required')
        .required(),
    preferredInstrumentOrArtefactAvailabilityDate: nullableDate('Preferred date must be a valid date format (dd/mm/yyyy)')
        .test(
            'is-future-date',
            'Cannot select a date earlier than today', // Custom error for past dates
            (value) => {
                if (!value) {
                    return true; // Null or undefined is valid
                }

                const today = parseDateOnlyInput(new Date());
                const valToTest = parseApiDateOnlyInput(value as Date | string);
                return Boolean(valToTest && today && valToTest >= today);
            },
        ),
});

export const instrumentAndRequestSaveValidation = yup.object<Validation<InstrumentAndRequestStep>>({
    hasSerialNumber: yup.mixed<keyof typeof YesNo>()
        .label('Does this instrument/artefact have a serial number available?')
        .nullable(),
    serialNumber: yup.string().when('hasSerialNumber', {
        is: (x: YesNo | undefined) => x === YesNo.Yes,
        then: () => yup.string()
            .label('Serial number')
            .nullable()
            .minEntered(1)
            .maxLength(100)
            // To do - Explore create new Schema or stringExtensions Methods to support this
            .matches(
                serialNumMatchRegEx,
                'Serial number has invalid characters. Please use only letters, periods, numbers, and keyboard characters.',
            ),
    }),
    manufacturer: yup.string()
        .label('Manufacturer')
        .nullable()
        .minEntered(2)
        .maxLength(100),
    model: yup.string()
        .label('Model')
        .nullable()
        .minEntered(2)
        .maxLength(100),
    description: yup.string()
        .label('Description')
        .optional()
        .minEntered(2)
        .maxLength(400)
        // To do - Explore create new Schema or stringExtensions Methods to support this
        .test(
            'description-valid-characters',
            'Description has invalid characters. Please use only letters, periods, numbers, and keyboard characters.',
            (value) => {
                if (!value || value.trim() === '') {
                    return true; // Skip validation if the field is blank or null
                }
                return extAlphaNumMultiLineMatchRegex.test(value); // Apply regex validation if not blank
            },
        ),
    // RULE-042 (draft-save variant): BA sign-off required — do not change during migration.
    // Second of two sites. The submit schema above requires numberOfItems; this save/draft schema
    // is nullable but applies the same 1-100 bounds when a value is present (see RULE-018 draft-save).
    // analysis/BUSINESS_RULES.md documents only the submit site — register incompleteness, CRD-044.
    numberOfItems: yup.number()
        .label('Number of items')
        .transform(
            (value) => (Number.isNaN(value) ? undefined : value),
        ).nullable()
        .min(1, 'Number of items cannot be less than 1')
        .max(100, 'Number of items cannot be greater than 100'),
    measurementCategory: yup.string()
        .label('Measurement category')
        .nullable(),
    instrumentOrArtefactType: yup.string()
        .label('Instrument or artefact type')
        .nullable(),
    previousQuoteOrReportNumber: yup.string()
        .label('Previous NMI Quote or Report number')
        .nullable()
        .minEntered(2)
        .maxLength(100),
    testingAndCalibrationRequirements: yup.string()
        .label('Testing and calibration requirements')
        .nullable()
        .minEntered(2)
        .maxLength(2000)
        // To do - Explore create new Schema or stringExtensions Methods to support this
        .test(
            'testing-calib-valid-characters',
            'Testing and calibration requirements has invalid characters. Please use only letters, periods, numbers, and keyboard characters.',
            (value) => {
                if (!value || value.trim() === '') {
                    return true; // Skip validation if the field is blank or null
                }
                return extAlphaNumMultiLineMatchRegex.test(value); // Apply regex validation if not blank
            },
        ),
    measurementReportAndCertificateRequired: yup.string()
        .label('Measurement report and certificate required')
        .nullable(),
});
