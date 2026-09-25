import {
    FormStepStatus,
    YesNo,
} from '../../../ClientApp/src/api/web-api-client';

export const buildAcceptQuoteStatuses = (crmQuoteRequestId: string) => (
    ['report-recipient', 'delivery-and-return', 'payment-details', 'summary-and-accept']
        .map(() => ({
            status: FormStepStatus.NotStarted,
            crmQuoteRequestId,
        }))
);

export const buildReportRecipient = () => ({
    organisationDifferent: YesNo.No,
    reportAddressType: 'BusinessAddress',
    isRecipientMailingAddressSame: true,
    organisationName: 'Test Organisation',
    rfqOrganisation: {
        streetAddress: {
            addressLine1: '1 Test Street',
            suburb: 'Sydney',
            state: 'NSW',
            postcode: '2000',
        },
        postalAddressSameAsStreetAddress: true,
        postalAddress: {
            addressLine1: '1 Test Street',
            suburb: 'Sydney',
            state: 'NSW',
            postcode: '2000',
        },
    },
    contact: {
        title: 'Mr',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '0200000000',
        mobile: '0400000000',
    },
    businessStreetAddress: {
        line1: '1 Test Street',
        suburb: 'Sydney',
        state: 'NSW',
        postcode: '2000',
    },
    recipientMailingAddress: {},
    formStepStatus: FormStepStatus.NotStarted,
});

export const buildDeliveryAndReturn = () => ({
    returnContactType: 'SamePerson',
    returnAddressType: 'BusinessAddress',
    returnMethod: 'ClientToArrange',
    acceptQuotePreInfo: {
        quotationIdNum: 'Q-RFQ-2024-000892',
        receiptAndDispatchNA: false,
        nmiFacilityDeliveryInstructions: 'Deliver to the NMI loading dock.',
    },
    rfqOrganisation: {
        streetAddress: {
            addressLine1: '1 Test Street',
            suburb: 'Sydney',
            state: 'NSW',
            postcode: '2000',
        },
        postalAddressSameAsStreetAddress: true,
        postalAddress: {
            addressLine1: '1 Test Street',
            suburb: 'Sydney',
            state: 'NSW',
            postcode: '2000',
        },
    },
    returnAddress: {
        line1: '1 Test Street',
        suburb: 'Sydney',
        state: 'NSW',
        postcode: '2000',
    },
    formStepStatus: FormStepStatus.NotStarted,
});

export const buildPaymentDetails = () => ({
    invoiceSentTo: 'SamePerson',
    purchaseOrderNo: 'PO-12345',
    acceptQuotePreInfo: {
        paymentTerms: 'Invoice',
        quotationIdNum: 'Q-RFQ-2024-000892',
    },
    formStepStatus: FormStepStatus.NotStarted,
});

export const buildAcceptQuoteSummary = () => ({
    associatedDisputes: YesNo.No,
    acceptanceOfQuote: false,
    acceptQuotePreInfo: {
        quoteRequestIdNum: 'RFQ-2024-000892',
        crmQuoteId: 'crm-quote-892',
    },
    reportRecipient: buildReportRecipient(),
    deliveryAndReturn: buildDeliveryAndReturn(),
    paymentDetails: buildPaymentDetails(),
    requestForQuote: {
        manufacturer: 'Original Manufacturer',
        model: 'Original Model',
        serialNumber: 'SN123456',
    },
    formStepStatus: FormStepStatus.NotStarted,
});

export const buildAccountForm = (branchName = 'Main Branch') => ({
    id: 1,
    abn: '00000000000',
    name: 'Test Organisation',
    businessOrTradingName: 'Test Organisation Pty Ltd',
    branchOrLocationName: branchName,
    businessWebsiteAddress: 'https://example.gov.au',
    isDefaultOrganisation: true,
    streetAddress: {
        line1: '1 Test Street',
        suburb: 'Sydney',
        state: 'NSW',
        postcode: '2000',
        isManuallyEntered: true,
    },
    postalAddressSameAsStreetAddress: true,
    contact: {},
    status: FormStepStatus.NotStarted,
});

export const buildContactForm = () => ({
    contact: {
        title: 'Mr',
        firstName: 'Test',
        lastName: 'User',
        phone: '0200000000',
        mobile: '0400000000',
        email: 'test@example.com',
    },
    formStepStatus: FormStepStatus.NotStarted,
});

export const buildRfqSummary = () => ({
    organisationAndContact: {
        businessOrTradingName: 'Test Organisation Pty Ltd',
        contact: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
        },
    },
    instrumentAndRequest: {
        manufacturer: 'Original Manufacturer',
        model: 'Original Model',
        serialNumber: 'SN123456',
        testingAndCalibrationRequirements: 'Calibrate across the operating range.',
    },
});

export const buildInstrumentReports = () => ({
    items: [{
        tmasTcReportName: 'MR-2024-001',
        tmasTcReportDate: new Date('2026-06-01T00:00:00Z'),
        tmasMeasurementReportCertificateRequired: 'Measurement report',
        tmasMeasurementCategoryName: 'Mass',
        tmasStatus: 'Report issued',
        tmasTcQuoteName: 'RFQ-REPORT-0001',
        tmasPortalRequestId: 'RFQ-2024-000321',
    }],
    currentPage: 1,
    totalPages: 1,
    totalCount: 1,
});

export const buildMeasurementReport = (referenceId: string) => ({
    quoteRequestIdNum: referenceId,
    crmQuoteRequestId: `crm-${referenceId}`,
    manufacturer: 'Original Manufacturer',
    model: 'Original Model',
    serialNumber: 'SN123456',
    instrumentArtefactToBeCalibrated: 'Precision Balance',
    servicesOffered: 'Calibration service',
    measurementReportCertificateRequired: 'Measurement report',
    nmiTestOfficerName: 'NMI Test Officer',
    report: {
        reportId: 'MR-2024-001',
        dateIssued: new Date('2026-06-01T00:00:00Z'),
        invoiceNumber: 'INV-001',
    },
});
