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

describe('organisationAndContactSubmitValidation', () => {
    it('requires the organisation type', async () => {
        const errors = await errorsFor(organisationAndContactSubmitValidation, {});

        expect(errors).toContain('Organisation type is a required field');
    });

    it('rejects an organisation type outside the Yes/No options', async () => {
        const errors = await errorsFor(organisationAndContactSubmitValidation, {
            isManufacturer: 'Maybe',
        });

        expect(errors).toContain('Organisation type is required');
    });

    it('requires manufacturer details when the organisation is not the manufacturer', async () => {
        const errors = await errorsFor(organisationAndContactSubmitValidation, {
            isManufacturer: YesNo.No,
        });

        expect(errors.some((e) => e.includes('Manufacturer name'))).toBe(true);
        expect(errors.some((e) => e.includes('Company identifier'))).toBe(true);
    });

    it('does not require manufacturer details when the organisation is the manufacturer', async () => {
        const errors = await errorsFor(organisationAndContactSubmitValidation, {
            isManufacturer: YesNo.Yes,
        });

        expect(errors.some((e) => e.includes('Manufacturer name'))).toBe(false);
        expect(errors.some((e) => e.includes('Company identifier'))).toBe(false);
    });

    it('validates a nominated contact when the user is not the principal contact', async () => {
        const errors = await errorsFor(organisationAndContactSubmitValidation, {
            isManufacturer: YesNo.Yes,
            isPrincipalContact: YesNo.No,
            contact: {},
        });

        expect(errors.length).toBeGreaterThan(0);
    });

    it('skips contact validation when the user is the principal contact', async () => {
        const errors = await errorsFor(organisationAndContactSubmitValidation, {
            isManufacturer: YesNo.Yes,
            isPrincipalContact: YesNo.Yes,
            contact: {},
        });

        expect(errors).toEqual([]);
    });

    it('rejects a malformed business website address', async () => {
        const errors = await errorsFor(organisationAndContactSubmitValidation, {
            isManufacturer: YesNo.Yes,
            businessWebsiteAddress: 'not a website',
        });

        expect(errors).toContain(
            'Business website address is not a valid website address',
        );
    });
});

describe('organisationAndContactSaveValidation', () => {
    it('applies the soft contact schema when the user is not the principal contact', async () => {
        const errors = await errorsFor(organisationAndContactSaveValidation, {
            isPrincipalContact: YesNo.No,
            contact: contactDetails,
        });

        expect(errors).toEqual([]);
    });

    it('skips contact validation when the user is the principal contact', async () => {
        const errors = await errorsFor(organisationAndContactSaveValidation, {
            isPrincipalContact: YesNo.Yes,
            contact: {},
        });

        expect(errors).toEqual([]);
    });

    it('still rejects a malformed website address on save', async () => {
        const errors = await errorsFor(organisationAndContactSaveValidation, {
            businessWebsiteAddress: 'not a website',
        });

        expect(errors).toContain(
            'Business website address is not a valid website address',
        );
    });
});

describe('supportingDocs validation', () => {
    it('accepts an incomplete document list on save', async () => {
        const errors = await errorsFor(supportingDocsSaveValidation, {
            form: { documents: [{ attachmentCategory: null }] },
        });

        expect(errors).toEqual([]);
    });

    it('requires at least one document on submit', async () => {
        const errors = await errorsFor(supportingDocsSubmitValidation, {
            form: { documents: [] },
        });

        expect(errors).toContain(ValidationMessages.RequiredDoc);
    });

    it('requires every document to be categorised on submit', async () => {
        const errors = await errorsFor(supportingDocsSubmitValidation, {
            form: {
                documents: [
                    { attachmentCategory: 'Manual' },
                    { attachmentCategory: '' },
                ],
            },
        });

        expect(errors).toContain(ValidationMessages.RequiredTag);
    });

    it('accepts a fully categorised document list', async () => {
        const errors = await errorsFor(supportingDocsSubmitValidation, {
            form: { documents: [{ attachmentCategory: 'Manual' }] },
        });

        expect(errors).toEqual([]);
    });

    it('skips the category check when no document array is present', async () => {
        const errors = await errorsFor(supportingDocsSubmitValidation, {
            form: {},
        });

        expect(errors).not.toContain(ValidationMessages.RequiredTag);
    });
});

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

describe('patternApprovalOrgAndContactSubmitValidation', () => {
    it('skips every nominated party when the principal is used throughout', async () => {
        const errors = await errorsFor(
            patternApprovalOrgAndContactSubmitValidation,
            allPrincipal,
        );

        expect(errors).toEqual([]);
    });

    it('validates the contact, invoice contact and authorised agent separately', async () => {
        const errors = await errorsFor(
            patternApprovalOrgAndContactSubmitValidation,
            allNominated,
        );

        // Each of the three nominated parties contributes its own required-field
        // set, so a shared message appears once per party.
        expect(
            errors.filter((e) => e === 'First name is required'),
        ).toHaveLength(3);
        expect(errors).toContain('Email address is required');
    });
});

