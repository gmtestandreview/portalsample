import ReactGA from 'react-ga4';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardClient, State } from '../../../../ClientApp/src/api/web-api-client';
import type * as WebApiClientModule from '../../../../ClientApp/src/api/web-api-client';
import type { AccountDetails } from '../../../../ClientApp/src/authentication/accountContext';
import { setDashboardNotification } from '../../../../ClientApp/src/storage/notification';
import { NotificationSeverity } from '../../../../ClientApp/src/storage/types';
import {
    contentLoaded,
    formatBannerTitle,
    formatOrganisationTitle,
    formatTradingBranch,
    formatTradingBranchFromStrings,
    getFileDetails,
    getFileIdFromBase64,
    getFileSize,
    getFileUrlFromBase64,
    getFormattedAddress,
    getEnvironment,
    getMakeModelDetails,
    getQuotationFileDetails,
    getQuoteOfferPageNumber,
    isEmptyGuid,
    isValidGUID,
    handleReportFileError,
    handleUnexpectedError,
    mapToUserProfile,
    openInNewTab,
    openPdfPageInNewTab,
    sanitiseHtml,
    sortList,
    triggerDownload,
    downloadFileFromUrl,
} from '../../../../ClientApp/src/routes/common/helperFunctions';
import { Environment, QuoteStatus } from '../../../../ClientApp/src/routes/common/enums';
import { openPdfPageInSecureNewTab, openUrlInSecureNewTab } from '../../../../ClientApp/src/routes/common/openWindow';

const mocks = vi.hoisted(() => ({
    setAuthToken: vi.fn(),
    getQuoteRequestAcceptedPDFByID: vi.fn(),
    getQuoteRequestRejectedPDFByID: vi.fn(),
    getQuoteOfferPDFByQuoteID: vi.fn(),
    getQuoteReportPDFByID: vi.fn(),
    setDashboardNotification: vi.fn(),
    openUrlInSecureNewTab: vi.fn(),
    openPdfPageInSecureNewTab: vi.fn(),
}));

vi.mock('../../../../ClientApp/src/api/web-api-client', async (importOriginal) => {
    const actual = await importOriginal<typeof WebApiClientModule>();

    return {
        ...actual,
        DashboardClient: vi.fn(function DashboardClientMock() {
            return {
                setAuthToken: mocks.setAuthToken,
                getQuoteRequestAcceptedPDFByID: mocks.getQuoteRequestAcceptedPDFByID,
                getQuoteRequestRejectedPDFByID: mocks.getQuoteRequestRejectedPDFByID,
                getQuoteOfferPDFByQuoteID: mocks.getQuoteOfferPDFByQuoteID,
                getQuoteReportPDFByID: mocks.getQuoteReportPDFByID,
            };
        }),
    };
});

vi.mock('../../../../ClientApp/src/storage/notification', () => ({
    setDashboardNotification: mocks.setDashboardNotification,
}));

vi.mock('../../../../ClientApp/src/routes/common/openWindow', () => ({
    openUrlInSecureNewTab: mocks.openUrlInSecureNewTab,
    openPdfPageInSecureNewTab: mocks.openPdfPageInSecureNewTab,
}));

vi.mock('react-ga4', () => ({
    default: {
        send: vi.fn(),
    },
}));

const baseRequest = {
    crmQuoteRequestId: 'request-1',
    crmQuoteId: 'quote-1',
};

