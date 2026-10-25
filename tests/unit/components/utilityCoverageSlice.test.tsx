import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

import { DashboardClient } from '../../../ClientApp/src/api/web-api-client';

const mocks = vi.hoisted(() => {
  const acquireTokenSilent = vi.fn();
  const getQuoteReportPDFByID = vi.fn();

  return {
    acquireTokenSilent,
    getQuoteReportPDFByID,
  };
});

vi.mock(
  import('@azure/msal-react'),
  () =>
    ({
      useMsal: () => ({
        accounts: [{ homeAccountId: 'account-1' }],
        instance: {
          acquireTokenSilent: mocks.acquireTokenSilent,
        },
      }),
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(
  import('../../../ClientApp/src/analytics/GoogleAnalytics'),
  () =>
    ({
      trackGAEvent: vi.fn(),
    }) satisfies __ExactMockModule<__TestMockModule22>,
);

vi.mock(
  import('../../../ClientApp/src/storage/notification'),
  () =>
    ({
      clearDashboardNotification: vi.fn(),
    }) satisfies __ExactMockModule<__TestMockModule46>,
);

vi.mock(
  import('../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: {
        verbose: vi.fn(),
        error: vi.fn(),
      },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

vi.mock(
  import('../../../ClientApp/src/api/web-api-client'),
  () =>
    ({
      DashboardClient: vi.fn(function (this: {
        setAuthToken: ReturnType<typeof vi.fn>;
        getQuoteReportPDFByID: ReturnType<typeof vi.fn>;
      }) {
        vi.spyOn(this, 'setAuthToken').mockImplementation();
        this.getQuoteReportPDFByID = mocks.getQuoteReportPDFByID;
      }),
    }) satisfies __ExactMockModule<__TestMockModule4>,
);

vi.mock(
  import('../../../ClientApp/src/routes/common/helperFunctions'),
  () =>
    ({
      getFileSize: vi.fn((bytes: number) => `${bytes} bytes`),
      getFileUrlFromBase64: vi.fn((fileData: string) => `blob:${fileData}`),
      getQuotationFileDetails: vi.fn(),
      getQuoteOfferPageNumber: vi.fn(() => '5'),
      handleReportFileError: vi.fn(),
      openInNewTab: vi.fn(),
      openPdfPageInNewTab: vi.fn(),
    }) satisfies __ExactMockModule<__TestMockModule9>,
);

const quotationData = {
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
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'token-1' });
    mocks.getQuoteReportPDFByID.mockResolvedValue({ fileSizeBytes: 2048 });
    vi.mocked(getQuotationFileDetails).mockResolvedValue({
      fileSizeBytes: 4096,
    } as any);
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
    vi.restoreAllMocks();
  });
  it('finds an ancestor by id and returns false for null or missing ancestors', () => {
    expect.assertions(3);
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
});

describe('utility component coverage slice', () => {
  const originalClipboard = Object.getOwnPropertyDescriptor(
    navigator,
    'clipboard',
  );
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'token-1' });
    mocks.getQuoteReportPDFByID.mockResolvedValue({ fileSizeBytes: 2048 });
    vi.mocked(getQuotationFileDetails).mockResolvedValue({
      fileSizeBytes: 4096,
    } as any);
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
    vi.restoreAllMocks();
  });
  it('scrolls and focuses a hash target without an accordion delay', () => {
    expect.assertions(2);
    vi.useFakeTimers();
    const target = document.createElement('h2');
    target.id = 'target-section';
    target.tabIndex = -1;
    document.body.appendChild(target);
    const focus = vi.spyOn(target, 'focus');

    render(
      <HashLink to='#target-section' scrollToBlock='center'>
        Target
      </HashLink>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'Target' }));
    act(() => vi.runOnlyPendingTimers());

    expect(target.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
    expect(focus).toHaveBeenCalledWith();
  });
});
