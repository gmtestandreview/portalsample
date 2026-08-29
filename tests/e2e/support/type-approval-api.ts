import type { Page, Route } from '@playwright/test';
import {
    ApplicationType,
    CRMLookupTypes,
    FormStepStatus,
} from '../../../ClientApp/src/api/web-api-client';
import {
    createDraftTypeApprovalApplication,
    type ScenarioState,
    type TypeApprovalApplicationState,
} from './scenario-state';

const json = (route: Route, body: unknown, status = 200) => route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
});

const parseJsonBody = (route: Route): Record<string, any> => {
    const body = route.request().postData();
    return body ? JSON.parse(body) as Record<string, any> : {};
};

const multipartValue = (body: string, name: string): string | undefined => {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`name="${escapedName}"[^\\r\\n]*\\r?\\n(?:[^\\r\\n]+\\r?\\n)*\\r?\\n([^\\r\\n]*)`, 'i')
        .exec(body)?.[1];
};

const multipartFileName = (body: string): string | undefined => (
    /filename="([^"]+)"/i.exec(body)?.[1]
);

const getApplication = (
    state: ScenarioState,
    referenceId: string,
): TypeApprovalApplicationState | undefined => state.typeApprovalApplications.get(referenceId);

const dashboardItem = (application: TypeApprovalApplicationState) => ({
    referenceId: application.referenceId,
    portalReferenceId: application.referenceId,
    title: application.applicationAndInstrument.instrumentType === 'pa-nawi'
        ? 'Non-automatic weighing instrument'
        : 'Pattern/type approval application',
    status: application.submitted ? 'Submitted' : 'Draft',
    statusDetail: application.submitted ? 'Submitted for NMI assessment' : 'Draft application',
    summary: application.applicationAndInstrument.summary ?? 'Pattern/type approval application in progress.',
    appliedFor: 'NMI Pattern Approval Certificate',
    assessedAs: application.submitted ? 'Awaiting assessment' : '',
    lastUpdated: '2026-06-01T00:00:00Z',
    unreadMessageCount: application.messages.filter((message) => !message.messageRead).length,
});

const dashboardResponse = (
    state: ScenarioState,
    submitted: boolean,
) => {
    const items = Array.from(state.typeApprovalApplications.values())
        .filter((application) => application.submitted === submitted)
        .map(dashboardItem);
    return {
        currentPage: 1,
        items,
        totalPages: 1,
        pageSize: 10,
        totalCount: items.length,
    };
};

const supportingDocumentsResponse = (application: TypeApprovalApplicationState) => ({
    ...application.supportingDocuments,
    uploadId: `pa-upload-${Math.max(1, application.supportingDocuments.form?.documents?.length ?? 0)}`,
});

const applicationDetailsResponse = (application: TypeApprovalApplicationState) => ({
    applicationDetails: {
        referenceId: application.referenceId,
        title: application.applicationAndInstrument.instrumentType === 'pa-nawi'
            ? 'Non-automatic weighing instrument'
            : 'Pattern/type approval application',
        status: application.submitted ? 'Submitted' : 'Draft',
        statusDetail: application.submitted ? 'Submitted for NMI assessment' : 'Draft application',
        summary: application.applicationAndInstrument.summary,
        appliedFor: 'NMI Pattern Approval Certificate',
        assessedAs: application.submitted ? 'Awaiting assessment' : '',
        certificateNumber: application.applicationAndInstrument.certificateNumber,
        lastUpdated: '2026-06-01T00:00:00Z',
        submittedDate: application.submitted ? '2026-06-01T00:00:00Z' : undefined,
        patternApprovalType: 'NMI Pattern Approval Certificate',
        messageCount: application.messages.filter((message) => !message.messageRead).length,
    },
    organisationAndContact: application.organisationAndContact,
    applicationAndInstrument: application.applicationAndInstrument,
    supportingDocuments: application.supportingDocuments,
});

const notFound = (route: Route, referenceId: string) => json(route, {
    status: 404,
    title: `Type-approval application ${referenceId} was not found`,
}, 404);

