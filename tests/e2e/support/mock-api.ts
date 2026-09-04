import type { Page, Route } from '@playwright/test';
import {
    ApplicationType,
    CRMLookupTypes,
    FormStepStatus,
    ServiceType,
    YesNo,
} from '../../../ClientApp/src/api/web-api-client';
import type { ScenarioState } from './scenario-state';
import {
    buildAcceptQuoteStatuses,
    buildAcceptQuoteSummary,
    buildAccountForm,
    buildContactForm,
    buildDeliveryAndReturn,
    buildInstrumentReports,
    buildMeasurementReport,
    buildPaymentDetails,
    buildReportRecipient,
    buildRfqSummary,
} from './mock-builders';
import { failureKey } from './mock-failure';
import { installTypeApprovalMockApi } from './type-approval-api';

const defaultContact = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '0200000000',
    mobile: '0400000000',
};

const json = (route: Route, body: unknown, status = 200) => route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
});

const fulfillConfiguredFailure = async (
    route: Route,
    state: ScenarioState,
): Promise<boolean> => {
    const key = failureKey(
        route.request().method(),
        new URL(route.request().url()).pathname,
    );
    const failure = state.failures.get(key);
    if (!failure) {
        return false;
    }
    if (failure.once !== false) {
        state.failures.delete(key);
    }
    await json(route, failure.body ?? {
        status: failure.status,
        title: 'Configured E2E failure',
    }, failure.status);
    return true;
};

const acceptQuoteStepHandler = (
    state: ScenarioState,
    buildResponse: () => Record<string, unknown>,
) => async (route: Route) => {
    if (route.request().method() === 'GET') {
        await json(route, buildResponse());
        return;
    }
    if (await fulfillConfiguredFailure(route, state)) {
        return;
    }
    const step = new URL(route.request().url()).pathname.split('/').at(-1)!;
    state.completedAcceptQuoteSteps.add(step);
    await json(route, {});
};

const buildSignInResponse = (state: ScenarioState) => ({
    userId: 1,
    contactId: state.accountContactCompleted ? 1 : null,
    firstName: 'Test',
    lastName: 'User',
    email: state.email,
    employerAbn: '00000000000',
    acceptedTerms: state.acceptedTerms,
    termsVersion: state.acceptedTerms ? 1 : 0,
    defaultOrganisationId: state.defaultOrganisationId,
    organisation: state.accountCreationCompleted
        ? {
            organisationId: 1,
            name: 'Test Organisation',
            businessOrTradingName: 'Test Organisation Pty Ltd',
            branchOrLocationName: 'Main Branch',
            abn: '00000000000',
            accountCompleted: true,
            crmGuid: 'crm-org-1',
            isCompleted: true,
        }
        : null,
    contact: state.accountContactCompleted
        ? {
            id: 1,
            ...defaultContact,
            isCompleted: true,
            crmGuid: 'crm-contact-1',
        }
        : null,
    userProfile: {
        services: [
            { service: ServiceType.TestingCalibration, isActive: true, isDefault: true },
            { service: ServiceType.PatternApproval, isActive: true, isDefault: false },
        ],
        testingCalibrationDashboard: {
            filterYearType: '',
            filterStatusType: '',
            filterSortOrder: 'descending',
            filtersChanged: false,
            filterCurrentPage: 1,
            filterActiveTab: 'drafts',
            filterSearchText: '',
        },
        patternApprovalDashboard: {
            filterYearType: '',
            filterStatusType: '',
            filterSortOrder: 'descending',
            filtersChanged: false,
            filterCurrentPage: 1,
            filterActiveTab: 'drafts',
            filterSearchText: '',
        },
        filterYearType: '',
        filterStatusType: '',
        filterSortOrder: 'descending',
        filtersChanged: false,
        filterCurrentPage: 1,
        filterActiveTab: 'drafts',
        filterSearchText: '',
    },
});

