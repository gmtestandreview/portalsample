import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Link, MemoryRouter, Route, Routes } from 'react-router';
import findElementInTreeById from '../../../ClientApp/src/components/Utilities/findElementInTreeById';
import HashLink from '../../../ClientApp/src/components/Utilities/hashLink';
import MailingLabel from '../../../ClientApp/src/components/Utilities/mailingLabel';
import RouteChangeScrollTop from '../../../ClientApp/src/components/Utilities/routeChangeScrollTop';
import ViewMeasurementReport from '../../../ClientApp/src/components/Utilities/ViewMeasurementReport';
import ViewPdfButton from '../../../ClientApp/src/components/Utilities/ViewPdfButton';
import ViewPdfQuote from '../../../ClientApp/src/components/Utilities/ViewPdfQuote';
import ViewPdfQuoteTerms from '../../../ClientApp/src/components/Utilities/ViewPdfQuoteTerms';
import { trackGAEvent } from '../../../ClientApp/src/analytics/GoogleAnalytics';
import {
  getFileSize,
  getFileUrlFromBase64,
  getQuotationFileDetails,
  getQuoteOfferPageNumber,
  handleReportFileError,
  openInNewTab,
  openPdfPageInNewTab,
} from '../../../ClientApp/src/routes/common/helperFunctions';
import type {
  DashboardClient,
  RequestForQuoteDetails,
} from '../../../ClientApp/src/api/web-api-client';
import type AppLogger from '../../../ClientApp/src/instrumentation/AppLogger';
import type * as ApiModule from '../../../ClientApp/src/api/web-api-client';
import type { IMsalContext } from '@azure/msal-react';
import type * as MsalReactModule from '@azure/msal-react';
import type * as NotificationModule from '../../../ClientApp/src/storage/notification';
import { defined } from '../helpers/defined';

type BooleanSetter = (value: boolean) => void;

const mocks = vi.hoisted(() => {
  const acquireTokenSilent = vi.fn<() => Promise<{ accessToken: string }>>();
  const setAuthToken = vi.fn<DashboardClient['setAuthToken']>();
  const getQuoteReportPDFByID =
    vi.fn<DashboardClient['getQuoteReportPDFByID']>();

  return {
    acquireTokenSilent,
    getQuoteReportPDFByID,
    setAuthToken,
  };
});

vi.mock(import('@azure/msal-react'), async (importOriginal) => {
  const actual = await importOriginal<typeof MsalReactModule>();
  const { InteractionStatus, Logger, stubbedPublicClientApplication } =
    await import('@azure/msal-browser');
  const account = {
    homeAccountId: 'account-1',
    environment: 'test',
    tenantId: 'tenant-1',
    username: 'test@example.com',
    localAccountId: 'local-account-1',
  } satisfies IMsalContext['accounts'][number];
  const acquireTokenSilent = vi
    .spyOn(stubbedPublicClientApplication, 'acquireTokenSilent')
    .mockImplementation(async () => {
      const tokenResult = await mocks.acquireTokenSilent();
      return tokenResult as Awaited<
        ReturnType<typeof stubbedPublicClientApplication.acquireTokenSilent>
      >;
    });
  const msalContext: IMsalContext = {
    accounts: [account],
    inProgress: InteractionStatus.None,
    instance: {
      ...stubbedPublicClientApplication,
      acquireTokenSilent,
    },
    logger: new Logger({ loggerCallback: () => undefined }),
  };

  return {
    ...actual,
    useMsal: () => msalContext,
  } satisfies Partial<__TestMockModule2>;
});

vi.mock(
  import('../../../ClientApp/src/analytics/GoogleAnalytics'),
  () =>
    ({
      trackGAEvent: vi.fn<typeof trackGAEvent>(),
    }) satisfies __ExactMockModule<__TestMockModule22>,
);

vi.mock(
  import('../../../ClientApp/src/storage/notification'),
  () =>
    ({
      clearDashboardNotification:
        vi.fn<typeof NotificationModule.clearDashboardNotification>(),
    }) satisfies __ExactMockModule<__TestMockModule46>,
);

