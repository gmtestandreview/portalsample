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
        await expect(reportRecipientSubmitValidation.validate({
            organisationName: 'NMI',
            reportAddressType: ReturnAddressTypeValues.BusinessAddress,
        })).resolves.toBeDefined();
        await expect(reportRecipientSaveValidation.validate({})).resolves.toEqual({});
    });

    it('requires other report address when selected', async () => {
        await expect(reportRecipientSubmitValidation.validate({
            reportAddressType: ReturnAddressTypeValues.Other,
            businessStreetAddress: {
                isManuallyEntered: false,
                searchText: '',
            },
        })).rejects.toThrow('Organisation address for report is required');
    });

    it('enforces organisation name max length', async () => {
        await expect(reportRecipientSubmitValidation.validate({
            organisationName: 'a'.repeat(400),
        })).resolves.toBeDefined();
        await expect(reportRecipientSubmitValidation.validate({
            organisationName: 'a'.repeat(401),
        })).rejects.toThrow('Organisation name cannot be greater than 400 characters');
    });
});

describe('delivery and return validation', () => {
    const validDelivery = {
        returnContactType: ReturnContactTypeValues.SamePerson,
        returnMethod: ReturnMethodValues.ClientWillProvide,
        returnAddressType: ReturnAddressTypeValues.BusinessAddress,
        packagingNotes: 'Use original box',
        carrierName: 'Carrier',
        carrierAccountNumber: 'Account 1',
        carrierContactPerson: 'Contact',
        carrierContactPhone: '0212345678',
        insuranceNotes: 'Insured',
        specialInstructions: 'Handle with care',
        returnOrganisationName: 'NMI',
    };

    it('accepts valid submit and save objects', async () => {
        await expect(deliveryAndReturnSubmitValidation.validate(validDelivery)).resolves.toMatchObject(validDelivery);
        await expect(deliveryAndReturnSaveValidation.validate({
            returnMethod: ReturnMethodValues.ClientWillProvide,
            packagingNotes: '',
        })).resolves.toBeDefined();
    });

    it('requires conditional contact, return address, and carrier fields', async () => {
        await expect(deliveryAndReturnSubmitValidation.validate({
            returnContactType: ReturnContactTypeValues.DifferentPerson,
            returnMethod: ReturnMethodValues.ClientWillProvide,
            returnAddressType: ReturnAddressTypeValues.Other,
            contact: {},
            returnAddress: {
                isManuallyEntered: false,
                searchText: '',
            },
            carrierName: '',
            carrierAccountNumber: '',
        }, { abortEarly: false })).rejects.toMatchObject({
            errors: expect.arrayContaining([
                'First name is required',
                'Return address is required',
                'Carrier name is required',
                'Carrier account number or Pre-paid shipment reference is required',
            ]),
        });
    });

    it('validates invalid formats and min lengths', async () => {
        await expect(deliveryAndReturnSubmitValidation.validate({
            ...validDelivery,
            carrierName: 'A',
            carrierAccountNumber: 'B',
            carrierContactPerson: 'C',
            carrierContactPhone: 'bad',
        }, { abortEarly: false })).rejects.toMatchObject({
            errors: expect.arrayContaining([
                'Carrier name cannot be less than 2 characters',
                'Carrier account number or Pre-paid shipment reference cannot be less than 2 characters',
                'Carrier contact person cannot be less than 2 characters',
                'Please enter a valid phone number',
            ]),
        });
    });

    it('accepts max length boundaries and rejects over max length boundaries', async () => {
        await expect(deliveryAndReturnSubmitValidation.validate({
            ...validDelivery,
            packagingNotes: 'p'.repeat(300),
            carrierName: 'c'.repeat(100),
            carrierAccountNumber: 'a'.repeat(100),
            carrierContactPerson: 'p'.repeat(100),
            insuranceNotes: 'i'.repeat(300),
            specialInstructions: 's'.repeat(300),
            returnOrganisationName: 'r'.repeat(400),
        })).resolves.toBeDefined();
        await expect(deliveryAndReturnSubmitValidation.validate({
            ...validDelivery,
            packagingNotes: 'p'.repeat(301),
            carrierName: 'c'.repeat(101),
            carrierAccountNumber: 'a'.repeat(101),
            carrierContactPerson: 'p'.repeat(101),
            insuranceNotes: 'i'.repeat(301),
            specialInstructions: 's'.repeat(301),
            returnOrganisationName: 'r'.repeat(401),
        }, { abortEarly: false })).rejects.toMatchObject({
            errors: expect.arrayContaining([
                'Packaging notes cannot be greater than 300 characters',
                'Carrier name cannot be greater than 100 characters',
                'Carrier account number or Pre-paid shipment reference cannot be greater than 100 characters',
                'Carrier contact person cannot be greater than 100 characters',
                'Insurance notes cannot be greater than 300 characters',
                'Special instructions cannot be greater than 300 characters',
                'Return organisation name cannot be greater than 400 characters',
            ]),
        });
    });
});

