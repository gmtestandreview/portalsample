import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import ConfirmationModal from '../../../ClientApp/src/components/modals/ConfirmationModal';
import {
  type ModalDispatch,
  type ModalState,
  ModalDispatchCtx,
  ModalStateCtx,
  useModalDispatch,
  useModalState,
} from '../../../ClientApp/src/components/modals/ModalContext';
import RFQDeleteModal from '../../../ClientApp/src/components/modals/RFQDeleteModal';
import { trackGAEvent } from '../../../ClientApp/src/analytics/GoogleAnalytics';
import { setDashboardNotification } from '../../../ClientApp/src/storage/notification';
import type { DeleteApplicationCommand } from '../../../ClientApp/src/api/web-api-client';
import type { SilentRequest } from '@azure/msal-browser';

const mocks = vi.hoisted(() => ({
  acquireTokenSilent:
    vi.fn<(request: SilentRequest) => Promise<{ accessToken: string }>>(),
  deleteApplication:
    vi.fn<
      (
        referenceId: string,
        command: DeleteApplicationCommand,
        signal?: AbortSignal,
      ) => Promise<void>
    >(),
  setAuthToken: vi.fn<(token: string) => void>(),
  navigate: vi.fn<() => void>(),
}));

const expectSuccessfulRfqDeleteSideEffects = (dispatch: {
  setShowRFQDeleteModal: ReturnType<typeof vi.fn>;
}) => {
  expect(setDashboardNotification).toHaveBeenCalledWith({
    message: 'The draft request has been successfully deleted',
    severity: 'success',
  });
  expect(dispatch.setShowRFQDeleteModal).toHaveBeenCalledWith(false, '');
  expect(trackGAEvent).toHaveBeenCalledWith('Save RFQ Delete Modal');
  expect(mocks.navigate).toHaveBeenCalledWith('/');
};

vi.mock(
  import('@azure/msal-react'),
  (() =>
    ({
      useMsal: () => ({
        accounts: [{ homeAccountId: 'account-1' }],
        instance: {
          acquireTokenSilent: mocks.acquireTokenSilent,
        },
      }),
    }) satisfies __ExactMockModule<__TestMockModule2>) as unknown as __DynamicPartialMockFactory<__TestMockModule2>,
);

vi.mock(import('react-router'), async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  } satisfies __ExactMockModule<__TestMockModule11>;
});

vi.mock(
  import('../../../ClientApp/src/api/web-api-client'),
  (() =>
    ({
      ApplicationType: {
        QuoteRequest: 'QuoteRequest',
      },
      ApplicationClient: vi.fn<() => void>(function (this: {
        setAuthToken: ReturnType<typeof vi.fn>;
        deleteApplication: ReturnType<typeof vi.fn>;
      }) {
        this.setAuthToken = mocks.setAuthToken;
        this.deleteApplication = mocks.deleteApplication;
      }),
    }) satisfies __ExactMockModule<__TestMockModule4>) as unknown as __DynamicPartialMockFactory<__TestMockModule4>,
);

vi.mock(
  import('../../../ClientApp/src/authentication/authConfig'),
  () =>
    ({
      tokenRequest: { scopes: ['api://mock/.default'] },
    }) satisfies __ExactMockModule<__TestMockModule8>,
);

vi.mock(
  import('../../../ClientApp/src/storage/notification'),
  () =>
    ({
      setDashboardNotification: vi.fn<() => void>(),
    }) satisfies __ExactMockModule<__TestMockModule46>,
);

vi.mock(
  import('../../../ClientApp/src/storage/types'),
  (() =>
    ({
      NotificationSeverity: {
        Success: 'success',
      },
    }) satisfies __ExactMockModule<__TestMockModule47>) as unknown as __DynamicPartialMockFactory<__TestMockModule47>,
);

vi.mock(
  import('../../../ClientApp/src/instrumentation/AppLogger'),
  (() =>
    ({
      default: {
        error: vi.fn<() => void>(),
      },
    }) satisfies __ExactMockModule<__TestMockModule5>) as unknown as __DynamicPartialMockFactory<__TestMockModule5>,
);

vi.mock(
  import('../../../ClientApp/src/analytics/GoogleAnalytics'),
  () =>
    ({
      trackGAEvent: vi.fn<() => void>(),
    }) satisfies __ExactMockModule<__TestMockModule22>,
);

const ModalConsumer = () => {
  const state = useModalState();
  const dispatch = useModalDispatch();

  return (
    <>
      <p>{state?.rfqId}</p>
      <button
        type='button'
        onClick={() => dispatch?.setShowRFQDeleteModal(false, '')}
      >
        Close from context
      </button>
    </>
  );
};

const defaultModalState: ModalState = {
  showBranchSelector: false,
  showRFQDeleteModal: true,
  rfqId: 'RFQ-123',
};

const defaultModalDispatch: ModalDispatch = {
  setShowBranchSelector: vi.fn<ModalDispatch['setShowBranchSelector']>(),
  setShowRFQDeleteModal: vi.fn<ModalDispatch['setShowRFQDeleteModal']>(),
  setShowRFQSelectModal: vi.fn<ModalDispatch['setShowRFQSelectModal']>(),
};

const renderRFQDeleteModal = (
  state: ModalState = defaultModalState,
  dispatch: ModalDispatch = defaultModalDispatch,
) =>
  render(
    <MemoryRouter>
      <ModalStateCtx.Provider value={state}>
        <ModalDispatchCtx.Provider value={dispatch}>
          <RFQDeleteModal />
        </ModalDispatchCtx.Provider>
      </ModalStateCtx.Provider>
    </MemoryRouter>,
  );