const mockAppLogger = vi.hoisted(() => {
  const MockAppLogger = {
    info: vi.fn<typeof AppLogger.info>(),
    warning: vi.fn<typeof AppLogger.warning>(),
    verbose: vi.fn<typeof AppLogger.verbose>(),
    critical: vi.fn<typeof AppLogger.critical>(),
    trace: vi.fn<typeof AppLogger.trace>(),
    error: vi.fn<typeof AppLogger.error>(),
    trackEvent: vi.fn<typeof AppLogger.trackEvent>(),
    startTrackPage: vi.fn<typeof AppLogger.startTrackPage>(),
    stopTrackPage: vi.fn<typeof AppLogger.stopTrackPage>(),
    startTrackEvent: vi.fn<typeof AppLogger.startTrackEvent>(),
    stopTrackEvent: vi.fn<typeof AppLogger.stopTrackEvent>(),
  };

  return MockAppLogger;
});

vi.mock(
  import('../../../ClientApp/src/instrumentation/AppLogger'),
  () => ({ default: mockAppLogger }) satisfies Partial<__TestMockModule5>,
);

vi.mock(
  import('../../../ClientApp/src/api/web-api-client'),
  async (importOriginal) => {
    const actual = await importOriginal<typeof ApiModule>();
    const MockDashboardClient = vi.fn<typeof actual.DashboardClient>(
      class extends actual.DashboardClient {
        constructor(
          ...args: ConstructorParameters<typeof actual.DashboardClient>
        ) {
          super(...args);
          Object.defineProperty(this, 'setAuthToken', {
            configurable: true,
            value: mocks.setAuthToken,
            writable: true,
          });
          this.getQuoteReportPDFByID = mocks.getQuoteReportPDFByID;
        }
      },
    );

    return {
      ...actual,
      DashboardClient: MockDashboardClient,
    } satisfies Partial<__TestMockModule4>;
  },
);

vi.mock(
  import('../../../ClientApp/src/routes/common/helperFunctions'),
  () =>
    ({
      getFileSize: vi.fn<typeof getFileSize>(
        (bytes: number) => `${bytes} bytes`,
      ),
      getFileUrlFromBase64: vi.fn<typeof getFileUrlFromBase64>(
        (fileData: string) => `blob:${fileData}`,
      ),
      getQuotationFileDetails: vi.fn<typeof getQuotationFileDetails>(),
      getQuoteOfferPageNumber: vi.fn<typeof getQuoteOfferPageNumber>(() => '5'),
      handleReportFileError: vi.fn<typeof handleReportFileError>(),
      openInNewTab: vi.fn<typeof openInNewTab>(),
      openPdfPageInNewTab: vi.fn<typeof openPdfPageInNewTab>(),
    }) satisfies __ExactMockModule<__TestMockModule9>,
);

const quotationData: RequestForQuoteDetails = {
  crmQuoteRequestId: 'crm-quote-1',
  quoteRequestStatus: 'QuoteAccepted',
};

const RouteHarness = ({ showTitle }: { showTitle: boolean }) => (
  <MemoryRouter initialEntries={['/first']}>
    {showTitle ? (
      <h1 id='page-title' tabIndex={-1}>
        Page title
      </h1>
    ) : (
      <div id='page-top' tabIndex={-1}>
        Top
      </div>
    )}
    <RouteChangeScrollTop />
    <Link to='/second'>Second page</Link>
    <Routes>
      <Route path='/first' element={<p>First</p>} />
      <Route path='/second' element={<p>Second</p>} />
    </Routes>
  </MemoryRouter>
);

