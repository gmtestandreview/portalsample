import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type * as WebApiClientModule from '@/api/web-api-client';
import type {
  ApplicationClient,
  PatternApprovalDashboardDetailsDto,
} from '@/api/web-api-client';
import type { IPublicClientApplication } from '@azure/msal-browser';
import type * as MsalReactModule from '@azure/msal-react';
import PaRequestItem from '@/components/RequestList/paRequestItem';
import { DashboardTab } from '@/components/SearchFilter/types';
import { PaDashboardItemStatus } from '@/routes/common/enums';
import type * as NotificationModule from '@/storage/notification';
import type * as GoogleAnalyticsModule from '@/analytics/GoogleAnalytics';
import type * as ConfirmationModalModule from '@/components/modals/ConfirmationModal';

const mocks = vi.hoisted(() => ({
  acquireTokenSilent: vi.fn<IPublicClientApplication['acquireTokenSilent']>(),
  deleteApplication: vi.fn<ApplicationClient['deleteApplication']>(),
  setDeleteSuccess: vi.fn<(success: boolean) => void>(),
  setDashboardNotification:
    vi.fn<typeof NotificationModule.setDashboardNotification>(),
}));

vi.mock('@azure/msal-react', async (importOriginal) => {
  const actual = await importOriginal<typeof MsalReactModule>();

  return {
    ...actual,
    useMsal: () => ({
      accounts: [{ homeAccountId: 'account-id' }],
      instance: { acquireTokenSilent: mocks.acquireTokenSilent },
    }),
  } satisfies __ExactMockModule<__TestMockModule2>;
});

vi.mock('@/analytics/GoogleAnalytics', async (importOriginal) => {
  const actual = await importOriginal<typeof GoogleAnalyticsModule>();

  return {
    ...actual,
    trackGAEvent: vi.fn<(label: string, evtCategory?: string) => void>(),
  } satisfies __ExactMockModule<__TestMockModule22>;
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
      override setAuthToken = vi.fn<ApplicationClient['setAuthToken']>();
    },
  } satisfies __ExactMockModule<__TestMockModule4>;
});

// The real modal only opens after a delete target is chosen, so its confirm
// handler is unreachable without one. This stand-in is always rendered so the
// "confirmed with no delete target" guard in PaRequestItem can be exercised.
vi.mock('@/components/modals/ConfirmationModal', async (importOriginal) => {
  const actual = await importOriginal<typeof ConfirmationModalModule>();

  return {
    ...actual,
    default: ({ onModalYes }: Parameters<typeof actual.default>[0]) => (
      <button type='button' onClick={onModalYes}>
        Confirm without target
      </button>
    ),
  } satisfies __ExactMockModule<__TestMockModule23>;
});

const request: PatternApprovalDashboardDetailsDto = {
  referenceId: 'NMI-PA-2024-001',
  portalReferenceId: 'PA-2024-0001',
  status: PaDashboardItemStatus.PaDraft,
  title: 'Pattern approval for flow meter',
};

describe('paRequestItem without a delete target', () => {
  it('ignores a confirmation and makes no delete request', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PaRequestItem
          request={request}
          tab={DashboardTab.Drafts}
          setDeleteSuccess={mocks.setDeleteSuccess}
        />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole('button', { name: 'Confirm without target' }),
    );

    expect(mocks.acquireTokenSilent).not.toHaveBeenCalled();
    expect(mocks.deleteApplication).not.toHaveBeenCalled();
    expect(mocks.setDashboardNotification).not.toHaveBeenCalled();
    expect(mocks.setDeleteSuccess).not.toHaveBeenCalled();
  });
});