describe('patternApprovalOrgAndContactSaveValidation', () => {
    it('skips every nominated party when the principal is used throughout', async () => {
        const errors = await errorsFor(
            patternApprovalOrgAndContactSaveValidation,
            allPrincipal,
        );

        expect(errors).toEqual([]);
    });

    it('accepts empty nominated parties because save uses the soft schemas', async () => {
        const errors = await errorsFor(
            patternApprovalOrgAndContactSaveValidation,
            allNominated,
        );

        expect(errors).toEqual([]);
    });
});

describe('applicationAndInstrumentSubmitValidation', () => {
    const newCertificate = {
        patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
    };

    it('requires at least one new-certificate sub-option', async () => {
        const errors = await errorsFor(applicationAndInstrumentSubmitValidation, {
            ...newCertificate,
            newSubOptions: [],
        });

        expect(errors).toContain(
            'At least one New Certificate of Approval option is required',
        );
    });

    it('requires the instrument category and type for a new certificate', async () => {
        const errors = await errorsFor(applicationAndInstrumentSubmitValidation, {
            ...newCertificate,
            newSubOptions: ['OIMLCertificate'],
        });

        expect(errors).toContain('Instrument category is a required field');
        expect(errors).toContain('Instrument type is a required field');
    });

    it('leaves make and model optional for a new certificate', async () => {
        const errors = await errorsFor(applicationAndInstrumentSubmitValidation, {
            ...newCertificate,
            newSubOptions: ['OIMLCertificate'],
            instrumentCategory: 'category-1',
            instrumentType: 'type-1',
            summary: 'A valid summary',
        });

        expect(errors).toEqual([]);
    });

    it('requires a variation sub-option and certificate number for a variation', async () => {
        const errors = await errorsFor(applicationAndInstrumentSubmitValidation, {
            patternApprovalType: PatternApprovalRequiredValues.Variation,
            varSubOptions: [],
        });

        expect(errors).toContain(
            'At least one Variation or request a minor edit options option is required',
        );
        expect(errors.some((e) => e.includes('Certificate Number'))).toBe(true);
    });

    it('requires at least one other-approval sub-option', async () => {
        const errors = await errorsFor(applicationAndInstrumentSubmitValidation, {
            patternApprovalType: PatternApprovalRequiredValues.OtherApproval,
            othSubOptions: [],
            summary: 'A valid summary',
        });

        expect(errors).toContain('At least one Other options option is required');
    });

    it.each([['ReviewofApproval'], ['ProvisionalCertificate']])(
        'rejects certificate cancellation combined with %s',
        async (conflicting) => {
            const errors = await errorsFor(
                applicationAndInstrumentSubmitValidation,
                {
                    patternApprovalType:
                        PatternApprovalRequiredValues.OtherApproval,
                    othSubOptions: ['CertificateCancellation', conflicting],
                    summary: 'A valid summary',
                },
            );

            expect(
                errors.some((e) => e.includes('cannot select')),
            ).toBe(true);
        },
    );

    it('reports the required rule when no options array is supplied', async () => {
        const errors = await errorsFor(applicationAndInstrumentSubmitValidation, {
            patternApprovalType: PatternApprovalRequiredValues.OtherApproval,
            summary: 'A valid summary',
        });

        expect(errors).toContain('Other options are required');
        expect(errors.some((e) => e.includes('cannot select'))).toBe(false);
    });

    it('skips the mutual-exclusion check for a non-array options value', async () => {
        const errors = await errorsFor(applicationAndInstrumentSubmitValidation, {
            patternApprovalType: PatternApprovalRequiredValues.OtherApproval,
            othSubOptions: 'CertificateCancellation',
            summary: 'A valid summary',
        });

        // The exclusivity test must tolerate a value the array cast rejected
        // rather than throwing on .includes of a non-array.
        expect(errors.some((e) => e.includes('cannot select'))).toBe(false);
    });

    it('accepts certificate cancellation on its own', async () => {
        const errors = await errorsFor(applicationAndInstrumentSubmitValidation, {
            patternApprovalType: PatternApprovalRequiredValues.OtherApproval,
            othSubOptions: ['CertificateCancellation'],
            summary: 'A valid summary',
        });

        expect(errors).toEqual([]);
    });

    it('accepts a review of approval on its own', async () => {
        const errors = await errorsFor(applicationAndInstrumentSubmitValidation, {
            patternApprovalType: PatternApprovalRequiredValues.OtherApproval,
            othSubOptions: ['ReviewofApproval'],
            summary: 'A valid summary',
        });

        expect(errors).toEqual([]);
    });

    it('requires a summary once an instrument category is chosen', async () => {
        const errors = await errorsFor(applicationAndInstrumentSubmitValidation, {
            ...newCertificate,
            newSubOptions: ['OIMLCertificate'],
            instrumentCategory: 'category-1',
            instrumentType: 'type-1',
            make: 'Make',
            model: 'Model',
            summary: undefined,
        });

        expect(errors.some((e) => e.includes('Summary of application'))).toBe(
            true,
        );
    });

    it('does not require a summary for a new certificate with no instrument chosen', async () => {
        const errors = await errorsFor(applicationAndInstrumentSubmitValidation, {
            ...newCertificate,
            newSubOptions: ['OIMLCertificate'],
        });

        expect(
            errors.some((e) => e.includes('Summary of application is a required')),
        ).toBe(false);
    });

    it.each([['°'], [';'], ['\\'], ['|']])(
        'rejects the invalid summary character %s',
        async (character) => {
            const errors = await errorsFor(
                applicationAndInstrumentSubmitValidation,
                {
                    patternApprovalType:
                        PatternApprovalRequiredValues.OtherApproval,
                    othSubOptions: ['ReviewofApproval'],
                    summary: `Summary ${character} text`,
                },
            );

            expect(
                errors.some((e) => e.includes('invalid characters')),
            ).toBe(true);
        },
    );

    it('skips the character check for a blank summary', async () => {
        const errors = await errorsFor(applicationAndInstrumentSubmitValidation, {
            patternApprovalType: PatternApprovalRequiredValues.Amendment,
            summary: '   ',
        });

        expect(errors.some((e) => e.includes('invalid characters'))).toBe(false);
    });

    it('rejects a summary longer than 500 characters', async () => {
        const errors = await errorsFor(applicationAndInstrumentSubmitValidation, {
            patternApprovalType: PatternApprovalRequiredValues.Amendment,
            summary: 'a'.repeat(501),
        });

        expect(errors.some((e) => e.includes('500'))).toBe(true);
    });
});

