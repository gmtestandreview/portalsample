import { describe, beforeEach, it, expect, vi } from 'vitest';
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
import type {
  AccountInfo,
  AuthenticationResult,
  IPublicClientApplication,
} from '@azure/msal-browser';
import type * as MsalReactModule from '@azure/msal-react';
import type { ApplicationClient } from '@/api/web-api-client';
import type AppLogger from '@/instrumentation/AppLogger';
import type * as GoogleAnalyticsModule from '@/analytics/GoogleAnalytics';
import type { trackGAEvent } from '@/analytics/GoogleAnalytics';
import type * as AppLoggerModule from '@/instrumentation/AppLogger';
import {
  ApplicationType,
  type PatternApprovalDashboardDetailsDto,
} from '@/api/web-api-client';
import PaRequestItem from '@/components/RequestList/paRequestItem';
import { DashboardTab } from '@/components/SearchFilter/types';
import { PaDashboardItemStatus } from '@/routes/common/enums';
import { NotificationSeverity } from '@/storage/types';

const mocks = vi.hoisted(() => ({
  acquireTokenSilent: vi.fn<IPublicClientApplication['acquireTokenSilent']>(),
  deleteApplication: vi.fn<ApplicationClient['deleteApplication']>(),
  setAuthToken: vi.fn<ApplicationClient['setAuthToken']>(),
  setDashboardNotification:
    vi.fn<typeof NotificationModule.setDashboardNotification>(),
  trackGAEvent: vi.fn<typeof trackGAEvent>(),
  loggerError: vi.fn<typeof AppLogger.error>(),
}));

vi.mock('@azure/msal-react', async (importOriginal) => {
  const actual = await importOriginal<typeof MsalReactModule>();

  return {
    ...actual,
    useMsal: () => ({
      accounts: [{ homeAccountId: 'account-id' }],
      instance: {
        acquireTokenSilent: mocks.acquireTokenSilent,
      },
    }),
  } satisfies __ExactMockModule<__TestMockModule2>;
});

vi.mock('@/analytics/GoogleAnalytics', async (importOriginal) => {
  const actual = await importOriginal<typeof GoogleAnalyticsModule>();

  return {
    ...actual,
    trackGAEvent: mocks.trackGAEvent,
  } satisfies __ExactMockModule<__TestMockModule22>;
});

vi.mock('@/instrumentation/AppLogger', async (importOriginal) => {
  const actual = await importOriginal<typeof AppLoggerModule>();

  return {
    ...actual,
    default: { ...actual.default, error: mocks.loggerError },
  } satisfies __ExactMockModule<__TestMockModule5>;
});

vi.mock('@/storage/notification', async (importOriginal) => {
  const actual = await importOriginal<typeof NotificationModule>();
  return {
    ...actual,
    setDashboardNotification: mocks.setDashboardNotification,
  } satisfies __ExactMockModule<__TestMockModule46>;
});