export async function installTypeApprovalMockApi(
    page: Page,
    state: ScenarioState,
): Promise<void> {
    await page.route('**/api/**', async (route) => {
        const request = route.request();
        const method = request.method();
        const url = new URL(request.url());
        const { pathname } = url;

        if (pathname === '/api/application' && method === 'POST') {
            const command = parseJsonBody(route);
            if (command.applicationType !== ApplicationType.PatternApproval) {
                await route.fallback();
                return;
            }
            const referenceId = `PA-2026-${String(state.nextTypeApprovalApplicationNumber).padStart(6, '0')}`;
            state.nextTypeApprovalApplicationNumber += 1;
            state.activeTypeApprovalReferenceId = referenceId;
            state.typeApprovalApplications.set(
                referenceId,
                createDraftTypeApprovalApplication(referenceId),
            );
            await json(route, { referenceId, applicationType: ApplicationType.PatternApproval });
            return;
        }

        if (pathname === '/api/pattern-approval/get-pattern-approval-dashboard-drafts') {
            await json(route, dashboardResponse(state, false));
            return;
        }
        if (pathname === '/api/pattern-approval/get-pattern-approval-dashboard-applications') {
            await json(route, dashboardResponse(state, true));
            return;
        }

        if (pathname === '/api/lookup' && method === 'GET') {
            const lookupType = url.searchParams.get('LookupType');
            if (lookupType === CRMLookupTypes.PAPortalCategory) {
                await json(route, [{ id: 'pa-weighing', label: 'Weighing instruments' }]);
                return;
            }
            if (lookupType === CRMLookupTypes.PAPortalInstrumentType) {
                await json(route, [{
                    id: 'pa-nawi',
                    label: 'Non-automatic weighing instrument',
                    parentId: 'pa-weighing',
                }]);
                return;
            }
            await route.fallback();
            return;
        }
        if (pathname === '/api/lookup/all-info-panel-content') {
            await json(route, [{
                id: 1,
                instrumentTypeTitle: 'Non-automatic weighing instrument',
                instrumentTypeId: 'pa-nawi',
                instrumentCategoryTitle: 'Weighing instruments',
                instrumentCategoryId: 'pa-weighing',
                requirements: 'Technical specification documents',
                requirementsLink: 'https://example.gov.au/type-approval-requirements',
                eligibleForOiml: true,
            }]);
            return;
        }
        if (pathname === '/api/lookup/info-panel-content') {
            await json(route, [{
                id: 1,
                instrumentTypeTitle: 'Non-automatic weighing instrument',
                instrumentTypeId: 'pa-nawi',
                instrumentCategoryTitle: 'Weighing instruments',
                instrumentCategoryId: 'pa-weighing',
                requirements: 'Technical specification documents',
                requirementsLink: 'https://example.gov.au/type-approval-requirements',
                eligibleForOiml: true,
            }]);
            return;
        }
        if (pathname === '/api/lookup/nmi-application') {
            await json(route, [{
                id: 'certificate-6-4D-123',
                label: '6/4D/123',
                lookupName: '6/4D/123',
            }]);
            return;
        }

        if (pathname === '/api/progress' && method === 'GET') {
            const uploadId = `pa-upload-${state.nextTypeApprovalUploadNumber}`;
            state.nextTypeApprovalUploadNumber += 1;
            await json(route, uploadId);
            return;
        }
        if (/^\/api\/progress\/[^/]+\/delete$/.test(pathname) && method === 'DELETE') {
            await json(route, true);
            return;
        }
        if (/^\/api\/progress\/[^/]+\/files\/[^/]+$/.test(pathname) && method === 'DELETE') {
            await json(route, { cancelled: true });
            return;
        }
        if (/^\/api\/progress\/[^/]+$/.test(pathname) && method === 'GET') {
            const uploadId = pathname.split('/').at(-1)!;
            await json(route, {
                uploadId,
                status: 'Completed',
                totalFiles: 1,
                completedFiles: 1,
                percent: 100,
                files: [{
                    fileName: 'pattern-approval-evidence.pdf',
                    status: 'Completed',
                    bytesUploaded: 34,
                    totalBytes: 34,
                }],
            });
            return;
        }

        if (pathname === '/api/request-for-pattern-approval/add-documents' && method === 'POST') {
            const body = request.postData() ?? '';
            const referenceId = multipartValue(body, 'ApplicationId')
                ?? state.activeTypeApprovalReferenceId
                ?? '';
            const application = getApplication(state, referenceId);
            if (!application) {
                await notFound(route, referenceId);
                return;
            }
            const fileName = multipartFileName(body) ?? 'pattern-approval-evidence.pdf';
            const documentId = `pa-document-${state.nextTypeApprovalDocumentNumber}`;
            state.nextTypeApprovalDocumentNumber += 1;
            application.supportingDocuments.form ??= { documents: [] };
            application.supportingDocuments.form.documents ??= [];
            application.supportingDocuments.form.documents.push({
                id: documentId,
                documentReference: documentId,
                attachmentMimeType: 'application/pdf',
                attachmentType: 'Supporting document',
                attachmentName: fileName,
                attachmentSize: '34',
                attachmentUrl: '#',
                documentLocked: false,
            });
            await json(route, supportingDocumentsResponse(application));
            return;
        }
        if (pathname === '/api/request-for-pattern-approval/delete-document' && method === 'PUT') {
            const body = request.postData() ?? '';
            const referenceId = multipartValue(body, 'ApplicationId') ?? '';
            const documentReference = multipartValue(body, 'DocumentReference');
            const application = getApplication(state, referenceId);
            if (!application) {
                await notFound(route, referenceId);
                return;
            }
            application.supportingDocuments.form!.documents = (
                application.supportingDocuments.form?.documents ?? []
            ).filter((document) => document.id !== documentReference);
            await json(route, supportingDocumentsResponse(application));
            return;
        }
        if (pathname === '/api/request-for-pattern-approval/update-category' && method === 'PUT') {
            const body = request.postData() ?? '';
            const referenceId = multipartValue(body, 'ApplicationId') ?? '';
            const documentReference = multipartValue(body, 'DocumentReference');
            const category = multipartValue(body, 'NewCategory');
            const application = getApplication(state, referenceId);
            if (!application) {
                await notFound(route, referenceId);
                return;
            }
            const document = application.supportingDocuments.form?.documents
                ?.find((candidate) => candidate.id === documentReference);
            if (document) {
                document.attachmentCategory = category;
            }
            await json(route, supportingDocumentsResponse(application));
            return;
        }
        if (pathname === '/api/request-for-pattern-approval/add-message' && method === 'PUT') {
            const body = request.postData() ?? '';
            const referenceId = multipartValue(body, 'ApplicationId') ?? '';
            const application = getApplication(state, referenceId);
            if (!application) {
                await notFound(route, referenceId);
                return;
            }
            application.messages.unshift({
                id: `pa-message-${state.nextTypeApprovalMessageNumber}`,
                regardingId: referenceId,
                subject: 'Message from applicant',
                body: multipartValue(body, 'body') ?? '',
                footer: 'Test User',
                avatar: 'TU',
                senderName: 'Test User',
                messageSent: new Date('2026-06-02T00:00:00Z'),
                messageRead: true,
                messageFrom: 'Portal',
            });
            state.nextTypeApprovalMessageNumber += 1;
            await json(route, {});
            return;
        }

        const match = /^\/api\/request-for-pattern-approval\/([^/]+)\/([^/]+)$/.exec(pathname);
        if (!match) {
            await route.fallback();
            return;
        }
        const [, encodedReferenceId, resource] = match;
        const referenceId = decodeURIComponent(encodedReferenceId);
        const application = getApplication(state, referenceId);
        if (!application) {
            await notFound(route, referenceId);
            return;
        }

        if (resource === 'step-statuses' && method === 'GET') {
            await json(route, application.stepStatuses.map((status) => ({
                status,
                crmQuoteRequestId: `crm-${referenceId}`,
            })));
            return;
        }
        if (resource === 'organisation-and-contact') {
            if (method === 'GET') {
                await json(route, application.organisationAndContact);
                return;
            }
            if (method === 'PUT') {
                const command = parseJsonBody(route);
                application.organisationAndContact = command.formStep;
                application.organisationAndContact.formStepStatus = command.isCompletingStep
                    ? FormStepStatus.Completed
                    : FormStepStatus.Saved;
                application.stepStatuses[0] = application.organisationAndContact.formStepStatus;
                await json(route, {});
                return;
            }
        }
        if (resource === 'application-and-instrument') {
            if (method === 'GET') {
                await json(route, application.applicationAndInstrument);
                return;
            }
            if (method === 'PUT') {
                const command = parseJsonBody(route);
                application.applicationAndInstrument = command.formStep;
                application.applicationAndInstrument.formStepStatus = command.isCompletingStep
                    ? FormStepStatus.Completed
                    : FormStepStatus.Saved;
                application.stepStatuses[1] = application.applicationAndInstrument.formStepStatus;
                await json(route, {});
                return;
            }
        }
        if (resource === 'supporting-documents') {
            if (method === 'GET') {
                application.supportingDocuments.form ??= { documents: [] };
                application.supportingDocuments.form.instrumentCategory = application.applicationAndInstrument.instrumentCategory;
                application.supportingDocuments.form.instrumentType = application.applicationAndInstrument.instrumentType;
                application.supportingDocuments.form.patternApprovalType = application.applicationAndInstrument.patternApprovalType;
                await json(route, supportingDocumentsResponse(application));
                return;
            }
            if (method === 'PUT') {
                const command = parseJsonBody(route);
                application.supportingDocuments = command.formStep;
                application.supportingDocuments.formStepStatus = command.isCompletingStep
                    ? FormStepStatus.Completed
                    : FormStepStatus.Saved;
                application.stepStatuses[2] = application.supportingDocuments.formStepStatus;
                await json(route, {});
                return;
            }
        }
        if (resource === 'summary' && method === 'GET') {
            await json(route, {
                referenceId,
                acceptNMIP106: false,
                acceptTermsAndConditions: false,
                acceptDeclaration: false,
                organisationAndContact: application.organisationAndContact,
                applicationAndInstrument: application.applicationAndInstrument,
                supportingDocuments: application.supportingDocuments,
                formStepStatus: application.submitted ? FormStepStatus.Completed : FormStepStatus.NotStarted,
            });
            return;
        }
        if (resource === 'submit' && method === 'PUT') {
            application.submitted = true;
            application.stepStatuses = Array<FormStepStatus>(4).fill(FormStepStatus.Completed);
            application.supportingDocuments.formStepStatus = FormStepStatus.Completed;
            if (application.supportingDocuments.form) {
                application.supportingDocuments.form.applicationStatus = 'Submitted';
            }
            await json(route, {});
            return;
        }
        if (resource === 'app-details' && method === 'GET') {
            await json(route, applicationDetailsResponse(application));
            return;
        }
        if (resource === 'app-documents' && method === 'GET') {
            await json(route, supportingDocumentsResponse(application));
            return;
        }
        if (resource === 'commit-app-documents' && method === 'PUT') {
            const command = parseJsonBody(route);
            application.supportingDocuments.form = command.form;
            await json(route, supportingDocumentsResponse(application));
            return;
        }
        if (resource === 'app-messages-count' && method === 'GET') {
            await json(route, application.messages.filter((message) => !message.messageRead).length);
            return;
        }
        if (resource === 'app-messages' && method === 'GET') {
            await json(route, {
                patternApprovalId: referenceId,
                patternApprovalName: applicationDetailsResponse(application).applicationDetails.title,
                requestForPatternApprovalMessageDetails: {
                    currentPage: 1,
                    items: application.messages,
                    totalPages: 1,
                    pageSize: 10,
                    totalCount: application.messages.length,
                },
            });
            return;
        }

        await route.fallback();
    });
}