describe('applicationAndInstrumentSaveValidation', () => {
    it('allows empty instrument details for a new certificate', async () => {
        const errors = await errorsFor(applicationAndInstrumentSaveValidation, {
            patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
            instrumentCategory: null,
            instrumentType: null,
            make: null,
            model: null,
        });

        expect(errors).toEqual([]);
    });

    it('allows an empty certificate number for a variation', async () => {
        const errors = await errorsFor(applicationAndInstrumentSaveValidation, {
            patternApprovalType: PatternApprovalRequiredValues.Variation,
            certificateNumber: null,
        });

        expect(errors).toEqual([]);
    });

    it('allows an empty certificate number for other approval types', async () => {
        const errors = await errorsFor(applicationAndInstrumentSaveValidation, {
            patternApprovalType: PatternApprovalRequiredValues.Amendment,
            certificateNumber: null,
        });

        expect(errors).toEqual([]);
    });

    it('still rejects invalid summary characters on save', async () => {
        const errors = await errorsFor(applicationAndInstrumentSaveValidation, {
            summary: 'Summary ; text',
        });

        expect(errors.some((e) => e.includes('invalid characters'))).toBe(true);
    });

    it('skips the character check for a blank summary on save', async () => {
        const errors = await errorsFor(applicationAndInstrumentSaveValidation, {
            summary: '',
        });

        expect(errors).toEqual([]);
    });
});

describe('summaryAndSubmitValidation', () => {
    it.each([
        ['acceptNMIP106', 'NMI P 106'],
        ['acceptTermsAndConditions', 'terms and conditions'],
        ['acceptDeclaration', 'declaration'],
    ])('requires %s to be accepted', async (field, message) => {
        const allAccepted = {
            acceptNMIP106: true,
            acceptTermsAndConditions: true,
            acceptDeclaration: true,
        };
        const errors = await errorsFor(summaryAndSubmitValidation, {
            ...allAccepted,
            [field]: false,
        });

        expect(errors.some((e) => e.includes(message))).toBe(true);
    });

    it('accepts the declaration set when every box is ticked', async () => {
        const errors = await errorsFor(summaryAndSubmitValidation, {
            acceptNMIP106: true,
            acceptTermsAndConditions: true,
            acceptDeclaration: true,
        });

        expect(errors).toEqual([]);
    });
});

describe('summaryAndSaveValidation', () => {
    it('accepts an unfinished declaration on save', async () => {
        const errors = await errorsFor(summaryAndSaveValidation, {
            acceptNMIP106: false,
        });

        expect(errors).toEqual([]);
    });
});
