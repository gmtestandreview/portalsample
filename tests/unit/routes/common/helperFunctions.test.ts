import ReactGA from 'react-ga4';
import { describe, expect, it, vi } from 'vitest';
import {
  DashboardClient,
  State,
} from '../../../../ClientApp/src/api/web-api-client';
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
  toDashboardItemStatus,
  toDashboardTab,
  toFilterMessages,
  toPaDashboardItemStatus,
  toPatternApprovalStatusEnumDto,
  toQuoteStatus,
  toReportStatus,
  toStatusEnumDto,
  openInNewTab,
  openPdfPageInNewTab,
  sanitiseHtml,
  sortList,
  triggerDownload,
  downloadFileFromUrl,
} from '../../../../ClientApp/src/routes/common/helperFunctions';
import {
  Environment,
  DashboardItemStatus,
  PaDashboardItemStatus,
  QuoteStatus,
  ReportStatus,
} from '../../../../ClientApp/src/routes/common/enums';
import { DashboardTab } from '../../../../ClientApp/src/components/SearchFilter/types';
import {
  FilterMessages,
  PatternApprovalStatusEnumDto,
  StatusEnumDto,
} from '../../../../ClientApp/src/api/web-api-client';
import {
  openPdfPageInSecureNewTab,
  openUrlInSecureNewTab,
} from '../../../../ClientApp/src/routes/common/openWindow';

const mocks = vi.hoisted(() => ({
  setAuthToken: vi.fn<(...args: unknown[]) => unknown>(),
  getQuoteRequestAcceptedPDFByID: vi.fn<(...args: unknown[]) => unknown>(),
  getQuoteRequestRejectedPDFByID: vi.fn<(...args: unknown[]) => unknown>(),
  getQuoteOfferPDFByQuoteID: vi.fn<(...args: unknown[]) => unknown>(),
  getQuoteReportPDFByID: vi.fn<(...args: unknown[]) => unknown>(),
  setDashboardNotification: vi.fn<(...args: unknown[]) => unknown>(),
  openUrlInSecureNewTab: vi.fn<(...args: unknown[]) => unknown>(),
  openPdfPageInSecureNewTab: vi.fn<(...args: unknown[]) => unknown>(),
}));

vi.mock(
  '../../../../ClientApp/src/api/web-api-client',
  async (importOriginal) => {
    const actual = await importOriginal<typeof WebApiClientModule>();

    return {
      ...actual,
      DashboardClient: vi.fn<(...args: unknown[]) => unknown>(
        function DashboardClientMock() {
          return {
            setAuthToken: mocks.setAuthToken,
            getQuoteRequestAcceptedPDFByID:
              mocks.getQuoteRequestAcceptedPDFByID,
            getQuoteRequestRejectedPDFByID:
              mocks.getQuoteRequestRejectedPDFByID,
            getQuoteOfferPDFByQuoteID: mocks.getQuoteOfferPDFByQuoteID,
            getQuoteReportPDFByID: mocks.getQuoteReportPDFByID,
          };
        },
      ),
    } satisfies __ExactMockModule<__TestMockModule4>;
  },
);

vi.mock(
  import('../../../../ClientApp/src/storage/notification'),
  () =>
    ({
      setDashboardNotification: mocks.setDashboardNotification,
    }) satisfies __ExactMockModule<__TestMockModule46>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/common/openWindow'),
  () =>
    ({
      openUrlInSecureNewTab: mocks.openUrlInSecureNewTab,
      openPdfPageInSecureNewTab: mocks.openPdfPageInSecureNewTab,
    }) satisfies __ExactMockModule<__TestMockModule91>,
);

vi.mock(
  'react-ga4',
  () =>
    ({
      default: {
        send: vi.fn<(...args: unknown[]) => unknown>(),
      },
    }) satisfies __ExactMockModule<__TestMockModule1>,
);

const baseRequest = {
  crmQuoteRequestId: 'request-1',
  crmQuoteId: 'quote-1',
};

