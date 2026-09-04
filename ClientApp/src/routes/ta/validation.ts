import * as yup from 'yup';
import {
    authorisedAgentSchema, authorisedAgentSchemaSoft, contactSchema, contactSchemaSoft,
} from '../../validationSchemas/contactValidation';
import '../../validationSchemas/yupExtensions';
import {
    extAlphaNumMultiLineMatchRegex, websiteUrlSchema,
} from '../../validationSchemas/common';
import {
    type ApplicationAndInstrumentStep,
    type OrganisationAndContact, type PatternApprovalOrgAndContact, PatternApprovalRequiredValues, type RequestForPatternApprovalSummary, YesNo,
} from '../../api/web-api-client';
import type { Validation } from '../../components/forms/FormikForm/types';
import { ValidationMessages } from './types';

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
    isManufacturer: yup.mixed<keyof typeof YesNo>()
        .label('Organisation type')
        .required()
        .oneOf(Object.values(YesNo), 'Organisation type is required'),
    manufacturerName: yup.string().when('isManufacturer', {
        is: (x: YesNo | undefined) => x === YesNo.No,
        then: () => yup.string()
            .label('Manufacturer name')
            .required()
            .minEntered(2)
            .maxLength(100),
    }),
    companyIdentifier: yup.string().when('isManufacturer', {
        is: (x: YesNo | undefined) => x === YesNo.No,
        then: () => yup.string()
            .label('Company identifier')
            .required()
            .minEntered(2)
            .maxLength(100),
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

export const supportingDocsSaveValidation = yup.object().shape({
    form: yup.object().shape({
        documents: yup.array()
            .of(
                yup.object().shape({
                    attachmentCategory: yup.string().nullable(),
                }),
            ),
    }),
});

export const supportingDocsSubmitValidation = yup.object().shape({
    form: yup.object().shape({
        documents: yup.array()
            .of(
                yup.object().shape({
                    attachmentCategory: yup.string().nullable(),
                }),
            )
            .min(1, ValidationMessages.RequiredDoc)
            .test(
                'all-have-category',
                function (docs) {
                    if (!Array.isArray(docs)) return true;
                    const hasMissing = docs.some((doc) => !doc.attachmentCategory);
                    return hasMissing
                        ? this.createError({ message: ValidationMessages.RequiredTag })
                        : true;
                },
            ),
    }),
});

export const patternApprovalOrgAndContactSubmitValidation = yup.object<Validation<PatternApprovalOrgAndContact>>({
    /* businessWebsiteAddress: websiteUrlSchema('Business website address is not a valid website address')
        .label('Business website address')
        .maxLength(100)
        .optional(), */
    contact: yup.mixed().when('isPrincipalContact', {
        is: (x: YesNo | undefined) => x === YesNo.No,
        then: () => contactSchema(),
        otherwise: () => yup.mixed(),
    }),
    invoiceContact: yup.mixed().when('isPrincipalInvoiceContact', {
        is: (x: YesNo | undefined) => x === YesNo.No,
        then: () => contactSchema(),
        otherwise: () => yup.mixed(),
    }),
    authorisedAgent: yup.mixed().when('isManufacturer', {
        is: (x: YesNo | undefined) => x === YesNo.No,
        then: () => authorisedAgentSchema(),
        otherwise: () => yup.mixed(),
    }),
});

export const patternApprovalOrgAndContactSaveValidation = yup.object<Validation<PatternApprovalOrgAndContact>>({
    contact: yup.mixed().when('isPrincipalContact', {
        is: (x: YesNo | undefined) => x === YesNo.No,
        then: () => contactSchemaSoft(),
        otherwise: () => yup.mixed(),
    }),
    invoiceContact: yup.mixed().when('isPrincipalInvoiceContact', {
        is: (x: YesNo | undefined) => x === YesNo.No,
        then: () => contactSchemaSoft(),
        otherwise: () => yup.mixed(),
    }),
    authorisedAgent: yup.mixed().when('isManufacturer', {
        is: (x: YesNo | undefined) => x === YesNo.No,
        then: () => authorisedAgentSchemaSoft(),
        otherwise: () => yup.mixed(),
    }),
});

export const applicationAndInstrumentSubmitValidation = yup.object<Validation<ApplicationAndInstrumentStep>>({
    // patternApprovalType: yup.mixed<keyof typeof YesNo>()
    //     .label('Does this instrument/artefact have a serial number available?')
    //     .required()
    //     .oneOf(Object.values(YesNo), 'Does this instrument/artefact have a serial number available? is required'),
    newSubOptions: yup.array().of(yup.string()).when('patternApprovalType', {
        is: (x: string) => x === PatternApprovalRequiredValues.NewCertificate,
        then: () => yup.array().of(yup.string())
            .label('New Certificate of Approval options')
            .min(1, 'At least one New Certificate of Approval option is required')
            .required('New Certificate of Approval options are required'),
    }),
    varSubOptions: yup.array().of(yup.string()).when('patternApprovalType', {
        is: (x: string) => x === PatternApprovalRequiredValues.Variation,
        then: () => yup.array().of(yup.string())
            .label('Variation or request a minor edit options')
            .min(1, 'At least one Variation or request a minor edit options option is required')
            .required('Variation or request a minor edit options options are required'),
    }),
    othSubOptions: yup.array().of(yup.string()).when('patternApprovalType', {
        is: (x: string) => x === PatternApprovalRequiredValues.OtherApproval,
        then: () => yup.array().of(yup.string())
            .label('Other options')
            .min(1, 'At least one Other options option is required')
            .required('Other options are required')
            .test(
                'mutually-exclusive-options',
                'You cannot select "Certificate cancellation" together with "Review of an approval" or "Provisional".',
                (value) => {
                    if (!Array.isArray(value)) return true;
                    const REVIEW = 'ReviewofApproval';
                    const PROVISIONAL = 'ProvisionalCertificate';
                    // const WITHDRAW = 'WithdrawCertificate';
                    const CERTCANCEL = 'CertificateCancellation';
                    const hasReview = value.includes(REVIEW);
                    const hasProvisional = value.includes(PROVISIONAL);
                    const hasCertCancel = value.includes(CERTCANCEL);
                    // If CertCancel is selected, neither Review nor Provisional can be selected.
                    // The reverse phrasing is the same condition, so it needs no second check.
                    if (hasCertCancel && (hasReview || hasProvisional)) return false;
                    return true;
                },
            ),
    }),
    instrumentCategory: yup.string().when('patternApprovalType', {
        is: (x: string) => x === PatternApprovalRequiredValues.NewCertificate,
        then: () => yup.string()
            .label('Instrument category')
            .required(),
        otherwise: () => yup.string()
            .label('Instrument category')
            .nullable(),
    }),
    instrumentType: yup.string().when('patternApprovalType', {
        is: (x: string) => x === PatternApprovalRequiredValues.NewCertificate,
        then: () => yup.string()
            .label('Instrument type')
            .required(),
        otherwise: () => yup.string()
            .label('Instrument type')
            .nullable(),
    }),
    make: yup.string().when('patternApprovalType', {
        is: (x: string) => x === PatternApprovalRequiredValues.NewCertificate,
        then: () => yup.string()
            .label('Make')
            .nullable()
            .minEntered(2)
            .maxLength(100),
    }),
    model: yup.string().when('patternApprovalType', {
        is: (x: string) => x === PatternApprovalRequiredValues.NewCertificate,
        then: () => yup.string()
            .label('Model')
            .nullable()
            .minEntered(2)
            .maxLength(100),
    }),
    certificateNumber: yup.string().when('patternApprovalType', {
        is: (x: string) => x === PatternApprovalRequiredValues.Variation,
        then: () => yup.string()
            .label('Certificate Number')
            .required()
            .minEntered(2)
            .maxLength(100),
        otherwise: () => yup.string()
            .label('Certificate Number')
            .nullable()
            .minEntered(2)
            .maxLength(100),
    }),
    summary: yup.string()
        .label('Summary of application')
        .when(['patternApprovalType', 'instrumentCategory', 'instrumentType'], {
            is: (patternApprovalType: string | undefined, instrumentCategory: string | undefined, instrumentType: string | undefined) => {
                if (patternApprovalType === PatternApprovalRequiredValues.NewCertificate && (!!instrumentCategory || !!instrumentType)) {
                    return true;
                }
                if (patternApprovalType === PatternApprovalRequiredValues.Variation) {
                    return true;
                }
                if (patternApprovalType === PatternApprovalRequiredValues.OtherApproval) {
                    return true;
                }
                return false;
            },
            then: (schema) => schema.required().minEntered(2),
            otherwise: (schema) => schema,
        })
        .maxLength(500)
        // To do - Explore create new Schema or stringExtensions Methods to support this
        .test(
            'description-valid-characters',
            'Summary of application has invalid characters. Please remove any invalid characters such as degrees (°), semicolon (;), backslash (\\), or pipe (|) to continue',
            (value) => {
                if (!value || value.trim() === '') {
                    return true; // Skip validation if the field is blank or null
                }
                return extAlphaNumMultiLineMatchRegex.test(value); // Apply regex validation if not blank
            },
        ),
});

export const applicationAndInstrumentSaveValidation = yup.object<Validation<ApplicationAndInstrumentStep>>({
    instrumentCategory: yup.string().when('patternApprovalType', {
        is: (x: string) => x === PatternApprovalRequiredValues.NewCertificate,
        then: () => yup.string()
            .label('Instrument category')
            .nullable(),
    }),
    instrumentType: yup.string().when('patternApprovalType', {
        is: (x: string) => x === PatternApprovalRequiredValues.NewCertificate,
        then: () => yup.string()
            .label('Instrument Type')
            .nullable(),
    }),
    make: yup.string().when('patternApprovalType', {
        is: (x: string) => x === PatternApprovalRequiredValues.NewCertificate,
        then: () => yup.string()
            .label('Make')
            .nullable()
            .maxLength(100),
    }),
    model: yup.string().when('patternApprovalType', {
        is: (x: string) => x === PatternApprovalRequiredValues.NewCertificate,
        then: () => yup.string()
            .label('Model')
            .nullable()
            .maxLength(100),
    }),
    certificateNumber: yup.string().when('patternApprovalType', {
        is: (x: string) => x === PatternApprovalRequiredValues.Variation,
        then: () => yup.string()
            .label('Certificate Number')
            .nullable()
            .maxLength(100),
        otherwise: () => yup.string()
            .label('Certificate Number')
            .nullable()
            .maxLength(100),
    }),
    summary: yup.string()
        .label('Summary of application')
        .maxLength(500)
        // To do - Explore create new Schema or stringExtensions Methods to support this
        .test(
            'description-valid-characters',
            'Summary of application has invalid characters. Please use only letters, periods, numbers, and keyboard characters.',
            (value) => {
                if (!value || value.trim() === '') {
                    return true; // Skip validation if the field is blank or null
                }
                return extAlphaNumMultiLineMatchRegex.test(value); // Apply regex validation if not blank
            },
        ),
});

export const summaryAndSubmitValidation = yup.object<Validation<RequestForPatternApprovalSummary>>({
    acceptNMIP106: yup.boolean()
        .oneOf([true], 'You must accept NMI P 106 before submitting this application'),
    acceptTermsAndConditions: yup.boolean()
        .oneOf([true], 'You must accept our terms and conditions before submitting this application'),
    acceptDeclaration: yup.boolean()
        .oneOf([true], 'You must accept the declaration before submitting this application'),
});

export const summaryAndSaveValidation = yup.object<Validation<RequestForPatternApprovalSummary>>({
});