vi.mock('@/api/web-api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof WebApiClientModule>();

  return {
    ...actual,
    ApplicationClient: class extends actual.ApplicationClient {
      override deleteApplication = mocks.deleteApplication;
      override setAuthToken = mocks.setAuthToken;
    },
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
  setDeleteSuccess = vi.fn<(success: boolean) => void>(),
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
    mocks.acquireTokenSilent.mockResolvedValue({
      authority: 'https://login.microsoftonline.com/tenant-id',
      uniqueId: 'unique-id',
      tenantId: 'tenant-id',
      scopes: ['scope'],
      account: {
        homeAccountId: 'account-id',
        environment: 'login.microsoftonline.com',
        tenantId: 'tenant-id',
        username: 'test@example.com',
        localAccountId: 'local-account-id',
      } satisfies AccountInfo,
      idToken: 'id-token',
      idTokenClaims: {},
      accessToken: 'access-token',
      fromCache: false,
      expiresOn: null,
      tokenType: 'Bearer',
      correlationId: 'correlation-id',
    } satisfies AuthenticationResult & { account: AccountInfo });
    mocks.deleteApplication.mockResolvedValue(undefined);
  });

  it('routes submitted applications to details and messages with unread message context', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    renderPaRequestItem(baseRequest);

    expect({
      heading: screen.getByRole('heading', {
        name: 'Pattern approval for flow meter',
      }),
      reference: screen.getByText('NMI-PA-2024-001'),
      date: screen.getByText('15 Mar 2024'),
      unreadTitle: screen.getByTitle('2 unread messages'),
    }).toMatchObject({
      heading: expect.anything(),
      reference: expect.anything(),
      date: expect.anything(),
      unreadTitle: expect.anything(),
    });
    expect(
      within(screen.getByTitle('2 unread messages')).getByText('2'),
    ).toHaveRole('status');

    await user.click(
      screen.getByRole('button', { name: 'View application details' }),
    );

    expect({
      route: screen.getByRole('status', { name: 'Current route' }).textContent,
      event: mocks.trackGAEvent.mock.calls.at(-1)?.[0],
    }).toStrictEqual({
      route: '/ta/PA-2024-0001/manage',
      event: 'Application item/view details',
    });

    await user.click(screen.getByRole('button', { name: /messages/i }));

    expect({
      route: screen.getByRole('status', { name: 'Current route' }).textContent,
      event: mocks.trackGAEvent.mock.calls.at(-1)?.[0],
    }).toStrictEqual({
      route: '/ta/PA-2024-0001/manage?tab=messages',
      event: 'Application item/view messages',
    });

    await user.click(screen.getByRole('button', { name: 'Actions' }));

    const detailsMenuItem = await screen.findByRole('menuitem', {
      name: 'View application details',
    });

    await user.click(
      screen.getByRole('menuitem', { name: 'View application details' }),
    );

    expect({
      menuHref: detailsMenuItem.getAttribute('href'),
      event: mocks.trackGAEvent.mock.calls.at(-1)?.[0],
    }).toStrictEqual({
      menuHref: '/ta/PA-2024-0001/manage',
      event: 'Viewapplicationdetails',
    });
  });

  it.each([
    PaDashboardItemStatus.PaSubmitted,
    PaDashboardItemStatus.PaInProgress,
    PaDashboardItemStatus.PaOnHold,
    PaDashboardItemStatus.PaCompleted,
  ])(
    'offers details and messages actions for %s applications',
    async (status) => {
      expect.hasAssertions();

      const user = userEvent.setup();
      renderPaRequestItem({
        ...baseRequest,
        status,
        portalReferenceId: `PA-${status}`,
      });

      await user.click(screen.getByRole('button', { name: 'Actions' }));

      await expect(
        screen.findByRole('menuitem', {
          name: 'View application details',
        }),
      ).resolves.toHaveAttribute('href', `/ta/PA-${status}/manage`);
      expect(
        screen.getByRole('menuitem', { name: 'View messages' }),
      ).toBeInTheDocument();
    },
  );

  it('resumes draft applications and deletes them after confirmation', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const setDeleteSuccess = vi.fn<(success: boolean) => void>();
    const {
      title: _title,
      lastUpdated: _lastUpdated,
      unreadMessageCount: _unreadMessageCount,
      ...draftRequest
    } = baseRequest;

    renderPaRequestItem(
      {
        ...draftRequest,
        status: PaDashboardItemStatus.PaDraft,
      },
      DashboardTab.Drafts,
      setDeleteSuccess,
    );

    expect({
      heading: screen.getByRole('heading', { name: 'Draft request for Quote' }),
      messagesButton: screen.queryByRole('button', { name: /messages/i }),
    }).toMatchObject({
      heading: expect.anything(),
      messagesButton: null,
    });

    await user.click(
      screen.getByRole('button', { name: 'Resume application' }),
    );

    expect({
      route: screen.getByRole('status', { name: 'Current route' }).textContent,
      event: mocks.trackGAEvent.mock.calls.at(-1)?.[0],
    }).toStrictEqual({
      route: '/ta/PA-2024-0001',
      event: 'Application item/resume application',
    });

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    const resumeAction = await screen.findByRole('menuitem', {
      name: 'Resume application',
    });

    await user.click(resumeAction);
    const editEvent = mocks.trackGAEvent.mock.calls.at(-1)?.[0];

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(
      screen.getByRole('menuitem', { name: 'Delete application' }),
    );

    const confirmationDialog = screen.getByRole('dialog', {
      name: 'Confirm deletion',
    });

    await user.click(
      screen.getByRole('button', { name: 'Yes, delete application' }),
    );

    await waitFor(() =>
      expect({
        deleteSuccess: setDeleteSuccess.mock.calls.at(-1)?.[0],
        tokenAccount: mocks.acquireTokenSilent.mock.calls.at(-1)?.[0].account,
        authToken: mocks.setAuthToken.mock.calls.at(-1)?.[0],
        deleteApplication: mocks.deleteApplication.mock.calls.at(-1),
        notification: mocks.setDashboardNotification.mock.calls.at(-1)?.[0],
        deleteEvent: mocks.trackGAEvent.mock.calls.at(-1)?.[0],
      }).toMatchObject({
        deleteSuccess: true,
        tokenAccount: expect.objectContaining({ homeAccountId: 'account-id' }),
        authToken: 'access-token',
        deleteApplication: [
          'PA-2024-0001',
          { applicationType: ApplicationType.PatternApproval },
        ],
        notification: {
          message: 'The draft request has been successfully deleted',
          severity: NotificationSeverity.Success,
        },
        deleteEvent: 'Deleteapplication',
      }),
    );

    expect({
      resumeHref: resumeAction.getAttribute('href'),
      editEvent,
      dialogText: confirmationDialog.textContent,
    }).toMatchObject({
      resumeHref: '/ta/PA-2024-0001',
      editEvent: 'Editapplication',
      dialogText: expect.stringContaining('PA-2024-0001'),
    });
  });

  it('logs and closes the confirmation modal when draft deletion fails', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const setDeleteSuccess = vi.fn<(success: boolean) => void>();
    const deleteError = new Error('delete failed');
    mocks.deleteApplication.mockRejectedValue(deleteError);

    renderPaRequestItem(
      {
        ...baseRequest,
        status: PaDashboardItemStatus.PaDraft,
      },
      DashboardTab.Drafts,
      setDeleteSuccess,
    );

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(
      await screen.findByRole('menuitem', { name: 'Delete application' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Yes, delete application' }),
    );

    await waitFor(() =>
      expect(mocks.loggerError).toHaveBeenCalledWith(
        'Failed to delete application: PA-2024-0001',
        deleteError,
      ),
    );

    expect(setDeleteSuccess).not.toHaveBeenCalled();
    expect(mocks.setDashboardNotification).not.toHaveBeenCalled();

    // Awaited rather than asserted outright: the modal fades before it leaves the DOM, and the
    // logger call above lands first. Checking synchronously passed locally and failed on the CI
    // runner, which is slow enough for the fade to still be in flight.
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Confirm deletion' }),
      ).not.toBeInTheDocument(),
    );
  });

  it.each([undefined, ''])(
    'does not open draft deletion confirmation without a reference ID (%s)',
    async (portalReferenceId) => {
      expect.hasAssertions();

      const user = userEvent.setup();
      const {
        portalReferenceId: _basePortalReferenceId,
        ...requestWithoutPortalReferenceId
      } = baseRequest;
      const request =
        portalReferenceId === undefined
          ? requestWithoutPortalReferenceId
          : { ...baseRequest, portalReferenceId };

      renderPaRequestItem({
        ...request,
        status: PaDashboardItemStatus.PaDraft,
      });

      await user.click(screen.getByRole('button', { name: 'Actions' }));
      await user.click(
        screen.getByRole('menuitem', { name: 'Delete application' }),
      );

      expect(
        screen.queryByRole('dialog', { name: 'Confirm deletion' }),
      ).not.toBeInTheDocument();
      expect(mocks.acquireTokenSilent).not.toHaveBeenCalled();
      expect(mocks.deleteApplication).not.toHaveBeenCalled();
    },
  );

  it('uses the manage route and zero-message state for unrecognised non-draft statuses', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const { container } = renderPaRequestItem({
      ...baseRequest,
      status: 'Archived',
      unreadMessageCount: undefined,
    });
    const card = container.querySelector('#RefId-PA-2024-0001');

    expect({
      initialLabel: card?.getAttribute('aria-labelledby'),
      unreadTitle: screen.getByTitle('0 unread messages'),
      unreadStatus: screen.queryByRole('status', { name: '0' }),
    }).toMatchObject({
      initialLabel: 'card-summary-PA-2024-0001',
      unreadTitle: expect.anything(),
      unreadStatus: null,
    });

    fireEvent.focus(card as HTMLElement);
    await waitFor(() => expect(card).toHaveAttribute('aria-labelledby', ''));
    fireEvent.blur(card as HTMLElement);
    await waitFor(() =>
      expect(card).toHaveAttribute(
        'aria-labelledby',
        'card-summary-PA-2024-0001',
      ),
    );

    await user.click(
      screen.getByRole('button', { name: 'Resume application' }),
    );

    expect(
      screen.getByRole('status', { name: 'Current route' }),
    ).toHaveTextContent('/ta/PA-2024-0001/manage');

    await user.click(screen.getByRole('button', { name: 'Actions' }));

    expect({
      viewDetails: screen.queryByRole('menuitem', {
        name: 'View application details',
      }),
      deleteApplication: screen.queryByRole('menuitem', {
        name: 'Delete application',
      }),
    }).toStrictEqual({ viewDetails: null, deleteApplication: null });
  });
});
