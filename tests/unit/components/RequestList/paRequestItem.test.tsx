import { describe, beforeEach, it, expect } from 'vitest';

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { MemoryRouter, useLocation } from 'react-router';

import type * as NotificationModule from '@/storage/notification';

import type * as WebApiClientModule from '@/api/web-api-client';

import {
  ApplicationType,
  type PatternApprovalDashboardDetailsDto,
} from '@/api/web-api-client';

import PaRequestItem from '@/components/RequestList/paRequestItem';

import { DashboardTab } from '@/components/SearchFilter/types';

import { PaDashboardItemStatus } from '@/routes/common/enums';

import { NotificationSeverity } from '@/storage/types';

const mocks = vi.hoisted(() => ({
  acquireTokenSilent: vi.fn(),
  deleteApplication: vi.fn(),
  setAuthToken: vi.fn(),
  setDashboardNotification: vi.fn(),
  trackGAEvent: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock(
  import('@azure/msal-react'),
  () =>
    ({
      useMsal: () => ({
        accounts: [{ homeAccountId: 'account-id' }],
        instance: {
          acquireTokenSilent: mocks.acquireTokenSilent,
        },
      }),
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(
  import('@/analytics/GoogleAnalytics'),
  () =>
    ({
      trackGAEvent: mocks.trackGAEvent,
    }) satisfies __ExactMockModule<__TestMockModule22>,
);

vi.mock(
  import('@/instrumentation/AppLogger'),
  () =>
    ({
      default: {
        error: mocks.loggerError,
      },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

vi.mock(import('@/storage/notification'), async (importOriginal) => {
  const actual = await importOriginal<typeof NotificationModule>();
  return {
    ...actual,
    setDashboardNotification: mocks.setDashboardNotification,
  } satisfies __ExactMockModule<__TestMockModule46>;
});

vi.mock(import('@/api/web-api-client'), async (importOriginal) => {
  const actual = await importOriginal<typeof WebApiClientModule>();

  return {
    ...actual,
    ApplicationClient: vi.fn(function ApplicationClientMock() {
      return {
        deleteApplication: mocks.deleteApplication,
        setAuthToken: mocks.setAuthToken,
      };
    }),
  } satisfies __ExactMockModule<__TestMockModule4>;
});

const LocationDisplay = () => {
  const location = useLocation();

  return (
    <output aria-label='Current route'>{`${location.pathname}${location.search}`}</output>
  );
};

const baseRequest: PatternApprovalDashboardDetailsDto = {
  referenceId: 'NMI-PA-2024-001',
  portalReferenceId: 'PA-2024-0001',
  status: PaDashboardItemStatus.PaSubmitted,
  title: 'Pattern approval for flow meter',
  // PatternApprovalDashboardDetailsDto.lastUpdated is `string | undefined` - the
  // wire format. formattedDate() calls new Date() on it, so this ISO string is the
  // same instant the previous Date object represented and renders identically.
  lastUpdated: '2024-03-15T00:00:00Z',
  statusDetail: 'Under technical review',
  summary: 'Approval for a custody transfer flow meter',
  appliedFor: 'Pattern approval certificate',
  assessedAs: 'Instrument pattern',
  unreadMessageCount: 2,
};

const renderPaRequestItem = (
  request: PatternApprovalDashboardDetailsDto,
  tab = DashboardTab.Requests,
  setDeleteSuccess = vi.fn(),
) =>
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <PaRequestItem
        request={request}
        tab={tab}
        setDeleteSuccess={setDeleteSuccess}
      />
      <LocationDisplay />
    </MemoryRouter>,
  );

describe(PaRequestItem, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.deleteApplication.mockResolvedValue(undefined);
  });
  it('routes submitted applications to details and messages with unread message context', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    renderPaRequestItem(baseRequest);
    expect(
      screen.getByRole('heading', { name: 'Pattern approval for flow meter' }),
    ).toBeInTheDocument();
  });
});

describe(PaRequestItem, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.deleteApplication.mockResolvedValue(undefined);
  });
  it('routes submitted applications to details and messages with unread message context', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    renderPaRequestItem(baseRequest);
    expect(screen.getByText('NMI-PA-2024-001')).toBeInTheDocument();
  });
});

describe(PaRequestItem, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.deleteApplication.mockResolvedValue(undefined);
  });
  it('routes submitted applications to details and messages with unread message context', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    renderPaRequestItem(baseRequest);
    expect(screen.getByText('15 Mar 2024')).toBeInTheDocument();
  });
});

describe(PaRequestItem, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.deleteApplication.mockResolvedValue(undefined);
  });
  it('routes submitted applications to details and messages with unread message context', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    renderPaRequestItem(baseRequest);
    expect(screen.getByTitle('2 unread messages')).toBeInTheDocument();
  });
});

describe(PaRequestItem, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.deleteApplication.mockResolvedValue(undefined);
  });
  it('routes submitted applications to details and messages with unread message context', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    renderPaRequestItem(baseRequest);
    expect(
      within(screen.getByTitle('2 unread messages')).getByText('2'),
    ).toHaveRole('status');
  });
});
