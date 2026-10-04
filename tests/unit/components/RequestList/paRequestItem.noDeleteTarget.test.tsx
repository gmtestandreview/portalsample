import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type * as WebApiClientModule from '@/api/web-api-client';
import type { PatternApprovalDashboardDetailsDto } from '@/api/web-api-client';
import PaRequestItem from '@/components/RequestList/paRequestItem';
import { DashboardTab } from '@/components/SearchFilter/types';
import { PaDashboardItemStatus } from '@/routes/common/enums';

const mocks = vi.hoisted(() => ({
  acquireTokenSilent: vi.fn(),
  deleteApplication: vi.fn(),
  setDeleteSuccess: vi.fn(),
  setDashboardNotification: vi.fn(),
}));

vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({
    accounts: [{ homeAccountId: 'account-id' }],
    instance: { acquireTokenSilent: mocks.acquireTokenSilent },
  }),
}));

vi.mock('@/analytics/GoogleAnalytics', () => ({ trackGAEvent: vi.fn() }));

vi.mock('@/storage/notification', () => ({
  setDashboardNotification: mocks.setDashboardNotification,
}));

vi.mock('@/api/web-api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof WebApiClientModule>();

  return {
    ...actual,
    ApplicationClient: vi.fn(function ApplicationClientMock() {
      return {
        deleteApplication: mocks.deleteApplication,
        setAuthToken: vi.fn(),
      };
    }),
  };
});

// The real modal only opens after a delete target is chosen, so its confirm
// handler is unreachable without one. This stand-in is always rendered so the
// "confirmed with no delete target" guard in PaRequestItem can be exercised.
vi.mock('@/components/modals/ConfirmationModal', () => ({
  default: ({ onModalYes }: { onModalYes: () => void }) => (
    <button type='button' onClick={onModalYes}>
      Confirm without target
    </button>
  ),
}));

const request: PatternApprovalDashboardDetailsDto = {
  referenceId: 'NMI-PA-2024-001',
  portalReferenceId: 'PA-2024-0001',
  status: PaDashboardItemStatus.PaDraft,
  title: 'Pattern approval for flow meter',
};

describe('PaRequestItem without a delete target', () => {
  it('ignores a confirmation and makes no delete request', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PaRequestItem
          request={request}
          tab={DashboardTab.Drafts}
          setDeleteSuccess={mocks.setDeleteSuccess}
        />
      </MemoryRouter>
    );

    await user.click(
      screen.getByRole('button', { name: 'Confirm without target' })
    );

    expect(mocks.acquireTokenSilent).not.toHaveBeenCalled();
    expect(mocks.deleteApplication).not.toHaveBeenCalled();
    expect(mocks.setDashboardNotification).not.toHaveBeenCalled();
    expect(mocks.setDeleteSuccess).not.toHaveBeenCalled();
  });
});