describe('utility component coverage slice', () => {
  const originalClipboard = Object.getOwnPropertyDescriptor(
    navigator,
    'clipboard',
  );

  const resetUtilityCoverageState = () => {
    vi.clearAllMocks();
    vi.useRealTimers();
    document.body.innerHTML = '';
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'token-1' });
    mocks.getQuoteReportPDFByID.mockResolvedValue({ fileSizeBytes: 2048 });
    vi.mocked(getQuotationFileDetails).mockResolvedValue({
      fileSizeBytes: 4096,
    });
  };

  it('finds an ancestor by id and returns false for null or missing ancestors', () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    const wrapper = document.createElement('section');
    wrapper.id = 'wrapper-id';
    const child = document.createElement('div');
    const grandchild = document.createElement('button');
    wrapper.appendChild(child);
    child.appendChild(grandchild);

    expect(findElementInTreeById(grandchild, 'wrapper-id')).toBe(true);
    expect(findElementInTreeById(grandchild, 'missing-id')).toBe(false);
    expect(findElementInTreeById(null, 'wrapper-id')).toBe(false);
  });

  it('scrolls and focuses a hash target without an accordion delay', async () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    vi.useFakeTimers();
    const target = document.createElement('h2');
    target.id = 'target-section';
    target.tabIndex = -1;
    document.body.appendChild(target);
    const focus = vi.spyOn(target, 'focus');
    const scrollIntoView = vi.spyOn(target, 'scrollIntoView');

    render(
      <HashLink to='#target-section' scrollToBlock='center'>
        Target
      </HashLink>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'Target' }));
    await act(() => vi.runOnlyPendingTimers());

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
    expect(focus).toHaveBeenCalledWith();
  });

  it('expands a collapsed accordion before scrolling to a hash target', async () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    vi.useFakeTimers();
    document.body.innerHTML = `
            <div class="accordion-item">
                <button class="accordion-button collapsed">Section</button>
                <div class="accordion-collapse collapse">
                    <h2 id="inside-accordion" tabindex="-1">Inside accordion</h2>
                </div>
            </div>
        `;
    const target = defined(
      document.querySelector('#inside-accordion'),
      'accordion target heading',
    );
    const collapse = defined(
      document.querySelector('.accordion-collapse'),
      'accordion collapse panel',
    );
    const button = defined(
      document.querySelector('button'),
      'accordion toggle button',
    );
    const buttonClick = vi.spyOn(button, 'click');
    const scrollIntoView = vi.spyOn(target, 'scrollIntoView');

    render(<HashLink to='#inside-accordion'>Inside</HashLink>);
    fireEvent.click(screen.getByRole('link', { name: 'Inside' }));

    expect(collapse).toHaveAttribute(
      'class',
      'accordion-collapse collapse show',
    );
    expect(buttonClick).toHaveBeenCalledWith();
    expect(scrollIntoView).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTime(300));

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: undefined,
    });
  });

  it('scrolls to the top and focuses page title after route changes', async () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    vi.useFakeTimers();
    render(<RouteHarness showTitle />);
    const title = defined(
      document.querySelector<HTMLElement>('#page-title'),
      'page title',
    );
    const focus = vi.spyOn(title, 'focus');

    fireEvent.click(screen.getByRole('link', { name: 'Second page' }));
    await act(() => vi.advanceTimersByTime(600));

    expect(globalThis.scrollTo).toHaveBeenCalledWith(0, 0);
    expect(focus).toHaveBeenCalledWith();
  });

  it('focuses page top when the route has no page title', async () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    vi.useFakeTimers();
    render(<RouteHarness showTitle={false} />);
    const pageTop = defined(
      document.querySelector<HTMLElement>('#page-top'),
      'page top anchor',
    );
    const focus = vi.spyOn(pageTop, 'focus');

    fireEvent.click(screen.getByRole('link', { name: 'Second page' }));
    await act(() => vi.advanceTimersByTime(100));

    expect(focus).toHaveBeenCalledWith();
  });

  it('prints, copies and can hide mailing label actions', async () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    const print = vi
      .spyOn(globalThis, 'print')
      .mockImplementation(() => undefined);
    try {
      const writeText = vi
        .fn<(text: string) => Promise<void>>()
        .mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
      });

      const { rerender } = render(
        <MailingLabel
          quotationIdNum='Q-123'
          nmiTestOfficerName='Alex Officer'
          nmiFacilityName='NMI Lab'
          nmiFacilityAddress='1 Measurement Way'
        />,
      );
      Object.defineProperty(
        document.querySelector('#printable-label'),
        'innerText',
        {
          configurable: true,
          value:
            'Deliver to:\nQuotation ID: Q-123\nATTN: Alex Officer\nNMI Lab\n1 Measurement Way',
        },
      );

      fireEvent.click(screen.getByRole('button', { name: /print/i }));

      expect(print).toHaveBeenCalledWith();

      fireEvent.click(screen.getByRole('button', { name: /copy/i }));
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /copied/i }),
        ).toBeInTheDocument();
      });

      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining('Quotation ID: Q-123'),
      );

      rerender(<MailingLabel showPrintOrCopy={false} />);

      expect(
        screen.queryByRole('button', { name: /print/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /copy/i }),
      ).not.toBeInTheDocument();
    } finally {
      print.mockRestore();
    }
  });

  it('leaves the mailing label copy action available when clipboard copy fails', async () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    const writeText = vi
      .fn<(text: string) => Promise<void>>()
      .mockRejectedValue(new Error('copy failed'));
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
      });

      render(<MailingLabel quotationIdNum='Q-123' />);
      Object.defineProperty(
        document.querySelector('#printable-label'),
        'innerText',
        {
          configurable: true,
          value: 'Quotation ID: Q-123',
        },
      );

      fireEvent.click(screen.getByRole('button', { name: /copy/i }));

      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith('Quotation ID: Q-123');
      });

      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /copied/i }),
      ).not.toBeInTheDocument();
    } finally {
      log.mockRestore();
    }
  });

  it('renders loaded PDF buttons and tracks downloads', () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    const getPdf = vi.fn<() => void>();

    render(
      <ViewPdfButton
        text='Download PDF'
        fileSize='1.00Mb'
        isLoaded
        getPdf={getPdf}
        gaLabel='report'
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /download pdf/i }));

    expect(getPdf).toHaveBeenCalledExactlyOnceWith();
    expect(trackGAEvent).toHaveBeenCalledWith('report', 'download');
    expect(screen.getByText(/PDF file size 1.00Mb/i)).toBeInTheDocument();
  });

  it('renders loading state before a PDF button is loaded', () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    render(
      <ViewPdfButton
        text='Download PDF'
        fileSize=''
        isLoaded={false}
        getPdf={vi.fn<() => void>()}
        gaLabel='report'
      />,
    );

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /download pdf/i }),
    ).not.toBeInTheDocument();
  });

  it('loads and opens an offered quote PDF', async () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    vi.mocked(getQuotationFileDetails).mockImplementation(
      (_token, _data, getFile) =>
        Promise.resolve(
          getFile
            ? {
                fileData: 'quote-data',
                mimeType: 'application/pdf',
                filename: 'quote.pdf',
              }
            : ({ fileSizeBytes: 4096 } as any),
        ),
    );
    const setFileError = vi.fn<BooleanSetter>();
    const setIsLoading = vi.fn<BooleanSetter>();

    render(
      <ViewPdfQuote
        text='View quote'
        quotationData={quotationData}
        setFileError={setFileError}
        setIsLoading={setIsLoading}
      />,
    );

    await screen.findByRole('button', { name: /view quote/i });
    fireEvent.click(screen.getByRole('button', { name: /view quote/i }));

    await waitFor(() => {
      expect(openInNewTab).toHaveBeenCalledWith('blob:quote-data');
    });

    expect(getFileSize).toHaveBeenCalledWith(4096);
    expect(getFileUrlFromBase64).toHaveBeenCalledWith('quote-data');
    expect(setIsLoading).toHaveBeenNthCalledWith(1, true);
    expect(setFileError).toHaveBeenLastCalledWith(false);
  });

  it('reports an offered quote PDF size load failure', async () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    vi.mocked(getQuotationFileDetails).mockRejectedValueOnce(
      new Error('size failed'),
    );
    const setFileError = vi.fn<BooleanSetter>();

    render(
      <ViewPdfQuote
        text='View quote'
        quotationData={quotationData}
        setFileError={setFileError}
        setIsLoading={vi.fn<BooleanSetter>()}
      />,
    );

    await screen.findByRole('button', { name: /view quote/i });

    expect(setFileError).toHaveBeenCalledWith(true);
  });

  it('reports an offered quote PDF download failure', async () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    vi.mocked(getQuotationFileDetails).mockImplementation(
      (_token, _data, getFile) =>
        getFile
          ? Promise.reject(new Error('download failed'))
          : Promise.resolve({ fileSizeBytes: 4096 } as any),
    );
    const setFileError = vi.fn<BooleanSetter>();
    const setIsLoading = vi.fn<BooleanSetter>();

    render(
      <ViewPdfQuote
        text='View quote'
        quotationData={quotationData}
        setFileError={setFileError}
        setIsLoading={setIsLoading}
      />,
    );

    await screen.findByRole('button', { name: /view quote/i });
    fireEvent.click(screen.getByRole('button', { name: /view quote/i }));

    await waitFor(() => {
      expect(setFileError).toHaveBeenLastCalledWith(true);
    });

    expect(setIsLoading).toHaveBeenLastCalledWith(false);
  });

  it('loads and opens a measurement report PDF', async () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    mocks.getQuoteReportPDFByID.mockImplementation((_id, getFile) =>
      Promise.resolve(
        getFile
          ? {
              fileData: 'report-data',
              mimeType: 'application/pdf',
              filename: 'report.pdf',
            }
          : { fileSizeBytes: 8192 },
      ),
    );
    const setFileError = vi.fn<BooleanSetter>();
    const setIsLoading = vi.fn<BooleanSetter>();

    render(
      <ViewMeasurementReport
        text='View report'
        quotationData={quotationData}
        setFileError={setFileError}
        setIsLoading={setIsLoading}
      />,
    );

    await screen.findByRole('button', { name: /view report/i });
    fireEvent.click(screen.getByRole('button', { name: /view report/i }));

    await waitFor(() => {
      expect(openInNewTab).toHaveBeenCalledWith('blob:report-data');
    });

    expect(mocks.setAuthToken).toHaveBeenCalledWith('token-1');
    expect(mocks.getQuoteReportPDFByID).toHaveBeenCalledWith(
      'crm-quote-1',
      false,
    );
    expect(mocks.getQuoteReportPDFByID).toHaveBeenCalledWith(
      'crm-quote-1',
      true,
    );
    expect(setIsLoading).toHaveBeenCalledWith(false);
  });

  it('handles measurement report PDF download failures', async () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    mocks.getQuoteReportPDFByID.mockImplementation((_id, getFile) =>
      getFile
        ? Promise.reject(new Error('download failed'))
        : Promise.resolve({ fileSizeBytes: 8192 }),
    );
    const setFileError = vi.fn<BooleanSetter>();
    const setIsLoading = vi.fn<BooleanSetter>();

    render(
      <ViewMeasurementReport
        text='View report'
        quotationData={quotationData}
        setFileError={setFileError}
        setIsLoading={setIsLoading}
      />,
    );

    await screen.findByRole('button', { name: /view report/i });
    fireEvent.click(screen.getByRole('button', { name: /view report/i }));

    await waitFor(() => {
      expect(handleReportFileError).toHaveBeenCalledWith();
    });

    expect(setFileError).toHaveBeenLastCalledWith(true);
    expect(setIsLoading).toHaveBeenCalledWith(false);
  });

  it('handles measurement report PDF size load failures', async () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    mocks.getQuoteReportPDFByID.mockRejectedValueOnce(new Error('size failed'));
    const setFileError = vi.fn<BooleanSetter>();

    render(
      <ViewMeasurementReport
        text='View report'
        quotationData={quotationData}
        setFileError={setFileError}
        setIsLoading={vi.fn<BooleanSetter>()}
      />,
    );

    await screen.findByRole('button', { name: /view report/i });

    expect(handleReportFileError).toHaveBeenCalledWith();
    expect(setFileError).toHaveBeenCalledWith(true);
  });

  it('handles missing measurement report metadata and absent quotation data', async () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    mocks.getQuoteReportPDFByID.mockResolvedValue({});
    const setFileError = vi.fn<BooleanSetter>();
    const setIsLoading = vi.fn<BooleanSetter>();

    const { rerender } = render(
      <ViewMeasurementReport
        text='View report'
        quotationData={quotationData}
        setFileError={setFileError}
        setIsLoading={setIsLoading}
      />,
    );

    await screen.findByRole('button', { name: /view report/i });
    fireEvent.click(screen.getByRole('button', { name: /view report/i }));
    await waitFor(() => {
      expect(mocks.getQuoteReportPDFByID).toHaveBeenCalledWith(
        'crm-quote-1',
        true,
      );
    });

    expect(openInNewTab).not.toHaveBeenCalled();
    expect(getFileSize).not.toHaveBeenCalled();

    rerender(
      <ViewMeasurementReport
        text='View report'
        quotationData={undefined}
        setFileError={setFileError}
        setIsLoading={setIsLoading}
      />,
    );

    expect(
      screen.getByRole('button', { name: /view report/i }),
    ).toBeInTheDocument();
  });

  it('does not request measurement report PDFs when the report id is missing', async () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    const setFileError = vi.fn<BooleanSetter>();
    const setIsLoading = vi.fn<BooleanSetter>();

    render(
      <ViewMeasurementReport
        text='View report'
        quotationData={{ quoteRequestStatus: 'QuoteAccepted' }}
        setFileError={setFileError}
        setIsLoading={setIsLoading}
      />,
    );

    await screen.findByRole('button', { name: /view report/i });
    fireEvent.click(screen.getByRole('button', { name: /view report/i }));

    expect(mocks.acquireTokenSilent).not.toHaveBeenCalled();
    expect(mocks.getQuoteReportPDFByID).not.toHaveBeenCalled();
    expect(openInNewTab).not.toHaveBeenCalled();
    expect(setIsLoading).toHaveBeenCalledWith(false);
  });

  it('does not open quote PDFs when file metadata is incomplete', async () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    vi.mocked(getQuotationFileDetails).mockResolvedValue({});

    render(
      <ViewPdfQuote
        text='View quote'
        quotationData={quotationData}
        setFileError={vi.fn<BooleanSetter>()}
        setIsLoading={vi.fn<BooleanSetter>()}
      />,
    );

    await screen.findByRole('button', { name: /view quote/i });
    fireEvent.click(screen.getByRole('button', { name: /view quote/i }));
    await waitFor(() => {
      expect(getQuotationFileDetails).toHaveBeenCalledWith(
        'token-1',
        quotationData,
        true,
      );
    });

    expect(openInNewTab).not.toHaveBeenCalled();
    expect(getFileSize).not.toHaveBeenCalled();
  });

  it('opens quote terms at the computed PDF page and tracks the click', async () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    vi.mocked(getQuotationFileDetails).mockResolvedValueOnce({
      fileData: 'terms-data',
      mimeType: 'application/pdf',
      filename: 'quote.pdf',
    });
    vi.mocked(getQuoteOfferPageNumber).mockReturnValueOnce('3');
    const setIsLoading = vi.fn<BooleanSetter>();

    render(
      <ViewPdfQuoteTerms
        prefixText='Read the '
        suffixText=' before continuing.'
        quotationData={{
          ...quotationData,
          quoteRequestStatus: 'QuoteDeclined',
        }}
        setFileError={vi.fn<BooleanSetter>()}
        setIsLoading={setIsLoading}
      />,
    );

    fireEvent.click(screen.getByText('Terms'));

    await waitFor(() => {
      expect(openPdfPageInNewTab).toHaveBeenCalledWith('blob:terms-data', '3');
    });

    expect(trackGAEvent).toHaveBeenCalledWith('Terms', 'download');
    expect(setIsLoading).toHaveBeenNthCalledWith(1, true);
    expect(setIsLoading).toHaveBeenLastCalledWith(false);
  });

  it('sets a file error when quote terms cannot be downloaded', async () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    vi.mocked(getQuotationFileDetails).mockRejectedValueOnce(
      new Error('terms failed'),
    );
    const setFileError = vi.fn<BooleanSetter>();
    const setIsLoading = vi.fn<BooleanSetter>();

    render(
      <ViewPdfQuoteTerms
        prefixText='Read the '
        suffixText=' before continuing.'
        quotationData={quotationData}
        setFileError={setFileError}
        setIsLoading={setIsLoading}
      />,
    );

    fireEvent.click(screen.getByText('Terms'));

    await waitFor(() => {
      expect(setFileError).toHaveBeenCalledWith(true);
    });

    expect(setIsLoading).toHaveBeenLastCalledWith(false);
  });

  it('does not open quote terms when file metadata is incomplete', async () => {
    expect.hasAssertions();

    resetUtilityCoverageState();

    vi.mocked(getQuotationFileDetails).mockResolvedValueOnce({});

    render(
      <ViewPdfQuoteTerms
        prefixText='Read the '
        suffixText=' before continuing.'
        quotationData={quotationData}
        setFileError={vi.fn<BooleanSetter>()}
        setIsLoading={vi.fn<BooleanSetter>()}
      />,
    );

    fireEvent.click(screen.getByText('Terms'));

    await waitFor(() => {
      expect(getQuotationFileDetails).toHaveBeenCalledWith(
        'token-1',
        quotationData,
        true,
      );
    });

    expect(openPdfPageInNewTab).not.toHaveBeenCalled();
  });
});