const buildDashboardItem = (referenceId: string, status: string) => ({
    referenceId,
    status,
    requestedFor: 'Test User',
    lastUpdated: new Date('2026-06-01T00:00:00Z'),
    requestForQuote: {
        id: 1,
        artefactName: 'Test Manufacturer Test Model',
        manufacturer: 'Test Manufacturer',
        model: 'Test Model',
        serialNumber: 'SN123456',
        measurementCategory: 'Mass',
        artefactType: 'Instrument',
        requestSubmitted: new Date('2026-06-01T00:00:00Z'),
        hideFromDashboard: false,
        contactDetails: defaultContact,
    },
    quote: {
        quotationId: `Q-${referenceId}`,
        artefactName: 'Test Manufacturer Test Model',
        offerDate: new Date('2026-06-01T00:00:00Z'),
        validUntil: new Date('2026-07-01T00:00:00Z'),
        dateRequired: new Date('2026-07-15T00:00:00Z'),
        nmiContactDetails: defaultContact,
    },
    report: {
        reportId: `MR-${referenceId}`,
        invoiceNumber: 'INV-001',
        dateIssued: new Date('2026-06-01T00:00:00Z'),
        targetReportDate: new Date('2026-07-01T00:00:00Z'),
    },
});

const dashboardResponse = (state: ScenarioState) => {
    const items = Array.from(state.requests, ([referenceId, status]) => (
        buildDashboardItem(referenceId, status)
    ));
    return {
        items,
        currentPage: 1,
        totalPages: 1,
        totalCount: items.length,
    };
};

