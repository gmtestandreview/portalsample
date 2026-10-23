import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RFQDeleteModal from '@/components/modals/RFQDeleteModal';

const mocks = vi.hoisted(() => ({
  acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'token' }),
  deleteApplication: vi.fn(),
  navigate: vi.fn(),
  setShowRFQDeleteModal: vi.fn(),
}));

vi.mock(import('@azure/msal-react'), () => ({
  useMsal: () => ({
    accounts: [],
    instance: { acquireTokenSilent: mocks.acquireTokenSilent },
  }),
}));

vi.mock(import('react-router'), () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock(import('@/components/modals/ModalContext'), () => ({
  useModalState: () => null,
  useModalDispatch: () => ({
    setShowRFQDeleteModal: mocks.setShowRFQDeleteModal,
  }),
}));

vi.mock(import('@/api/web-api-client'), () => ({
  ApplicationType: { QuoteRequest: 'QuoteRequest' },
  ApplicationClient: vi.fn(function ApplicationClientMock() {
    return {
      setAuthToken: vi.fn(),
      deleteApplication: mocks.deleteApplication,
    };
  }),
}));

vi.mock(import('@/authentication/authConfig'), () => ({
  tokenRequest: { scopes: ['scope'] },
}));

vi.mock(import('@/instrumentation/AppLogger'), () => ({
  default: { error: vi.fn() },
}));

vi.mock(import('@/analytics/GoogleAnalytics'), () => ({
  trackGAEvent: vi.fn(),
}));

vi.mock(import('react-bootstrap'), () => {
  const Modal = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );
  Modal.Header = function ModalHeader({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div>{children}</div>;
  };
  Modal.Title = function ModalTitle({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <h3>{children}</h3>;
  };
  Modal.Body = function ModalBody({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  };
  Modal.Footer = function ModalFooter({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div>{children}</div>;
  };
  return {
    Button: ({
      children,
      onClick,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button type='button' onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Modal,
  };
});

describe('rFQDeleteModal null context', () => {
  it('skips deletion and still closes and navigates', async () => {
    render(<RFQDeleteModal />);

    fireEvent.click(screen.getByRole('button', { name: /yes, delete/i }));

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/'));

    expect(mocks.deleteApplication).not.toHaveBeenCalled();
    expect(mocks.setShowRFQDeleteModal).toHaveBeenCalledWith(false, '');
  });
});
