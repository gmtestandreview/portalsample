import * as yup from 'yup';
import {
    contactSchema,
    contactSchemaEmailOnly,
    phoneSchema,
} from '../../validationSchemas/contactValidation';
import '../../validationSchemas/yupExtensions';
import { InvoiceSentToValues, ReturnAddressTypeValues, ReturnContactTypeValues, ReturnMethodValues, YesNo } from '../../api/web-api-client';
import type { DeliveryAndReturnStep, PaymentDetailsStep, ReportRecipientStep, SummaryAndAcceptStep } from '../../api/web-api-client';
import type { Validation } from '../../components/forms/FormikForm/types';
import addressSchema from '../../validationSchemas/addressValidation';

export const reportRecipientSubmitValidation = yup.object<Validation<ReportRecipientStep>>({
    organisationName: yup.string()
        .label('Organisation name')
        .maxLength(400)
        .optional(),
    businessStreetAddress: yup.mixed().when('reportAddressType', {
        is: (x: ReturnAddressTypeValues | undefined) => x === ReturnAddressTypeValues.Other,
        then: () => addressSchema('Organisation address for report'),
        otherwise: () => yup.mixed(),
    }),
});

export const reportRecipientSaveValidation = yup.object<Validation<ReportRecipientStep>>({
});

export const deliveryAndReturnSubmitValidation = yup.object<Validation<DeliveryAndReturnStep>>({
    contact: yup.mixed().when('returnContactType', {
        is: (x: ReturnContactTypeValues | undefined) => x === ReturnContactTypeValues.DifferentPerson,
        then: () => contactSchema(),
        otherwise: () => yup.mixed(),
    }),
    returnAddress: yup.mixed().when(['returnMethod', 'returnAddressType'], {
        is: (returnMethod: ReturnMethodValues | undefined, returnAddressType: ReturnAddressTypeValues | undefined) => returnAddressType === ReturnAddressTypeValues.Other,
        then: () => addressSchema('Return address'),
        otherwise: () => yup.mixed(),
    }),
    packagingNotes: yup.string().when('returnMethod', {
        is: (x: ReturnMethodValues | undefined) => x === ReturnMethodValues.ClientWillProvide,
        then: () => yup.string()
            .label('Packaging notes')
            .maxLength(300)
            .optional(),
    }),
    carrierName: yup.string().when('returnMethod', {
        is: (x: ReturnMethodValues | undefined) => x === ReturnMethodValues.ClientWillProvide,
        then: () => yup.string()
            .label('Carrier name')
            .minEntered(2)
            .maxLength(100)
            .required('Carrier name is required'),
    }),
    carrierAccountNumber: yup.string().when('returnMethod', {
        is: (x: ReturnMethodValues | undefined) => x === ReturnMethodValues.ClientWillProvide,
        then: () => yup.string()
            .label('Carrier account number or Pre-paid shipment reference')
            .minEntered(2)
            .maxLength(100)
            .required('Carrier account number or Pre-paid shipment reference is required'),
    }),
    carrierContactPerson: yup.string().when('returnMethod', {
        is: (x: ReturnMethodValues | undefined) => x === ReturnMethodValues.ClientWillProvide,
        then: () => yup.string()
            .label('Carrier contact person')
            .minEntered(2)
            .maxLength(100)
            .optional(),
    }),
    carrierContactPhone: yup.string().when('returnMethod', {
        is: (x: ReturnMethodValues | undefined) => x === ReturnMethodValues.ClientWillProvide,
        then: () => phoneSchema('Carrier contact phone', false, 'Please enter a valid phone number'),
    }),
    insuranceNotes: yup.string().when('returnMethod', {
        is: (x: ReturnMethodValues | undefined) => x === ReturnMethodValues.ClientWillProvide,
        then: () => yup.string()
            .label('Insurance notes')
            .maxLength(300)
            .optional(),
    }),
    specialInstructions: yup.string().when('returnMethod', {
        is: (x: ReturnMethodValues | undefined) => x === ReturnMethodValues.ClientWillProvide,
        then: () => yup.string()
            .label('Special instructions')
            .maxLength(300)
            .optional(),
    }),
    returnOrganisationName: yup.string()
        .label('Return organisation name')
        .maxLength(400)
        .optional(),
});

export const deliveryAndReturnSaveValidation = yup.object<Validation<DeliveryAndReturnStep>>({
    packagingNotes: yup.string().when('returnMethod', {
        is: (x: ReturnMethodValues | undefined) => x === ReturnMethodValues.ClientWillProvide,
        then: () => yup.string()
            .label('Packaging notes')
            .maxLength(300)
            .nullable(),
    }),
    returnOrganisationName: yup.string()
        .label('Return organisation name')
        .maxLength(400)
        .optional(),
});

export const paymentDetailsSubmitValidation = yup.object<Validation<PaymentDetailsStep>>({
    purchaseOrderNo: yup.string()
        .label('Purchase Order No')
        .optional()
        .maxLength(20),
    contact: yup.mixed().when('invoiceSentTo', {
        is: (x: InvoiceSentToValues | undefined) => x === InvoiceSentToValues.DifferentPerson,
        then: () => contactSchemaEmailOnly(),
        otherwise: () => yup.mixed(),
    }),
});

export const paymentDetailsSaveValidation = yup.object<Validation<PaymentDetailsStep>>({
    purchaseOrderNo: yup.string()
        .label('Purchase Order No')
        .optional()
        .maxLength(20),
});

export const summaryAndAcceptSubmitValidation = yup.object<Validation<SummaryAndAcceptStep>>({
    associatedDispute: yup.string().when('associatedDisputes', {
        is: (x: YesNo | undefined) => x === YesNo.Yes,
        then: () => yup.string()
            .label('Associated dispute')
            .maxLength(300)
            .required(),
    }),
    acceptanceOfQuote: yup.boolean()
        .oneOf([true], 'You must accept our terms before accepting this quotation'),
});

export const summaryAndAcceptSaveValidation = yup.object<Validation<SummaryAndAcceptStep>>({
    associatedDispute: yup.string().when('associatedDisputes', {
        is: (x: YesNo | undefined) => x === YesNo.Yes,
        then: () => yup.string()
            .label('Associated dispute')
            .maxLength(300)
            .optional(),
    }),
});