export async function installMockApi(page: Page, state: ScenarioState): Promise<void> {
    await page.route('**/api/users/sign-in**', async (route) => {
        await json(route, buildSignInResponse(state));
    });

    await page.route('**/api/users/accept-terms', async (route) => {
        if (await fulfillConfiguredFailure(route, state)) {
            return;
        }
        state.acceptedTerms = true;
        await json(route, {});
    });

    await page.route('**/api/users/set-userprofile**', async (route) => {
        await json(route, {});
    });

    await page.route('**/api/dashboard/get-filtered-dashboard-**', async (route) => {
        await json(route, dashboardResponse(state));
    });

    await page.route('/api/dashboard/**', async (route) => {
        await json(route, dashboardResponse(state));
    });

    await page.route('/api/account/**', async (route) => {
        await json(route, {
            organisation: 'Test Organisation',
            trading: 'Test Organisation Pty Ltd',
            branch: 'Main Branch',
            homeAccountId: 'mock-oid',
            givenName: 'Test',
            familyName: 'User',
            email: state.email,
            abn: '00000000000',
            userAcceptedTermsOfUse: state.acceptedTerms,
            accountCreationCompleted: state.accountCreationCompleted,
            accountContactCompleted: state.accountContactCompleted,
            currentTermsVersion: '1',
            defaultOrganisationId: state.defaultOrganisationId,
            organisationIsCompleted: state.accountCreationCompleted,
            isDefaultOrganisation: state.defaultOrganisationId !== null,
            showBranchSelector: false,
            showRFQDeleteModal: false,
        });
    });

    await page.route('**/api/quote/get-quote-request-details-byrefid**', async (route) => {
        const url = new URL(route.request().url());
        const referenceId = url.searchParams.get('QuoteReferenceID')
            ?? state.activeReferenceId
            ?? 'RFQ-TEST-0001';
        await json(
            route,
            state.quotes.get(referenceId) ?? buildMeasurementReport(referenceId),
        );
    });

    await page.route('**/api/quote/get-quote-request-details**', async (route) => {
        const quote = state.activeReferenceId
            ? state.quotes.get(state.activeReferenceId)
            : undefined;
        await json(
            route,
            quote ?? buildMeasurementReport(
                state.activeReferenceId ?? 'RFQ-REPORT-0001',
            ),
        );
    });

    await page.route('**/api/quote/decline-quote**', async (route) => {
        if (await fulfillConfiguredFailure(route, state)) {
            return;
        }
        if (state.activeReferenceId) {
            state.requests.set(state.activeReferenceId, 'Quote offer declined');
        }
        await json(route, {});
    });

    await page.route('**/api/accept-quote/*/step-statuses', async (route) => {
        const referenceId = decodeURIComponent(
            new URL(route.request().url()).pathname.split('/').at(-2) ?? '',
        );
        await json(route, buildAcceptQuoteStatuses(`crm-${referenceId}`));
    });

    await page.route(
        '**/api/accept-quote/*/report-recipient',
        acceptQuoteStepHandler(state, buildReportRecipient),
    );
    await page.route(
        '**/api/accept-quote/*/delivery-and-return',
        acceptQuoteStepHandler(state, buildDeliveryAndReturn),
    );
    await page.route(
        '**/api/accept-quote/*/payment-details',
        acceptQuoteStepHandler(state, buildPaymentDetails),
    );
    await page.route(
        '**/api/accept-quote/*/summary-and-accept',
        acceptQuoteStepHandler(state, buildAcceptQuoteSummary),
    );
    await page.route('**/api/accept-quote/*/submit', async (route) => {
        if (await fulfillConfiguredFailure(route, state)) {
            return;
        }
        state.requests.set('RFQ-2024-000892', 'Quote accepted');
        await json(route, {});
    });

    await page.route('**/api/application', async (route) => {
        if (route.request().method() !== 'POST') {
            await route.fallback();
            return;
        }
        if (await fulfillConfiguredFailure(route, state)) {
            return;
        }
        const command = JSON.parse(route.request().postData() ?? '{}') as {
            applicationType?: string;
        };
        const referenceId = command.applicationType === ApplicationType.QuoteAccept
            ? state.acceptedQuoteApplicationId
            : 'RFQ-NEW-0001';
        if (command.applicationType !== ApplicationType.QuoteAccept) {
            state.activeReferenceId = referenceId;
        }
        await json(route, {
            referenceId,
            applicationType: command.applicationType,
        });
    });

    await page.route('**/api/application/*/copy', async (route) => {
        if (await fulfillConfiguredFailure(route, state)) {
            return;
        }
        const sourceReferenceId = decodeURIComponent(
            new URL(route.request().url()).pathname.split('/').at(-2) ?? '',
        );
        const copiedReferenceId = `${sourceReferenceId}-COPY`;
        const application = {
            referenceId: copiedReferenceId,
            sourceReferenceId,
            applicationType: ApplicationType.QuoteRequest,
        };
        state.copiedApplications.set(sourceReferenceId, application);
        state.activeReferenceId = copiedReferenceId;
        await json(route, application);
    });

    await page.route('**/api/request-for-quote/*/step-statuses', async (route) => {
        const referenceId = decodeURIComponent(
            new URL(route.request().url()).pathname.split('/').at(-2) ?? '',
        );
        const statuses = state.rfqStepStatuses.get(referenceId);
        await json(route, (statuses ?? [
            FormStepStatus.NotStarted,
            FormStepStatus.NotStarted,
            FormStepStatus.NotStarted,
        ]).map((status) => ({
            status,
            crmQuoteRequestId: `crm-${referenceId}`,
        })));
    });

    await page.route('**/api/request-for-quote/*/organisation-and-contact', async (route) => {
        if (route.request().method() === 'GET') {
            await json(route, {
                sourceReferenceId: state.activeReferenceId,
                abn: '00000000000',
                name: 'Test Organisation',
                businessOrTradingName: 'Test Organisation Pty Ltd',
                branchOrLocationName: 'Main Branch',
                isPrincipalContact: YesNo.Yes,
                contact: defaultContact,
                formStepStatus: FormStepStatus.NotStarted,
            });
            return;
        }
        if (await fulfillConfiguredFailure(route, state)) {
            return;
        }
        await json(route, {});
    });

    await page.route('**/api/request-for-quote/*/instrument-and-request', async (route) => {
        const referenceId = decodeURIComponent(
            new URL(route.request().url()).pathname.split('/').at(-2) ?? '',
        );
        if (route.request().method() === 'GET') {
            await json(route, {
                sourceReferenceId: state.activeReferenceId,
                manufacturer: 'Original Manufacturer',
                model: 'Original Model',
                hasSerialNumber: YesNo.Yes,
                serialNumber: 'SN123456',
                numberOfItems: 1,
                measurementCategory: 'mass',
                instrumentOrArtefactType: 'balance',
                testingAndCalibrationRequirements: 'Calibrate across the operating range.',
                measurementReportAndCertificateRequired: 'MeasurementReportOnly',
                formStepStatus: FormStepStatus.NotStarted,
                ...state.instrumentDrafts.get(referenceId),
            });
            return;
        }
        if (await fulfillConfiguredFailure(route, state)) {
            return;
        }
        const command = JSON.parse(route.request().postData() ?? '{}') as {
            formStep?: Record<string, unknown>;
        };
        state.instrumentDrafts.set(referenceId, command.formStep ?? {});
        await json(route, {});
    });

    await page.route('**/api/lookup?**', async (route) => {
        const lookupType = new URL(route.request().url()).searchParams.get('LookupType');
        if (lookupType === CRMLookupTypes.TCPortalMeasurementCategory) {
            await json(route, [
                { id: 'mass', label: 'Mass' },
                { id: 'no-measurement', label: 'No measurement category available' },
            ]);
            return;
        }
        if (lookupType === CRMLookupTypes.TCArtefactTypePortalCategory) {
            await json(route, [
                { id: 'balance', label: 'Analytical balance', parentId: 'mass' },
                {
                    id: 'no-instrument',
                    label: 'No instrument/artefact type available',
                    parentId: 'no-measurement',
                },
            ]);
            return;
        }
        await json(route, []);
    });

    await page.route('**/api/request-for-quote/*/summary', async (route) => {
        await json(route, buildRfqSummary());
    });

    await page.route('**/api/request-for-quote/*/view-summary', async (route) => {
        const referenceId = decodeURIComponent(
            new URL(route.request().url()).pathname.split('/').at(-2) ?? '',
        );
        await json(route, state.rfqSummaries.get(referenceId) ?? buildRfqSummary());
    });

    await page.route('**/api/request-for-quote/*/submit', async (route) => {
        if (await fulfillConfiguredFailure(route, state)) {
            return;
        }
        await json(route, {});
    });

    await page.route('**/api/forms/accounts/create-account/new', async (route) => {
        await json(route, {
            id: 1,
            stepValues: {
                id: 1,
                abn: '00000000000',
                name: 'Test Organisation',
                businessOrTradingName: 'Test Organisation Pty Ltd',
                branchOrLocationName: 'Main Branch',
                isDefaultOrganisation: true,
                streetAddress: {
                    line1: '1 Test Street',
                    suburb: 'Sydney',
                    state: 'NSW',
                    postcode: '2000',
                    isManuallyEntered: true,
                },
                postalAddressSameAsStreetAddress: true,
                status: FormStepStatus.NotStarted,
            },
        });
    });

    await page.route('**/api/forms/accounts/1', async (route) => {
        await json(route, { id: 1, stepValues: buildAccountForm() });
    });

    await page.route('**/api/forms/accounts/branch', async (route) => {
        await json(route, { id: 1, stepValues: buildAccountForm('') });
    });

    await page.route('**/api/forms/accounts/create-account/complete', async (route) => {
        if (await fulfillConfiguredFailure(route, state)) {
            return;
        }
        state.lastAccountSubmission = JSON.parse(
            route.request().postData() ?? '{}',
        ) as Record<string, unknown>;
        state.accountCreationCompleted = true;
        await json(route, {});
    });

    await page.route('**/api/forms/accounts/branch-add/complete', async (route) => {
        if (await fulfillConfiguredFailure(route, state)) {
            return;
        }
        state.lastAccountSubmission = JSON.parse(
            route.request().postData() ?? '{}',
        ) as Record<string, unknown>;
        await json(route, {});
    });

    await page.route('**/api/contact/usercontact**', async (route) => {
        await json(route, buildContactForm());
    });

    await page.route('**/api/contact/save-contact', async (route) => {
        if (await fulfillConfiguredFailure(route, state)) {
            return;
        }
        state.lastContactSubmission = JSON.parse(
            route.request().postData() ?? '{}',
        ) as Record<string, unknown>;
        state.accountContactCompleted = true;
        await json(route, {});
    });

    await page.route('**/api/dashboard/get-dashboard-instrument-artefact-reports?**', async (route) => {
        await json(route, buildInstrumentReports());
    });

    await page.route('**/api/dashboard/get-quote-report-pdf?**', async (route) => {
        if (await fulfillConfiguredFailure(route, state)) {
            return;
        }
        await json(route, {
            filename: 'MR-2024-001.pdf',
            fileData: 'JVBERi0xLjQ=',
            fileSizeBytes: 14,
            mimeType: 'application/pdf',
        });
    });

    await page.route('**/api/address/search**', async (route) => {
        await json(route, { matches: [] });
    });

    await installTypeApprovalMockApi(page, state);
}