describe('modal coverage slice', () => {
  const resetModalCoverageMocks = () => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'token-1' });
    mocks.deleteApplication.mockResolvedValue(undefined);
  };

  it('exposes modal state and dispatch through providers', () => {
    expect.hasAssertions();

    resetModalCoverageMocks();

    const dispatch = {
      setShowBranchSelector: vi.fn<() => void>(),
      setShowRFQDeleteModal: vi.fn<() => void>(),
      setShowRFQSelectModal: vi.fn<() => void>(),
    };

    render(
      <ModalStateCtx.Provider
        value={{
          showBranchSelector: false,
          showRFQDeleteModal: true,
          rfqId: 'RFQ-1',
        }}
      >
        <ModalDispatchCtx.Provider value={dispatch}>
          <ModalConsumer />
        </ModalDispatchCtx.Provider>
      </ModalStateCtx.Provider>,
    );

    expect(screen.getByText('RFQ-1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close from context' }));

    expect(dispatch.setShowRFQDeleteModal).toHaveBeenCalledWith(false, '');
  });

  it('returns null modal contexts when no provider is present', () => {
    expect.hasAssertions();

    resetModalCoverageMocks();

    render(<ModalConsumer />);

    expect(
      screen.getByRole('button', { name: 'Close from context' }),
    ).toBeInTheDocument();
  });

  it('closes confirmation modal before yes and no callbacks', () => {
    expect.hasAssertions();

    resetModalCoverageMocks();

    const calls: string[] = [];
    const closeModal = vi.fn<() => number>(() => calls.push('close'));
    const onModalYes = vi.fn<() => number>(() => calls.push('yes'));
    const onModalNo = vi.fn<() => number>(() => calls.push('no'));

    render(
      <ConfirmationModal
        isOpen
        closeModal={closeModal}
        onModalYes={onModalYes}
        onModalNo={onModalNo}
        titleText='Confirm action'
        bodyText={<p>Are you sure?</p>}
        noButtonTitle='No'
        yesButtonTitle='Yes'
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

    expect(calls).toStrictEqual(['close', 'yes']);

    calls.length = 0;
    fireEvent.click(screen.getByRole('button', { name: /no/i }));

    expect(calls).toStrictEqual(['close', 'no']);
  });

  it('cancels RFQ deletion by closing the modal and tracking the event', () => {
    expect.hasAssertions();

    resetModalCoverageMocks();

    const dispatch = {
      setShowBranchSelector: vi.fn<() => void>(),
      setShowRFQDeleteModal: vi.fn<() => void>(),
      setShowRFQSelectModal: vi.fn<() => void>(),
    };
    renderRFQDeleteModal(undefined, dispatch);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(dispatch.setShowRFQDeleteModal).toHaveBeenCalledWith(false, '');
    expect(trackGAEvent).toHaveBeenCalledWith('Close RFQ Delete Modal');
    expect(mocks.deleteApplication).not.toHaveBeenCalled();
  });

  it('deletes an RFQ, shows the dashboard notification, closes, tracks and navigates home', async () => {
    expect.hasAssertions();

    resetModalCoverageMocks();

    const dispatch = {
      setShowBranchSelector: vi.fn<() => void>(),
      setShowRFQDeleteModal: vi.fn<() => void>(),
      setShowRFQSelectModal: vi.fn<() => void>(),
    };
    renderRFQDeleteModal(undefined, dispatch);

    fireEvent.click(screen.getByRole('button', { name: /yes, delete/i }));

    await waitFor(() => {
      expect(mocks.deleteApplication).toHaveBeenCalledWith('RFQ-123', {
        applicationType: 'QuoteRequest',
      });
    });

    expect(mocks.setAuthToken).toHaveBeenCalledWith('token-1');

    expectSuccessfulRfqDeleteSideEffects(dispatch);
  });

  it('still closes and navigates when RFQ deletion fails', async () => {
    expect.hasAssertions();

    resetModalCoverageMocks();

    mocks.deleteApplication.mockRejectedValueOnce(new Error('delete failed'));
    const dispatch = {
      setShowBranchSelector: vi.fn<() => void>(),
      setShowRFQDeleteModal: vi.fn<() => void>(),
      setShowRFQSelectModal: vi.fn<() => void>(),
    };
    renderRFQDeleteModal(undefined, dispatch);

    fireEvent.click(screen.getByRole('button', { name: /yes, delete/i }));

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/');
    });

    expect(dispatch.setShowRFQDeleteModal).toHaveBeenCalledWith(false, '');
    expect(setDashboardNotification).not.toHaveBeenCalled();
  });

  it('closes and navigates without deleting when RFQ id is missing', async () => {
    expect.hasAssertions();

    resetModalCoverageMocks();

    const dispatch = {
      setShowBranchSelector: vi.fn<() => void>(),
      setShowRFQDeleteModal: vi.fn<() => void>(),
      setShowRFQSelectModal: vi.fn<() => void>(),
    };
    renderRFQDeleteModal(
      { showBranchSelector: false, showRFQDeleteModal: true },
      dispatch,
    );

    fireEvent.click(screen.getByRole('button', { name: /yes, delete/i }));

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/');
    });

    expect(mocks.deleteApplication).not.toHaveBeenCalled();
    expect(dispatch.setShowRFQDeleteModal).toHaveBeenCalledWith(false, '');
  });
});
