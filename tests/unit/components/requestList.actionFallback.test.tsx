import { describe, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { DashboardItemDto } from '@/api/web-api-client';
import InstrumentItem from '@/components/RequestList/instrumentItem';
import RequestItem from '@/components/RequestList/requestItem';
import { ModalDispatchCtx } from '@/components/modals/ModalContext';
import { DashboardItemStatus } from '@/routes/common/enums';
import type { ModalDispatch } from '@/components/modals/ModalContext';

vi.mock(
  import('@/components/Actions'),
  () =>
    ({
      default: ({
        onItemClick,
      }: {
        onItemClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
      }) => (
        <button type='button' onClick={onItemClick}>
          Invoke fallback action
        </button>
      ),
    }) satisfies __ExactMockModule<__TestMockModule50>,
);

const modalDispatch = {
  setShowBranchSelector: vi.fn<ModalDispatch['setShowBranchSelector']>(),
  setShowRFQDeleteModal: vi.fn<ModalDispatch['setShowRFQDeleteModal']>(),
  setShowRFQSelectModal: vi.fn<ModalDispatch['setShowRFQSelectModal']>(),
};

const request: DashboardItemDto = {
  referenceId: 'RFQ-FALLBACK',
  status: DashboardItemStatus.QuoteSubmitted,
  requestedFor: 'Fallback Organisation',
  requestForQuote: {
    manufacturer: 'NMI',
    model: 'Reference',
    hideFromDashboard: false,
  },
};

const renderItem = (item: React.ReactNode) =>
  render(
    <MemoryRouter>
      <ModalDispatchCtx.Provider value={modalDispatch}>
        <ul>{item}</ul>
      </ModalDispatchCtx.Provider>
    </MemoryRouter>,
  );

const resetRequestListMocks = () => {
  vi.clearAllMocks();
};

describe('requestList fallback action wiring', () => {
  it.each([
    ['RequestItem', <RequestItem key='request-item' request={request} />],
    [
      'InstrumentItem',
      <InstrumentItem key='instrument-item' request={request} />,
    ],
  ])(
    'opens the delete modal from %s when Actions invokes its fallback callback',
    async (_name, item) => {
      expect.hasAssertions();

      resetRequestListMocks();

      const user = userEvent.setup();
      renderItem(item);

      await user.click(
        screen.getByRole('button', { name: 'Invoke fallback action' }),
      );

      expect(modalDispatch.setShowRFQDeleteModal).toHaveBeenCalledWith(
        true,
        'RFQ-FALLBACK',
      );
    },
  );
});
