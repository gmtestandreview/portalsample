import ReactGA from 'react-ga4';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  openInNewTab,
  openPdfPageInNewTab,
  sanitiseHtml,
  sortList,
  triggerDownload,
  downloadFileFromUrl,
} from '../../../../ClientApp/src/routes/common/helperFunctions';

import {
  Environment,
  QuoteStatus,
} from '../../../../ClientApp/src/routes/common/enums';

import {
  openPdfPageInSecureNewTab,
  openUrlInSecureNewTab,
} from '../../../../ClientApp/src/routes/common/openWindow';

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

vi.mock(
  import('../../../../ClientApp/src/api/web-api-client'),
  async (importOriginal) => {
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
  import('react-ga4'),
  () =>
    ({
      default: {
        send: vi.fn(),
      },
    }) satisfies __ExactMockModule<__TestMockModule1>,
);

const baseRequest = {
  crmQuoteRequestId: 'request-1',
  crmQuoteId: 'quote-1',
};

describe('route common helper functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getQuoteRequestAcceptedPDFByID.mockResolvedValue({
      fileData: 'accepted',
    });
    mocks.getQuoteRequestRejectedPDFByID.mockResolvedValue({
      fileData: 'rejected',
    });
    mocks.getQuoteOfferPDFByQuoteID.mockResolvedValue({ fileData: 'offer' });
    mocks.getQuoteReportPDFByID.mockResolvedValue({ fileData: 'report' });
  });
  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
    vi.restoreAllMocks();
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
      expect.assertions(3);
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
});

describe('route common helper functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getQuoteRequestAcceptedPDFByID.mockResolvedValue({
      fileData: 'accepted',
    });
    mocks.getQuoteRequestRejectedPDFByID.mockResolvedValue({
      fileData: 'rejected',
    });
    mocks.getQuoteOfferPDFByQuoteID.mockResolvedValue({ fileData: 'offer' });
    mocks.getQuoteReportPDFByID.mockResolvedValue({ fileData: 'report' });
  });
  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
  it('routes report-issued dashboard downloads differently for quotation and measurement tabs', async () => {
    expect.assertions(2);
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
});