const resetHelperFunctionsState = () => {
  document.body.innerHTML = '';
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  mocks.getQuoteRequestAcceptedPDFByID.mockResolvedValue({
    fileData: 'accepted',
  });
  mocks.getQuoteRequestRejectedPDFByID.mockResolvedValue({
    fileData: 'rejected',
  });
  mocks.getQuoteOfferPDFByQuoteID.mockResolvedValue({ fileData: 'offer' });
  mocks.getQuoteReportPDFByID.mockResolvedValue({ fileData: 'report' });
};

describe('route common helper functions', () => {
  it('maps known API enum values and rejects unknown values', () => {
    expect(toStatusEnumDto(StatusEnumDto.QuoteAvailable)).toBe(
      StatusEnumDto.QuoteAvailable,
    );
    expect(toStatusEnumDto('server-added-status')).toBeUndefined();
    expect(
      toPatternApprovalStatusEnumDto(PatternApprovalStatusEnumDto.Completed),
    ).toBe(PatternApprovalStatusEnumDto.Completed);
    expect(
      toPatternApprovalStatusEnumDto('server-added-status'),
    ).toBeUndefined();
    expect(toFilterMessages(FilterMessages.ShowNmiMessages)).toBe(
      FilterMessages.ShowNmiMessages,
    );
    expect(toFilterMessages('server-added-filter')).toBeUndefined();
  });

  it('maps dashboard and workflow statuses without asserting unknown values', () => {
    expect(toDashboardTab('instruments')).toBe(DashboardTab.Instruments);
    expect(toDashboardTab('server-added-tab')).toBeUndefined();
    expect(toQuoteStatus(QuoteStatus.QuoteAccepted)).toBe(
      QuoteStatus.QuoteAccepted,
    );
    expect(toQuoteStatus('server-added-quote-status')).toBeUndefined();
    expect(toDashboardItemStatus('QuoteAvailable')).toBe(
      DashboardItemStatus.QuoteAvailable,
    );
    expect(
      toDashboardItemStatus('server-added-dashboard-status'),
    ).toBeUndefined();
    expect(toPaDashboardItemStatus('Completed')).toBe(
      PaDashboardItemStatus.PaCompleted,
    );
    expect(
      toPaDashboardItemStatus('server-added-application-status'),
    ).toBeUndefined();
  });

  it.each([
    [StatusEnumDto.Submitted, DashboardItemStatus.QuoteSubmitted],
    [StatusEnumDto.QuoteInProgress, DashboardItemStatus.QuoteInProgress],
    [StatusEnumDto.QuoteAvailable, DashboardItemStatus.QuoteAvailable],
    [StatusEnumDto.QuoteAccepted, DashboardItemStatus.QuoteAccepted],
    [StatusEnumDto.ReportInProgress, DashboardItemStatus.ReportInProgress],
    [StatusEnumDto.ReportIssued, DashboardItemStatus.ReportIssued],
    [StatusEnumDto.QuoteExpired, DashboardItemStatus.QuoteExpired],
    [StatusEnumDto.QuoteDeclined, DashboardItemStatus.QuoteDeclined],
    [StatusEnumDto.QuoteClosed, DashboardItemStatus.QuoteClosed],
    [StatusEnumDto.ArtefactReceived, DashboardItemStatus.ArtifactReceived],
  ])(
    'maps API status %s to the matching dashboard item status',
    (apiStatus, expected) => {
      expect(toDashboardItemStatus(apiStatus)).toBe(expected);
    },
  );

  it('returns a local dashboard item status without consulting the API mapping', () => {
    expect.hasAssertions();

    // QuoteDrafted is a local-only status (no API equivalent), so the early
    // local-enum return must fire before the API switch is reached.
    expect(toDashboardItemStatus(DashboardItemStatus.QuoteDrafted)).toBe(
      DashboardItemStatus.QuoteDrafted,
    );
    // An API status with no dashboard mapping falls through to undefined.
    expect(
      toDashboardItemStatus(StatusEnumDto.AwaitingClientInformation),
    ).toBeUndefined();
  });

  it.each([
    [StatusEnumDto.QuoteInProgress, QuoteStatus.QuoteInProgress],
    [StatusEnumDto.QuoteAvailable, QuoteStatus.QuoteAvailable],
    [StatusEnumDto.QuoteAccepted, QuoteStatus.QuoteAccepted],
    [StatusEnumDto.ReportInProgress, QuoteStatus.ReportInProgress],
    [StatusEnumDto.ReportIssued, QuoteStatus.ReportIssued],
    [StatusEnumDto.QuoteExpired, QuoteStatus.QuoteExpired],
    [StatusEnumDto.QuoteDeclined, QuoteStatus.QuoteDeclined],
    [StatusEnumDto.QuoteClosed, QuoteStatus.QuoteClosed],
    [StatusEnumDto.ArtefactReceived, QuoteStatus.ArtifactReceived],
  ])(
    'maps API status %s to the matching quote status',
    (apiStatus, expected) => {
      expect(toQuoteStatus(apiStatus)).toBe(expected);
    },
  );

  it('returns a local quote status without consulting the API mapping', () => {
    expect.hasAssertions();

    // 'Quote - In Progress' is a local QuoteStatus value with no identical API
    // enum string, so the early local-enum return fires before the API switch.
    expect(toQuoteStatus(QuoteStatus.QuoteInProgress)).toBe(
      QuoteStatus.QuoteInProgress,
    );
    // An API status with no quote mapping falls through to undefined.
    expect(
      toQuoteStatus(StatusEnumDto.AwaitingClientInformation),
    ).toBeUndefined();
  });

  it('locks the enum coincidences that keep two API status mappings dormant', () => {
    expect.hasAssertions();

    // toQuoteStatus's `case StatusEnumDto.Submitted` and the entire API switch
    // in toPaDashboardItemStatus are intentionally retained as defensive
    // mappings but are currently unreachable: the NSwag-generated API enums
    // share string values with the hand-maintained local enums, so the local
    // enum lookup always resolves first. These assertions fail the moment the
    // generated client diverges from enums.ts — the exact point at which that
    // dormant mapping code becomes load-bearing and must be exercised directly.
    expect(QuoteStatus.QuoteSubmitted).toBe(StatusEnumDto.Submitted);

    const localPaStatusValues = Object.values(PaDashboardItemStatus);
    for (const apiStatusValue of Object.values(PatternApprovalStatusEnumDto)) {
      expect(localPaStatusValues).toContain(apiStatusValue);
    }
  });

  it.each([
    [
      QuoteStatus.QuoteAccepted,
      'getQuoteRequestAcceptedPDFByID',
      ['request-1', true],
    ],
    [
      QuoteStatus.ArtifactReceived,
      'getQuoteRequestAcceptedPDFByID',
      ['request-1', true],
    ],
    [
      QuoteStatus.QuoteDeclined,
      'getQuoteRequestRejectedPDFByID',
      ['request-1', true],
    ],
    [
      QuoteStatus.QuoteAvailable,
      'getQuoteOfferPDFByQuoteID',
      ['quote-1', true],
    ],
    [QuoteStatus.QuoteClosed, 'getQuoteOfferPDFByQuoteID', ['quote-1', true]],
    [
      QuoteStatus.ReportInProgress,
      'getQuoteRequestAcceptedPDFByID',
      ['request-1', true],
    ],
  ])(
    'routes dashboard file downloads for %s',
    async (status, methodName, expectedArgs) => {
      expect.hasAssertions();

      resetHelperFunctionsState();

      await getFileDetails(
        'access-token',
        { ...baseRequest, quoteRequestStatus: status },
        true,
      );

      expect(DashboardClient).toHaveBeenCalledWith();
      expect(mocks.setAuthToken).toHaveBeenCalledWith('access-token');
      expect(mocks[methodName as keyof typeof mocks]).toHaveBeenCalledWith(
        ...expectedArgs,
      );
    },
  );

  it('routes report-issued dashboard downloads differently for quotation and measurement tabs', async () => {
    expect.hasAssertions();

    resetHelperFunctionsState();

    await getFileDetails(
      'token',
      { ...baseRequest, quoteRequestStatus: QuoteStatus.ReportIssued },
      false,
      true,
    );

    expect(mocks.getQuoteRequestAcceptedPDFByID).toHaveBeenCalledWith(
      'request-1',
      false,
    );

    await getFileDetails(
      'token',
      { ...baseRequest, quoteRequestStatus: QuoteStatus.ReportIssued },
      true,
      false,
    );

    expect(mocks.getQuoteReportPDFByID).toHaveBeenCalledWith('request-1', true);
  });

  it('resolves to undefined for statuses without downloadable files', async () => {
    expect.hasAssertions();

    resetHelperFunctionsState();

    await expect(
      getFileDetails(
        'token',
        { ...baseRequest, quoteRequestStatus: QuoteStatus.QuoteSubmitted },
        true,
      ),
    ).resolves.toBeUndefined();
    await expect(
      getQuotationFileDetails(
        'token',
        { ...baseRequest, quoteRequestStatus: QuoteStatus.QuoteSubmitted },
        true,
      ),
    ).resolves.toBeUndefined();
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
    expect.hasAssertions();

    resetHelperFunctionsState();

    await getQuotationFileDetails(
      'access-token',
      { ...baseRequest, quoteRequestStatus: status },
      false,
    );

    expect(mocks.setAuthToken).toHaveBeenCalledWith('access-token');

    const expectedId =
      methodName === 'getQuoteOfferPDFByQuoteID' ? 'quote-1' : 'request-1';

    expect(mocks[methodName as keyof typeof mocks]).toHaveBeenCalledWith(
      expectedId,
      false,
    );
  });

  it('maps known report statuses and rejects unknown values', () => {
    expect.hasAssertions();

    expect(toReportStatus(ReportStatus.Issued)).toBe(ReportStatus.Issued);
    expect(toReportStatus(ReportStatus.NotIssued)).toBe(ReportStatus.NotIssued);
    expect(toReportStatus('server-added-report-status')).toBeUndefined();
    expect(toReportStatus(undefined)).toBeUndefined();
  });

  it('formats make/model, file sizes, quote pages, addresses, and user profiles', () => {
    expect.hasAssertions();

    resetHelperFunctionsState();

    expect({
      makeModel: [
        getMakeModelDetails({
          quoteRequestStatus: QuoteStatus.ReportInProgress,
          portalArtefactName: 'Portal artefact',
        }),
        getMakeModelDetails({
          quoteRequestStatus: QuoteStatus.QuoteSubmitted,
          instrumentArtefactToBeCalibrated: 'Instrument',
        }),
        getMakeModelDetails({ quoteRequestStatus: QuoteStatus.QuoteSubmitted }),
        getMakeModelDetails({
          quoteRequestStatus: QuoteStatus.ArtifactReceived,
        }),
      ],
      sizes: [getFileSize(1024), getFileSize(2 * 1024 * 1024)],
      pages: [
        getQuoteOfferPageNumber(QuoteStatus.QuoteDeclined),
        getQuoteOfferPageNumber(QuoteStatus.QuoteAccepted),
        getQuoteOfferPageNumber(undefined),
      ],
      addresses: [
        getFormattedAddress({
          line1: '1 National Circuit',
          line2: 'Level 2',
          line3: 'Building A',
          suburb: 'Barton',
          state: State.ACT,
          postcode: '2600',
        }),
        getFormattedAddress({
          line1: '1 National Circuit',
          line2: 'Level 2',
          line3: '',
          suburb: 'Barton',
          state: State.ACT,
          postcode: '2600',
        }),
        getFormattedAddress(undefined),
      ],
      profile: mapToUserProfile({
        testingCalibrationDashboard: {
          filterYearType: '2026',
          filterStatusType: 'Open',
          filterSortOrder: 'Newest',
          filtersChanged: true,
          filterCurrentPage: 2,
          filterActiveTab: 'Quotation',
          filterSearchText: 'NMI',
        },
      }),
    }).toStrictEqual({
      makeModel: ['Portal artefact', 'Instrument', '', ''],
      sizes: ['1.00Kb', '2.00Mb'],
      pages: ['3', '5', '2'],
      addresses: [
        '1 National Circuit, Level 2, Building A,  Barton ACT 2600',
        '1 National Circuit, Level 2,  Barton ACT 2600',
        'No Address Found',
      ],
      profile: {
        filterYearType: '2026',
        filterStatusType: 'Open',
        filterSortOrder: 'Newest',
        filtersChanged: true,
        filterCurrentPage: 2,
        filterActiveTab: undefined,
        filterSearchText: 'NMI',
      },
    });
  });

  it('formats account and organisation display names across optional trading and branch names', () => {
    expect.hasAssertions();

    resetHelperFunctionsState();

    const details = (overrides: Partial<AccountDetails>): AccountDetails =>
      ({
        organisation: 'National Measurement Institute',
        trading: undefined,
        branch: undefined,
        ...overrides,
      }) as AccountDetails;

    expect({
      banners: [
        formatBannerTitle(
          details({ trading: 'NMI Trading', branch: 'Sydney' }),
        ),
        formatBannerTitle(details({ branch: 'Sydney' })),
        formatBannerTitle(details({})),
        formatBannerTitle(null),
      ],
      organisations: [
        formatOrganisationTitle('NMI', 'Trading', 'Branch'),
        formatOrganisationTitle('NMI', '', 'Branch'),
        formatOrganisationTitle('NMI', '', ''),
        formatOrganisationTitle(undefined, 'Trading', 'Branch'),
        formatOrganisationTitle(null, 'Trading', 'Branch'),
      ],
      tradingBranches: [
        formatTradingBranch(details({ trading: 'Trading', branch: 'Branch' })),
        formatTradingBranch(details({ branch: 'Branch' })),
        formatTradingBranch(null),
      ],
      strings: [
        formatTradingBranchFromStrings('Trading', 'Branch'),
        formatTradingBranchFromStrings('', 'Branch'),
        formatTradingBranchFromStrings('', ''),
        formatTradingBranchFromStrings(null, 'Branch'),
      ],
    }).toStrictEqual({
      banners: [
        'NMI Trading - Sydney - National Measurement Institute',
        'Sydney - National Measurement Institute',
        'National Measurement Institute',
        '',
      ],
      organisations: [
        'Trading - Branch - NMI',
        'Branch - NMI',
        'NMI',
        'Trading - Branch',
        '',
      ],
      tradingBranches: ['Trading - Branch', 'Branch', ''],
      strings: ['Trading - Branch', 'Branch', '', ''],
    });
  });

  it('treats an undefined trading or branch name as empty', () => {
    expect.hasAssertions();

    resetHelperFunctionsState();

    expect(formatTradingBranchFromStrings(undefined, undefined)).toBe('');
    expect(formatTradingBranchFromStrings('Trading', undefined)).toBe(
      'Trading',
    );
    expect(formatTradingBranchFromStrings(undefined, 'Branch')).toBe('Branch');

    // formatOrganisationTitle applies the same `?? ''` normalisation: undefined
    // trading and branch names collapse to empty, and with no org name either
    // the whole title is empty.
    expect(formatOrganisationTitle(undefined, undefined, undefined)).toBe('');
    expect(formatOrganisationTitle('NMI', undefined, undefined)).toBe('NMI');
  });

  it('creates file URLs, delegates secure open helpers, and triggers downloads', () => {
    expect.hasAssertions();

    resetHelperFunctionsState();

    const createObjectUrl = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:unit-test');
    const click = vi.fn<(...args: unknown[]) => unknown>();
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click,
    } as unknown as HTMLAnchorElement);

    const urls = [getFileUrlFromBase64('Zm9v'), getFileIdFromBase64('Zm9v')];

    openInNewTab('blob:unit-test');
    openPdfPageInNewTab('blob:unit-test', '5');

    expect(openUrlInSecureNewTab).toHaveBeenCalledWith('blob:unit-test');
    expect(openPdfPageInSecureNewTab).toHaveBeenCalledWith(
      'blob:unit-test',
      '5',
    );

    triggerDownload('blob:unit-test', 'quote.pdf');

    expect({
      urls,
      objectUrlCalls: createObjectUrl.mock.calls,
      openUrlCalls: vi.mocked(openUrlInSecureNewTab).mock.calls,
      openPdfCalls: vi.mocked(openPdfPageInSecureNewTab).mock.calls,
      elementCalls: createElement.mock.calls,
      clickCalls: click.mock.calls,
    }).toMatchObject({
      urls: ['blob:unit-test', 'blob:unit-test'],
      objectUrlCalls: [[expect.any(Blob)], [expect.any(Blob)]],
      openUrlCalls: [['blob:unit-test']],
      openPdfCalls: [['blob:unit-test', '5']],
      elementCalls: [['a']],
      clickCalls: [[]],
    });
  });

  it('sets dashboard notifications for report and unexpected errors', () => {
    expect.hasAssertions();

    resetHelperFunctionsState();

    vi.useFakeTimers();
    const notification = document.createElement('button');
    notification.id = '#notif-test';
    const scrollIntoView = vi
      .spyOn(notification, 'scrollIntoView')
      .mockImplementation(() => undefined);
    const focus = vi
      .spyOn(notification, 'focus')
      .mockImplementation(() => undefined);
    document.body.append(notification);
    vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => undefined);

    handleReportFileError();
    vi.runAllTimers();

    expect({
      scrollToCalls: vi.mocked(globalThis.scrollTo).mock.calls,
      scrollIntoViewCalls: scrollIntoView.mock.calls,
      focusCalls: focus.mock.calls,
    }).toMatchObject({
      scrollToCalls: [[0, 0]],
      scrollIntoViewCalls: [[{ behavior: 'smooth', block: 'start' }]],
      focusCalls: [[]],
    });

    handleUnexpectedError({ status: 500 });

    handleUnexpectedError({});

    const notificationCalls = vi.mocked(setDashboardNotification).mock.calls;

    expect({
      count: notificationCalls.length,
      firstSeverity: notificationCalls[0]?.[0].severity,
      firstMessageContains: notificationCalls[0]?.[0].message.includes(
        'unexpected error has occurred with downloading the PDF report',
      ),
      secondSeverity: notificationCalls[1]?.[0].severity,
      thirdSeverity: notificationCalls[2]?.[0].severity,
    }).toStrictEqual({
      count: 3,
      firstSeverity: NotificationSeverity.Error,
      firstMessageContains: true,
      secondSeverity: NotificationSeverity.Error,
      thirdSeverity: NotificationSeverity.Error,
    });
  });

  it.each([
    ['localhost', Environment.Local],
    ['portal.dev.example', Environment.Dev],
    ['portal.test.example', Environment.Test],
    ['portal.preprod.example', Environment.PreProd],
    ['portal.uat.example', Environment.UAT],
    ['portal.example', ''],
  ])('detects the %s environment', (hostname, expected) => {
    expect.hasAssertions();

    resetHelperFunctionsState();

    vi.spyOn(globalThis, 'location', 'get').mockReturnValue({
      ...globalThis.location,
      hostname,
    });

    expect(getEnvironment()).toBe(expected);
  });

  it('sends redacted GA events for PII fields and optional page views', () => {
    expect.hasAssertions();

    resetHelperFunctionsState();

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
    expect(ReactGA.send).toHaveBeenCalledWith({
      hitType: 'pageview',
      page: '/dashboard',
    });

    vi.mocked(ReactGA.send).mockClear();
    contentLoaded(false);

    expect(ReactGA.send).not.toHaveBeenCalledWith(
      expect.objectContaining({ hitType: 'pageview' }),
    );
  });

  it('defaults the redaction key to empty when a PII field has no dataset value', () => {
    expect.hasAssertions();

    resetHelperFunctionsState();

    // `DOMStringMap` indexing is typed `string | undefined`, so the source
    // guards the key with `?? ''`. A real `[data-pii]` element always yields a
    // string, so drive the guard with a field whose dataset omits the key.
    const fieldWithoutDatasetValue = { dataset: {} } as unknown as HTMLElement;
    const querySpy = vi
      .spyOn(document, 'querySelectorAll')
      .mockReturnValue([
        fieldWithoutDatasetValue,
      ] as unknown as NodeListOf<HTMLElement>);

    try {
      contentLoaded(false);
    } finally {
      querySpy.mockRestore();
    }

    expect(ReactGA.send).toHaveBeenCalledWith({
      hitType: 'event',
      category: 'form_viewed_sanitized',
      data: { '': '[REDACTED]' },
    });
  });

  it('sorts lists and moves the matching final item to the end', () => {
    expect.hasAssertions();

    resetHelperFunctionsState();

    const options = [
      { value: 'b', displayText: 'Beta' },
      { value: 'z', displayText: 'Zed' },
      { value: 'a', displayText: 'Alpha' },
    ];

    const [sortedOptions, lastOptionId] = sortList(
      options,
      'Ze',
      'displayText',
    );

    const [sortedDisplayTextOptions, lastDisplayTextOptionId] = sortList(
      [
        { value: 'b', displayText: 'Beta' },
        { value: 'z', displayText: 'Zed' },
        { value: 'a', displayText: 'Alpha' },
      ],
      'missing',
      'displayText',
    );

    const lookups = [
      { id: '2', name: 'Beta' },
      { id: '1', name: 'Alpha' },
    ];

    const [sortedLookups, lastLookupId] = sortList(lookups, 'missing', 'name');

    expect({
      options: [
        sortedOptions.map((option) => option.displayText),
        lastOptionId,
      ],
      displayText: [
        sortedDisplayTextOptions.map((option) => option.displayText),
        lastDisplayTextOptionId,
      ],
      lookups: [sortedLookups.map((lookup) => lookup.name), lastLookupId],
      empty: sortList([], 'anything', 'name'),
      undefined: sortList<{ name: string }>(undefined, 'anything', 'name'),
    }).toStrictEqual({
      options: [['Alpha', 'Beta', 'Zed'], 'z'],
      displayText: [['Alpha', 'Beta', 'Zed'], ''],
      lookups: [['Alpha', 'Beta'], ''],
      empty: [[], ''],
      undefined: [undefined, ''],
    });
  });

  it('covers empty address lines and unusual optional organisation fields', () => {
    expect.hasAssertions();

    resetHelperFunctionsState();

    expect(
      getFormattedAddress({
        line1: null as unknown as string,
        line2: null as unknown as string,
        line3: null as unknown as string,
        suburb: 'Canberra',
        state: State.ACT,
        postcode: '2600',
      }),
    ).toBe(' Canberra ACT 2600');

    expect(
      formatBannerTitle({
        organisation: 'National Measurement Institute',
        trading: '',
        branch: '',
      }),
    ).toBe('National Measurement Institute');

    expect(
      formatTradingBranch({
        organisation: 'National Measurement Institute',
        trading: 'Trading',
        branch: '',
      }),
    ).toBe('Trading');
  });

  it('classifies empty and syntactically valid GUID values', () => {
    expect.hasAssertions();

    resetHelperFunctionsState();

    expect({
      empty: [
        isEmptyGuid(undefined),
        isEmptyGuid('00000000-0000-0000-0000-000000000000'),
        isEmptyGuid('8fbbf0f8-a931-48c3-951b-944c9a08b6ef'),
      ],
      valid: [
        isValidGUID(undefined),
        isValidGUID('not-a-guid'),
        isValidGUID('8fbbf0f8-a931-48c3-951b-944c9a08b6ef'),
      ],
    }).toStrictEqual({
      empty: [true, true, false],
      valid: [false, false, true],
    });
  });

  it('sanitises unsafe markup before returning HTML', () => {
    expect.hasAssertions();

    resetHelperFunctionsState();

    expect(
      sanitiseHtml('<img src="x" onerror="alert(1)"><p>Safe copy</p>'),
    ).toBe('<img src="x"><p>Safe copy</p>');
  });

  it('opens downloaded file URLs in a secure new tab', () => {
    expect.hasAssertions();

    resetHelperFunctionsState();

    downloadFileFromUrl(
      'https://example.test/report.pdf',
      {},
      [],
      'report.pdf',
    );

    expect(openUrlInSecureNewTab).toHaveBeenCalledWith(
      'https://example.test/report.pdf',
    );
  });
});
