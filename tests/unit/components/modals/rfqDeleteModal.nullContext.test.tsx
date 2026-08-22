import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RFQDeleteModal from '@/components/modals/RFQDeleteModal';

const mocks = vi.hoisted(() => ({
    acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'token' }),
    deleteApplication: vi.fn(),
    navigate: vi.fn(),
    setShowRFQDeleteModal: vi.fn(),
}));

vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({
        accounts: [],
        instance: { acquireTokenSilent: mocks.acquireTokenSilent },
    }),
}));

vi.mock('react-router', () => ({
    useNavigate: () => mocks.navigate,
}));

vi.mock('@/components/modals/ModalContext', () => ({
    useModalState: () => null,
    useModalDispatch: () => ({ setShowRFQDeleteModal: mocks.setShowRFQDeleteModal }),
}));

vi.mock('@/api/web-api-client', () => ({
    ApplicationType: { QuoteRequest: 'QuoteRequest' },
    ApplicationClient: vi.fn(function ApplicationClientMock() {
        return {
            setAuthToken: vi.fn(),
            deleteApplication: mocks.deleteApplication,
        };
    }),
}));

vi.mock('@/authentication/authConfig', () => ({
    tokenRequest: { scopes: ['scope'] },
}));

vi.mock('@/instrumentation/AppLogger', () => ({
    default: { error: vi.fn() },
}));

vi.mock('@/analytics/GoogleAnalytics', () => ({
    trackGAEvent: vi.fn(),
}));

vi.mock('react-bootstrap', () => {
    const Modal = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
    Modal.Header = function ModalHeader({ children }: { children: React.ReactNode }) {
        return <div>{children}</div>;
    };
    Modal.Title = function ModalTitle({ children }: { children: React.ReactNode }) {
        return <h3>{children}</h3>;
    };
    Modal.Body = function ModalBody({ children }: { children: React.ReactNode }) {
        return <div>{children}</div>;
    };
    Modal.Footer = function ModalFooter({ children }: { children: React.ReactNode }) {
        return <div>{children}</div>;
    };
    return {
        Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
            <button type='button' onClick={onClick} {...props}>{children}</button>
        ),
        Modal,
    };
});

describe('RFQDeleteModal null context', () => {
    it('skips deletion and still closes and navigates', async () => {
        render(<RFQDeleteModal />);

        fireEvent.click(screen.getByRole('button', { name: /yes, delete/i }));

        await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/'));
        expect(mocks.deleteApplication).not.toHaveBeenCalled();
        expect(mocks.setShowRFQDeleteModal).toHaveBeenCalledWith(false, '');
    });
});
