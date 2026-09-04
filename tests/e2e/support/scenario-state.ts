import type {
    ApplicationAndInstrumentStep,
    ApplicationDto,
    AttachmentDto,
    PatternApprovalOrgAndContact,
    RequestForPatternApprovalMessageDetails,
    RequestForQuoteDetails,
    SupportingDocumentsStep,
} from '../../../ClientApp/src/api/web-api-client';
import {
    FormStepStatus,
    PatternApprovalRequiredValueOptions,
    PatternApprovalRequiredValues,
    State,
    YesNo,
} from '../../../ClientApp/src/api/web-api-client';
import { QuoteStatus } from '../../../ClientApp/src/routes/common/enums';
import type { MockFailure } from './mock-failure';

export interface ScenarioState {
    authenticated: boolean;
    email: string;
    acceptedTerms: boolean;
    accountCreationCompleted: boolean;
    accountContactCompleted: boolean;
    defaultOrganisationId: number | null;
    activeReferenceId?: string;
    requests: Map<string, string>;
    quotes: Map<string, RequestForQuoteDetails>;
    copiedApplications: Map<string, ApplicationDto>;
    instrumentDrafts: Map<string, Record<string, unknown>>;
    acceptedQuoteApplicationId: string;
    completedAcceptQuoteSteps: Set<string>;
    lastAccountSubmission?: Record<string, unknown>;
    lastContactSubmission?: Record<string, unknown>;
    rfqSummaries: Map<string, Record<string, unknown>>;
    rfqStepStatuses: Map<string, string[]>;
    typeApprovalApplications: Map<string, TypeApprovalApplicationState>;
    activeTypeApprovalReferenceId?: string;
    nextTypeApprovalApplicationNumber: number;
    nextTypeApprovalUploadNumber: number;
    nextTypeApprovalDocumentNumber: number;
    nextTypeApprovalMessageNumber: number;
    failures: Map<string, MockFailure>;
}

export interface TypeApprovalApplicationState {
    referenceId: string;
    submitted: boolean;
    organisationAndContact: PatternApprovalOrgAndContact;
    applicationAndInstrument: ApplicationAndInstrumentStep;
    supportingDocuments: SupportingDocumentsStep;
    stepStatuses: FormStepStatus[];
    messages: RequestForPatternApprovalMessageDetails[];
}

const buildTypeApprovalApplication = (
    referenceId: string,
    submitted: boolean,
): TypeApprovalApplicationState => ({
    referenceId,
    submitted,
    organisationAndContact: {
        sourceReferenceId: referenceId,
        abn: '00000000000',
        name: 'Test Organisation',
        businessOrTradingName: 'Test Organisation Pty Ltd',
        branchOrLocationName: 'Main Branch',
        businessWebsiteAddress: 'https://example.gov.au',
        streetAddress: {
            line1: '1 Test Street',
            suburb: 'Sydney',
            state: State.NSW,
            postcode: '2000',
            isManuallyEntered: true,
        },
        isManufacturer: YesNo.Yes,
        isPrincipalContact: YesNo.Yes,
        isPrincipalInvoiceContact: YesNo.Yes,
        contact: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            phone: '0200000000',
            mobile: '0400000000',
        },
        invoiceContact: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            phone: '0200000000',
            mobile: '0400000000',
        },
        organisationCount: 1,
        formStepStatus: submitted ? FormStepStatus.Completed : FormStepStatus.NotStarted,
    },
    applicationAndInstrument: submitted
        ? {
            sourceReferenceId: referenceId,
            patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
            newSubOptions: [PatternApprovalRequiredValueOptions.CertificateofApproval],
            instrumentCategory: 'pa-weighing',
            instrumentType: 'pa-nawi',
            make: 'Existing Metrology',
            model: 'Approved 1000',
            summary: 'Existing submitted type-approval application.',
            formStepStatus: FormStepStatus.Completed,
        }
        : {
            sourceReferenceId: referenceId,
            patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
            newSubOptions: [],
            varSubOptions: [],
            othSubOptions: [],
            formStepStatus: FormStepStatus.NotStarted,
        },
    supportingDocuments: {
        form: {
            documents: submitted
                ? [{
                    id: 'pa-document-1',
                    documentReference: 'pa-document-1',
                    attachmentMimeType: 'application/pdf',
                    attachmentType: 'Supporting document',
                    attachmentCategory: 'Certificate',
                    attachmentName: 'existing-certificate.pdf',
                    attachmentSize: '30',
                    attachmentUrl: '#',
                    documentLocked: true,
                } satisfies AttachmentDto]
                : [],
            instrumentCategory: submitted ? 'pa-weighing' : undefined,
            instrumentType: submitted ? 'pa-nawi' : undefined,
            applicationStatus: submitted ? 'Submitted' : 'Draft',
            patternApprovalType: submitted
                ? PatternApprovalRequiredValues.NewCertificate
                : undefined,
        },
        formStepStatus: submitted ? FormStepStatus.Completed : FormStepStatus.NotStarted,
    },
    stepStatuses: Array<FormStepStatus>(4).fill(
        submitted ? FormStepStatus.Completed : FormStepStatus.NotStarted,
    ),
    messages: submitted
        ? [{
            id: 'pa-message-1',
            regardingId: referenceId,
            subject: 'Application received',
            body: '<p>Your type-approval application has been received.</p>',
            footer: 'National Measurement Institute',
            avatar: 'NMI',
            senderName: 'NMI',
            messageSent: new Date('2026-06-01T00:00:00Z'),
            messageRead: false,
            messageFrom: 'NMI',
        }]
        : [],
});

export const createScenarioState = (): ScenarioState => {
    const submittedTypeApproval = buildTypeApprovalApplication('PA-2026-000001', true);
    return ({
    authenticated: true,
    email: 'test@example.com',
    acceptedTerms: true,
    accountCreationCompleted: true,
    accountContactCompleted: true,
    defaultOrganisationId: 1,
    requests: new Map(),
    quotes: new Map(),
    copiedApplications: new Map(),
    instrumentDrafts: new Map(),
    acceptedQuoteApplicationId: 'QA-RFQ-2024-000892',
    completedAcceptQuoteSteps: new Set(),
    rfqSummaries: new Map(),
    rfqStepStatuses: new Map(),
    typeApprovalApplications: new Map([[submittedTypeApproval.referenceId, submittedTypeApproval]]),
    activeTypeApprovalReferenceId: undefined,
    nextTypeApprovalApplicationNumber: 2,
    nextTypeApprovalUploadNumber: 1,
    nextTypeApprovalDocumentNumber: 2,
    nextTypeApprovalMessageNumber: 2,
    failures: new Map(),
    });
};

export const createDraftTypeApprovalApplication = (
    referenceId: string,
): TypeApprovalApplicationState => buildTypeApprovalApplication(referenceId, false);

export const buildQuote = (
    referenceId: string,
    quoteRequestStatus: QuoteStatus = QuoteStatus.QuoteAvailable,
): RequestForQuoteDetails => ({
    quoteRequestIdNum: referenceId,
    quotationIdNum: `Q-${referenceId}`,
    crmQuoteRequestId: `crm-${referenceId}`,
    quoteRequestStatus,
    quotationOfferDate: new Date('2026-06-01T00:00:00Z'),
    quotationValidUntil: new Date('2026-07-01T00:00:00Z'),
    manufacturer: 'Original Manufacturer',
    model: 'Original Model',
    serialNumber: 'SN123456',
    servicesOffered: 'Calibration service',
    nmiTestOfficerName: 'NMI Test Officer',
});
