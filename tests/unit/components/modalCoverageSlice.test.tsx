import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const mocks = vi.hoisted(() => ({
    acquireTokenSilent: vi.fn(),
    deleteApplication: vi.fn(),
    setAuthToken: vi.fn(),
    navigate: vi.fn(),
}));

vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({
        accounts: [{ homeAccountId: 'account-1' }],
        instance: {
            acquireTokenSilent: mocks.acquireTokenSilent,
        },
    }),
}));

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useNavigate: () => mocks.navigate,
    };
});

vi.mock('../../../ClientApp/src/api/web-api-client', () => ({
    ApplicationType: {
        QuoteRequest: 'QuoteRequest',
    },
    ApplicationClient: vi.fn(function (this: { setAuthToken: ReturnType<typeof vi.fn>, deleteApplication: ReturnType<typeof vi.fn> }) {
        this.setAuthToken = mocks.setAuthToken;
        this.deleteApplication = mocks.deleteApplication;
    }),
}));

vi.mock('../../../ClientApp/src/authentication/authConfig', () => ({
    tokenRequest: { scopes: ['api://mock/.default'] },
}));

vi.mock('../../../ClientApp/src/storage/notification', () => ({
    setDashboardNotification: vi.fn(),
}));

vi.mock('../../../ClientApp/src/storage/types', () => ({
    NotificationSeverity: {
        Success: 'success',
    },
}));

vi.mock('../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: {
        error: vi.fn(),
    },
}));

vi.mock('../../../ClientApp/src/analytics/GoogleAnalytics', () => ({
    trackGAEvent: vi.fn(),
}));

const ModalConsumer = () => {
    const state = useModalState();
    const dispatch = useModalDispatch();

    return (
        <>
            <p>{state?.rfqId}</p>
            <button type='button' onClick={() => dispatch?.setShowRFQDeleteModal(false, '')}>
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
    setShowBranchSelector: vi.fn(),
    setShowRFQDeleteModal: vi.fn(),
    setShowRFQSelectModal: vi.fn(),
};

const renderRFQDeleteModal = (
    state: ModalState = defaultModalState,
    dispatch: ModalDispatch = defaultModalDispatch,
) => render(
    <MemoryRouter>
        <ModalStateCtx.Provider value={state}>
            <ModalDispatchCtx.Provider value={dispatch}>
                <RFQDeleteModal />
            </ModalDispatchCtx.Provider>
        </ModalStateCtx.Provider>
    </MemoryRouter>,
);

describe('modal coverage slice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'token-1' });
        mocks.deleteApplication.mockResolvedValue(undefined);
    });

    it('exposes modal state and dispatch through providers', () => {
        const dispatch = {
            setShowBranchSelector: vi.fn(),
            setShowRFQDeleteModal: vi.fn(),
            setShowRFQSelectModal: vi.fn(),
        };

        render(
            <ModalStateCtx.Provider value={{ showBranchSelector: false, showRFQDeleteModal: true, rfqId: 'RFQ-1' }}>
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
        render(<ModalConsumer />);

        expect(screen.getByRole('button', { name: 'Close from context' })).toBeInTheDocument();
    });

    it('closes confirmation modal before yes and no callbacks', () => {
        const calls: string[] = [];
        const closeModal = vi.fn(() => calls.push('close'));
        const onModalYes = vi.fn(() => calls.push('yes'));
        const onModalNo = vi.fn(() => calls.push('no'));

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
        expect(calls).toEqual(['close', 'yes']);

        calls.length = 0;
        fireEvent.click(screen.getByRole('button', { name: /no/i }));
        expect(calls).toEqual(['close', 'no']);
    });

    it('cancels RFQ deletion by closing the modal and tracking the event', () => {
        const dispatch = { setShowBranchSelector: vi.fn(), setShowRFQDeleteModal: vi.fn(), setShowRFQSelectModal: vi.fn() };
        renderRFQDeleteModal(undefined, dispatch);

        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

        expect(dispatch.setShowRFQDeleteModal).toHaveBeenCalledWith(false, '');
        expect(trackGAEvent).toHaveBeenCalledWith('Close RFQ Delete Modal');
        expect(mocks.deleteApplication).not.toHaveBeenCalled();
    });

    it('deletes an RFQ, shows the dashboard notification, closes, tracks and navigates home', async () => {
        const dispatch = { setShowBranchSelector: vi.fn(), setShowRFQDeleteModal: vi.fn(), setShowRFQSelectModal: vi.fn() };
        renderRFQDeleteModal(undefined, dispatch);

        fireEvent.click(screen.getByRole('button', { name: /yes, delete/i }));

        await waitFor(() => expect(mocks.deleteApplication).toHaveBeenCalledWith(
            'RFQ-123',
            { applicationType: 'QuoteRequest' },
        ));
        expect(mocks.setAuthToken).toHaveBeenCalledWith('token-1');
        expect(setDashboardNotification).toHaveBeenCalledWith({
            message: 'The draft request has been successfully deleted',
            severity: 'success',
        });
        expect(dispatch.setShowRFQDeleteModal).toHaveBeenCalledWith(false, '');
        expect(trackGAEvent).toHaveBeenCalledWith('Save RFQ Delete Modal');
        expect(mocks.navigate).toHaveBeenCalledWith('/');
    });

    it('still closes and navigates when RFQ deletion fails', async () => {
        mocks.deleteApplication.mockRejectedValueOnce(new Error('delete failed'));
        const dispatch = { setShowBranchSelector: vi.fn(), setShowRFQDeleteModal: vi.fn(), setShowRFQSelectModal: vi.fn() };
        renderRFQDeleteModal(undefined, dispatch);

        fireEvent.click(screen.getByRole('button', { name: /yes, delete/i }));

        await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/'));
        expect(dispatch.setShowRFQDeleteModal).toHaveBeenCalledWith(false, '');
        expect(setDashboardNotification).not.toHaveBeenCalled();
    });

    it('closes and navigates without deleting when RFQ id is missing', async () => {
        const dispatch = { setShowBranchSelector: vi.fn(), setShowRFQDeleteModal: vi.fn(), setShowRFQSelectModal: vi.fn() };
        renderRFQDeleteModal({ showBranchSelector: false, showRFQDeleteModal: true }, dispatch);

        fireEvent.click(screen.getByRole('button', { name: /yes, delete/i }));

        await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/'));
        expect(mocks.deleteApplication).not.toHaveBeenCalled();
        expect(dispatch.setShowRFQDeleteModal).toHaveBeenCalledWith(false, '');
    });

});