describe('route common helper functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getQuoteRequestAcceptedPDFByID.mockResolvedValue({ fileData: 'accepted' });
        mocks.getQuoteRequestRejectedPDFByID.mockResolvedValue({ fileData: 'rejected' });
        mocks.getQuoteOfferPDFByQuoteID.mockResolvedValue({ fileData: 'offer' });
        mocks.getQuoteReportPDFByID.mockResolvedValue({ fileData: 'report' });
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it.each([
        [QuoteStatus.QuoteAccepted, 'getQuoteRequestAcceptedPDFByID', ['request-1', true]],
        [QuoteStatus.ArtifactReceived, 'getQuoteRequestAcceptedPDFByID', ['request-1', true]],
        [QuoteStatus.QuoteDeclined, 'getQuoteRequestRejectedPDFByID', ['request-1', true]],
        [QuoteStatus.QuoteAvailable, 'getQuoteOfferPDFByQuoteID', ['quote-1', true]],
        [QuoteStatus.QuoteClosed, 'getQuoteOfferPDFByQuoteID', ['quote-1', true]],
        [QuoteStatus.ReportInProgress, 'getQuoteRequestAcceptedPDFByID', ['request-1', true]],
    ])('routes dashboard file downloads for %s', async (status, methodName, expectedArgs) => {
        await getFileDetails('access-token', { ...baseRequest, quoteRequestStatus: status }, true);

        expect(DashboardClient).toHaveBeenCalled();
        expect(mocks.setAuthToken).toHaveBeenCalledWith('access-token');
        expect(mocks[methodName as keyof typeof mocks]).toHaveBeenCalledWith(...expectedArgs);
    });

    it('routes report-issued dashboard downloads differently for quotation and measurement tabs', async () => {
        await getFileDetails('token', { ...baseRequest, quoteRequestStatus: QuoteStatus.ReportIssued }, false, true);
        expect(mocks.getQuoteRequestAcceptedPDFByID).toHaveBeenCalledWith('request-1', false);

        await getFileDetails('token', { ...baseRequest, quoteRequestStatus: QuoteStatus.ReportIssued }, true, false);
        expect(mocks.getQuoteReportPDFByID).toHaveBeenCalledWith('request-1', true);
    });

    it('resolves to undefined for statuses without downloadable files', async () => {
        await expect(getFileDetails('token', { ...baseRequest, quoteRequestStatus: QuoteStatus.QuoteSubmitted }, true))
            .resolves.toBeUndefined();
        await expect(getQuotationFileDetails('token', { ...baseRequest, quoteRequestStatus: QuoteStatus.QuoteSubmitted }, true))
            .resolves.toBeUndefined();
    });

    it.each([
        [QuoteStatus.QuoteAccepted, 'getQuoteRequestAcceptedPDFByID'],
        [QuoteStatus.ArtifactReceived, 'getQuoteRequestAcceptedPDFByID'],
        [QuoteStatus.ReportIssued, 'getQuoteRequestAcceptedPDFByID'],
        [QuoteStatus.ReportInProgress, 'getQuoteRequestAcceptedPDFByID'],
        [QuoteStatus.ReportWithdrawn, 'getQuoteRequestAcceptedPDFByID'],
        [QuoteStatus.QuoteDeclined, 'getQuoteRequestRejectedPDFByID'],
        [QuoteStatus.QuoteAvailable, 'getQuoteOfferPDFByQuoteID'],
        [QuoteStatus.QuoteClosed, 'getQuoteOfferPDFByQuoteID'],
    ])('routes quotation file downloads for %s', async (status, methodName) => {
        await getQuotationFileDetails('access-token', { ...baseRequest, quoteRequestStatus: status }, false);

        expect(mocks.setAuthToken).toHaveBeenCalledWith('access-token');
        expect(mocks[methodName as keyof typeof mocks]).toHaveBeenCalled();
    });

    it('formats make/model, file sizes, quote pages, addresses, and user profiles', () => {
        expect(getMakeModelDetails({
            quoteRequestStatus: QuoteStatus.ReportInProgress,
            portalArtefactName: 'Portal artefact',
        })).toBe('Portal artefact');
        expect(getMakeModelDetails({
            quoteRequestStatus: QuoteStatus.QuoteSubmitted,
            instrumentArtefactToBeCalibrated: 'Instrument',
        })).toBe('Instrument');
        expect(getMakeModelDetails({ quoteRequestStatus: QuoteStatus.QuoteSubmitted })).toBe('');
        expect(getMakeModelDetails({ quoteRequestStatus: QuoteStatus.ArtifactReceived })).toBe('');

        expect(getFileSize(1024)).toBe('1.00Kb');
        expect(getFileSize(2 * 1024 * 1024)).toBe('2.00Mb');

        expect(getQuoteOfferPageNumber(QuoteStatus.QuoteDeclined)).toBe('3');
        expect(getQuoteOfferPageNumber(QuoteStatus.QuoteAccepted)).toBe('5');
        expect(getQuoteOfferPageNumber(undefined)).toBe('2');

        expect(getFormattedAddress({
            line1: '1 National Circuit',
            line2: 'Level 2',
            line3: '',
            suburb: 'Barton',
            state: State.ACT,
            postcode: '2600',
        })).toBe('1 National Circuit, Level 2,  Barton ACT 2600');
        expect(getFormattedAddress(undefined)).toBe('No Address Found');

        expect(mapToUserProfile({
            testingCalibrationDashboard: {
                filterYearType: '2026',
                filterStatusType: 'Open',
                filterSortOrder: 'Newest',
                filtersChanged: true,
                filterCurrentPage: 2,
                filterActiveTab: 'Quotation',
                filterSearchText: 'NMI',
            },
        })).toEqual({
            filterYearType: '2026',
            filterStatusType: 'Open',
            filterSortOrder: 'Newest',
            filtersChanged: true,
            filterCurrentPage: 2,
            filterActiveTab: 'Quotation',
            filterSearchText: 'NMI',
        });
    });

    it('formats account and organisation display names across optional trading and branch names', () => {
        const details = (overrides: Partial<AccountDetails>): AccountDetails => ({
            organisation: 'National Measurement Institute',
            trading: undefined,
            branch: undefined,
            ...overrides,
        } as AccountDetails);

        expect(formatBannerTitle(details({ trading: 'NMI Trading', branch: 'Sydney' }))).toBe('NMI Trading - Sydney - National Measurement Institute');
        expect(formatBannerTitle(details({ branch: 'Sydney' }))).toBe('Sydney - National Measurement Institute');
        expect(formatBannerTitle(details({}))).toBe('National Measurement Institute');
        expect(formatBannerTitle(null as unknown as AccountDetails)).toBe('');

        expect(formatOrganisationTitle('NMI', 'Trading', 'Branch')).toBe('Trading - Branch - NMI');
        expect(formatOrganisationTitle('NMI', '', 'Branch')).toBe('Branch - NMI');
        expect(formatOrganisationTitle('NMI', '', '')).toBe('NMI');
        expect(formatOrganisationTitle(undefined, 'Trading', 'Branch')).toBe('Trading - Branch - undefined');
        expect(formatOrganisationTitle(null as unknown as string, 'Trading', 'Branch')).toBe('');

        expect(formatTradingBranch(details({ trading: 'Trading', branch: 'Branch' }))).toBe('Trading - Branch');
        expect(formatTradingBranch(details({ branch: 'Branch' }))).toBe('Branch');
        expect(formatTradingBranch(null as unknown as AccountDetails)).toBe('');

        expect(formatTradingBranchFromStrings('Trading', 'Branch')).toBe('Trading - Branch');
        expect(formatTradingBranchFromStrings('', 'Branch')).toBe('Branch');
        expect(formatTradingBranchFromStrings(null as unknown as string, 'Branch')).toBe('');
    });

    it('creates file URLs, delegates secure open helpers, and triggers downloads', () => {
        const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:unit-test');
        const click = vi.fn();
        const createElement = vi.spyOn(document, 'createElement').mockReturnValue({
            href: '',
            download: '',
            click,
        } as unknown as HTMLAnchorElement);

        expect(getFileUrlFromBase64('Zm9v')).toBe('blob:unit-test');
        expect(getFileIdFromBase64('Zm9v')).toBe('blob:unit-test');
        expect(createObjectUrl).toHaveBeenCalledTimes(2);

        openInNewTab('blob:unit-test');
        openPdfPageInNewTab('blob:unit-test', '5');

        expect(openUrlInSecureNewTab).toHaveBeenCalledWith('blob:unit-test');
        expect(openPdfPageInSecureNewTab).toHaveBeenCalledWith('blob:unit-test', '5');

        triggerDownload('blob:unit-test', 'quote.pdf');

        expect(createElement).toHaveBeenCalledWith('a');
        expect(click).toHaveBeenCalled();
    });

    it('sets dashboard notifications for report and unexpected errors', () => {
        vi.useFakeTimers();
        const notification = document.createElement('button');
        notification.id = '#notif-test';
        notification.scrollIntoView = vi.fn();
        notification.focus = vi.fn();
        document.body.append(notification);
        vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => {});

        handleReportFileError();
        vi.runAllTimers();

        expect(globalThis.scrollTo).toHaveBeenCalledWith(0, 0);
        expect(notification.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
        expect(notification.focus).toHaveBeenCalled();
        expect(setDashboardNotification).toHaveBeenCalledWith({
            message: expect.stringContaining('unexpected error has occurred with downloading the PDF report'),
            severity: NotificationSeverity.Error,
        });

        handleUnexpectedError({ status: 500 });
        expect(setDashboardNotification).toHaveBeenCalledWith(expect.objectContaining({
            severity: NotificationSeverity.Error,
        }));

        handleUnexpectedError({});
        expect(setDashboardNotification).toHaveBeenCalledWith(expect.objectContaining({
            severity: NotificationSeverity.Error,
        }));
    });

    it.each([
        ['localhost', Environment.Local],
        ['portal.dev.example', Environment.Dev],
        ['portal.test.example', Environment.Test],
        ['portal.preprod.example', Environment.PreProd],
        ['portal.uat.example', Environment.UAT],
        ['portal.example', ''],
    ])('detects the %s environment', (hostname, expected) => {
        vi.spyOn(globalThis, 'location', 'get').mockReturnValue({
            ...globalThis.location,
            hostname,
        });

        expect(getEnvironment()).toBe(expected);
    });

    it('sends redacted GA events for PII fields and optional page views', () => {
        globalThis.history.pushState({}, '', '/dashboard');
        document.body.innerHTML = `
            <span data-pii="contactName">Greg</span>
            <span data-pii="email">greg@example.test</span>
        `;

        contentLoaded(true);

        expect(ReactGA.send).toHaveBeenNthCalledWith(1, {
            hitType: 'event',
            category: 'form_viewed_sanitized',
            data: { contactName: '[REDACTED]', email: '[REDACTED]' },
        });
        expect(ReactGA.send).toHaveBeenNthCalledWith(2, {
            hitType: 'event',
            category: 'form_viewed_sanitized',
            data: { contactName: '[REDACTED]', email: '[REDACTED]' },
        });
        expect(ReactGA.send).toHaveBeenCalledWith({ hitType: 'pageview', page: '/dashboard' });

        vi.mocked(ReactGA.send).mockClear();
        contentLoaded(false);
        expect(ReactGA.send).not.toHaveBeenCalledWith(expect.objectContaining({ hitType: 'pageview' }));
    });

    it('sorts lists and moves the matching final item to the end', () => {
        const options = [
            { value: 'b', displayText: 'Beta' },
            { value: 'z', displayText: 'Zed' },
            { value: 'a', displayText: 'Alpha' },
        ];

        const [sortedOptions, lastOptionId] = sortList(options, 'Ze', 'displayText');
        expect(sortedOptions.map((option) => option.displayText)).toEqual(['Alpha', 'Beta', 'Zed']);
        expect(lastOptionId).toBe('z');

        const lookups = [
            { id: '2', name: 'Beta' },
            { id: '1', name: 'Alpha' },
        ];

        const [sortedLookups, lastLookupId] = sortList(lookups, 'missing', 'name');
        expect(sortedLookups.map((lookup) => lookup.name)).toEqual(['Alpha', 'Beta']);
        expect(lastLookupId).toBe('');

        expect(sortList([], 'anything', 'name')).toEqual([[], '']);
    });

    it('covers empty address lines and unusual optional organisation fields', () => {
        expect(getFormattedAddress({
            line1: null as unknown as string,
            line2: null as unknown as string,
            line3: null as unknown as string,
            suburb: 'Canberra',
            state: State.ACT,
            postcode: '2600',
        })).toBe(' Canberra ACT 2600');

        expect(formatBannerTitle({
            organisation: 'National Measurement Institute',
            trading: '',
            branch: '',
        } as AccountDetails)).toBe('National Measurement Institute');

        expect(formatTradingBranch({
            organisation: 'National Measurement Institute',
            trading: 'Trading',
            branch: '',
        } as AccountDetails)).toBe('Trading');
    });

    it('classifies empty and syntactically valid GUID values', () => {
        expect(isEmptyGuid(undefined)).toBe(true);
        expect(isEmptyGuid('00000000-0000-0000-0000-000000000000')).toBe(true);
        expect(isEmptyGuid('8fbbf0f8-a931-48c3-951b-944c9a08b6ef')).toBe(false);

        expect(isValidGUID(undefined)).toBe(false);
        expect(isValidGUID('not-a-guid')).toBe(false);
        expect(isValidGUID('8fbbf0f8-a931-48c3-951b-944c9a08b6ef')).toBe(true);
    });

    it('sanitises unsafe markup before returning HTML', () => {
        expect(sanitiseHtml('<img src="x" onerror="alert(1)"><p>Safe copy</p>'))
            .toBe('<img src="x"><p>Safe copy</p>');
    });

    it('opens downloaded file URLs in a secure new tab', () => {
        downloadFileFromUrl('https://example.test/report.pdf', {}, [], 'report.pdf');

        expect(openUrlInSecureNewTab).toHaveBeenCalledWith('https://example.test/report.pdf');
    });
});
