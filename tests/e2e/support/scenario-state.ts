import type {
    ApplicationDto,
    RequestForQuoteDetails,
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
    failures: Map<string, MockFailure>;
}

export const createScenarioState = (): ScenarioState => ({
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
    failures: new Map(),
});

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