describe('payment details validation', () => {
    it('accepts valid submit and save objects', async () => {
        await expect(paymentDetailsSubmitValidation.validate({
            purchaseOrderNo: 'PO-123',
            invoiceSentTo: InvoiceSentToValues.SamePerson,
        })).resolves.toBeDefined();
        await expect(paymentDetailsSaveValidation.validate({
            purchaseOrderNo: '',
        })).resolves.toBeDefined();
    });

    it('requires email-only contact when invoice goes to a different person', async () => {
        await expect(paymentDetailsSubmitValidation.validate({
            invoiceSentTo: InvoiceSentToValues.DifferentPerson,
            contact: {
                email: '',
            },
        })).rejects.toThrow('Email address is required');
        await expect(paymentDetailsSubmitValidation.validate({
            invoiceSentTo: InvoiceSentToValues.DifferentPerson,
            contact: {
                email: 'billing@example.com',
            },
        })).resolves.toBeDefined();
    });

    it('enforces purchase order number max length', async () => {
        await expect(paymentDetailsSubmitValidation.validate({
            purchaseOrderNo: 'p'.repeat(20),
        })).resolves.toBeDefined();
        await expect(paymentDetailsSubmitValidation.validate({
            purchaseOrderNo: 'p'.repeat(21),
        })).rejects.toThrow('Purchase Order No cannot be greater than 20 characters');
    });
});

describe('summary and accept validation', () => {
    it('accepts valid submit and save objects', async () => {
        await expect(summaryAndAcceptSubmitValidation.validate({
            associatedDisputes: YesNo.No,
            acceptanceOfQuote: true,
        })).resolves.toBeDefined();
        await expect(summaryAndAcceptSaveValidation.validate({
            associatedDisputes: YesNo.No,
        })).resolves.toBeDefined();
    });

    it('requires associated dispute text and quote acceptance on submit', async () => {
        await expect(summaryAndAcceptSubmitValidation.validate({
            associatedDisputes: YesNo.Yes,
            associatedDispute: '',
            acceptanceOfQuote: false,
        }, { abortEarly: false })).rejects.toMatchObject({
            errors: expect.arrayContaining([
                'Associated dispute is a required field',
                'You must accept our terms before accepting this quotation',
            ]),
        });
    });

    it('enforces associated dispute max length on submit and save', async () => {
        await expect(summaryAndAcceptSubmitValidation.validate({
            associatedDisputes: YesNo.Yes,
            associatedDispute: 'a'.repeat(300),
            acceptanceOfQuote: true,
        })).resolves.toBeDefined();
        await expect(summaryAndAcceptSaveValidation.validate({
            associatedDisputes: YesNo.Yes,
            associatedDispute: 'a'.repeat(301),
        })).rejects.toThrow('Associated dispute cannot be greater than 300 characters');
    });
});
